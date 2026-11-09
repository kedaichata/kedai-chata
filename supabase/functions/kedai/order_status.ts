// supabase/functions/kedai/order_status.ts
// ORD.07 (giliran 2): tiga aksi `order_status`, `order_metode_koreksi`, `order_alih_hari`.
// Berkas BARU, dipanggil dari `index.ts` (satu import dan tiga `case`). Kode lama di `index.ts` tidak dipindah.
// Aturan sejak ORD.07 (keputusan ketua 9 Nov 2026): kode baru `kedai` ditaruh di berkas terpisah di folder ini;
// tidak ada refactor kode lama yang direncanakan.
//
// Alat bantu (klien database, pembalas, pemeta galat, pembaca peran) DIBERIKAN `index.ts` lewat parameter
// `buatAksiOrderStatus(alat)`, bukan diimpor, supaya berkas ini tidak mengimpor `index.ts` (yang langsung
// menjalankan server) dan kode lama tidak perlu dipindah.
//
// Fungsi SQL: supabase/migrations/20261109_01_order_status_alih_hari.sql (sudah dijalankan dan lulus cek
// SEBELUM berkas ini dideploy). Logika, peran, jalur status, dan batas dicek ulang di fungsi SQL (aturan 4, 8, 19);
// di sini hanya pagar kasar dan lapis kedua peran.
//
// Aplikasi hanya mengirim id order dan pilihan. Id akun selalu dari token login. Aplikasi TIDAK mengirim
// status tujuan, hari tujuan, atau peran: isian seperti `hari`, `status`, atau `tujuan` diabaikan (SEC-06, SEC-19).
// Push belum ada di sini (NTF).
//
// Kode galat: `id_kosong` sengaja tidak dipetakan (jadi galat umum 500), sama seperti aksi order lain.

// Bentuk yang sama dengan `Pengguna` dan `Peran` di index.ts.
type Pengguna = { id: string };
type Peran =
  | { jenis: "staf"; peran: string; nama: string }
  | { jenis: "nonaktif" }
  | { jenis: "customer" };

// Bagian klien database yang dipakai: hanya `rpc`.
// deno-lint-ignore no-explicit-any
type KlienDb = {
  rpc: (
    nama: string,
    argumen: Record<string, unknown>,
  ) => PromiseLike<{ data: any; error: any }>;
};

type PetaGalat = Record<string, [number, string]>;

export type AlatKedai = {
  klien: KlienDb;
  bacaPeran: (id: string) => Promise<Peran>;
  balas: (req: Request, status: number, isi: unknown) => Response;
  galat: (req: Request, status: number, pesan: string) => Response;
  galatDariDb: (
    req: Request,
    error: { message?: string; code?: string },
    peta: PetaGalat,
    nama: string,
  ) => Response;
  regexUuid: RegExp;
  batasTeks: number;
};

const PESAN_TIDAK_AKTIF = "Akun ini tidak aktif. Hubungi pengelola.";
const PESAN_DATA_TIDAK_VALID = "Data belum lengkap atau tidak valid.";

// order_status -> status dan pesan aman (AK14)
const PETA_GALAT_ORDER_STATUS: PetaGalat = {
  akun_nonaktif: [403, PESAN_TIDAK_AKTIF],
  peran_tidak_boleh: [403, "Aksi ini hanya untuk penjaga atau owner."],
  arah_tidak_valid: [400, PESAN_DATA_TIDAK_VALID],
  status_dilihat_tidak_valid: [400, PESAN_DATA_TIDAK_VALID],
  order_tidak_ditemukan: [
    404,
    "Pesanan tidak ditemukan. Segarkan daftar pesanan.",
  ],
  status_berubah: [
    409,
    "Status pesanan sudah berubah. Segarkan daftar pesanan.",
  ],
  belum_disetujui: [409, "Pesanan ini belum disetujui owner."],
  sudah_ditolak: [409, "Pesanan ini sudah ditolak."],
  sudah_dibatalkan: [409, "Pesanan ini sudah dibatalkan."],
  sudah_selesai: [
    409,
    "Pesanan sudah selesai, statusnya tidak bisa diubah lagi.",
  ],
  tidak_bisa_mundur: [409, "Status ini tidak bisa dimundurkan lagi."],
  status_tidak_cocok: [
    409,
    "Status pesanan tidak cocok dengan jenis pesanan. Hubungi pengelola.",
  ],
};

// order_metode_koreksi -> status dan pesan aman
const PETA_GALAT_ORDER_METODE: PetaGalat = {
  akun_nonaktif: [403, PESAN_TIDAK_AKTIF],
  peran_tidak_boleh: [403, "Aksi ini hanya untuk owner."],
  metode_tidak_valid: [400, "Pilih metode bayar: Transfer, Tunai, atau QRIS."],
  metode_sama: [400, "Metode bayar sama dengan sebelumnya."],
  order_tidak_ditemukan: [404, "Pesanan tidak ditemukan."],
  belum_disetujui: [
    409,
    "Pesanan ini belum disetujui, jadi belum ada metode bayar.",
  ],
  sudah_ditolak: [409, "Pesanan ini sudah ditolak."],
  sudah_dibatalkan: [
    409,
    "Pesanan ini sudah dibatalkan, metode bayar tidak bisa dikoreksi.",
  ],
  sudah_selesai: [
    409,
    "Pesanan sudah selesai, metode bayar tidak bisa dikoreksi lagi.",
  ],
};

// order_alih_hari -> status dan pesan aman
const PETA_GALAT_ORDER_ALIH: PetaGalat = {
  akun_nonaktif: [403, PESAN_TIDAK_AKTIF],
  peran_tidak_boleh: [403, "Aksi ini hanya untuk owner."],
  jam_tidak_valid: [400, "Jam harus berbentuk JJ:MM, misalnya 11:30."],
  alasan_alih_terlalu_panjang: [400, "Alasan maksimal 100 karakter."],
  order_tidak_ditemukan: [404, "Pesanan tidak ditemukan."],
  sudah_besok: [
    409,
    "Pesanan ini sudah untuk Besok, jadi tidak bisa dialihkan lagi. Segarkan daftar pesanan.",
  ],
  belum_disetujui: [
    409,
    "Pesanan ini belum disetujui, jadi tidak bisa dialihkan. Gunakan Setuju atau Tolak.",
  ],
  sudah_ditolak: [409, "Pesanan ini sudah ditolak."],
  sudah_dibatalkan: [409, "Pesanan ini sudah dibatalkan."],
  sudah_selesai: [409, "Pesanan sudah selesai, tidak bisa dialihkan."],
};

export function buatAksiOrderStatus(alat: AlatKedai) {
  const { klien, bacaPeran, balas, galat, galatDariDb, regexUuid, batasTeks } =
    alat;

  // ------------------------------------------------------------
  // Aksi: order_status (order.md O5, O10, O11; security.md SEC-08, SEC-15)
  // Penjaga dan owner aktif. Isian: `id` (order), `arah` ("maju" atau "mundur"), `status_dilihat`
  // (status yang sedang tampil di layar; hanya pembanding, bukan perintah). Status tujuan ditentukan
  // fungsi SQL dari jalur tipe order. Customer dibalas 403.
  // ------------------------------------------------------------
  async function aksiOrderStatus(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const p = await bacaPeran(pengguna.id);
    if (p.jenis === "nonaktif") {
      return galat(req, 403, PESAN_TIDAK_AKTIF);
    }
    // Lapis kedua peran: hanya penjaga atau owner (SEC-07 untuk customer)
    if (p.jenis !== "staf" || (p.peran !== "owner" && p.peran !== "penjaga")) {
      return galat(req, 403, "Aksi ini hanya untuk penjaga atau owner.");
    }

    // ID order dari aplikasi tidak dipercaya: fungsi SQL yang mengecek order dan haknya.
    if (typeof isi.id !== "string" || !regexUuid.test(isi.id)) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }
    if (isi.arah !== "maju" && isi.arah !== "mundur") {
      return galat(req, 400, PETA_GALAT_ORDER_STATUS.arah_tidak_valid[1]);
    }
    // Nilai status yang sah dicek fungsi SQL; di sini hanya pagar kasar.
    if (
      typeof isi.status_dilihat !== "string" ||
      isi.status_dilihat.length > batasTeks
    ) {
      return galat(
        req,
        400,
        PETA_GALAT_ORDER_STATUS.status_dilihat_tidak_valid[1],
      );
    }

    const { data, error } = await klien.rpc("order_status", {
      p_akun: pengguna.id,
      p_order_id: isi.id,
      p_arah: isi.arah,
      p_status_dilihat: isi.status_dilihat,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_ORDER_STATUS, "order_status");
    }

    return balas(req, 200, { ok: true, order: data });
  }

  // ------------------------------------------------------------
  // Aksi: order_metode_koreksi (order.md O23, Handoff #9; security.md SEC-07, SEC-08, SEC-11)
  // Hanya owner aktif. Isian: `id` (order) dan `metode` (Transfer, Tunai, QRIS; dicek fungsi SQL).
  // ------------------------------------------------------------
  async function aksiOrderMetodeKoreksi(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const p = await bacaPeran(pengguna.id);
    if (p.jenis === "nonaktif") {
      return galat(req, 403, PESAN_TIDAK_AKTIF);
    }
    // Lapis kedua peran: hanya owner (SEC-07 untuk customer, SEC-08 untuk penjaga)
    if (p.jenis !== "staf" || p.peran !== "owner") {
      return galat(req, 403, "Aksi ini hanya untuk owner.");
    }

    if (typeof isi.id !== "string" || !regexUuid.test(isi.id)) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }
    if (typeof isi.metode !== "string" || isi.metode.length > batasTeks) {
      return galat(req, 400, PETA_GALAT_ORDER_METODE.metode_tidak_valid[1]);
    }

    const { data, error } = await klien.rpc("order_metode_koreksi", {
      p_akun: pengguna.id,
      p_order_id: isi.id,
      p_metode: isi.metode,
    });
    if (error) {
      return galatDariDb(
        req,
        error,
        PETA_GALAT_ORDER_METODE,
        "order_metode_koreksi",
      );
    }

    return balas(req, 200, { ok: true, order: data });
  }

  // ------------------------------------------------------------
  // Aksi: order_alih_hari (order.md blok 8 Nov 2026; security.md blok 8 Nov 2026, SEC-07, SEC-08, SEC-19)
  // Hanya owner aktif. Isian: `id` (order), `jam` (opsional, JJ:MM; kosong = jam lama), `alasan`
  // (opsional, maks 100 karakter, dicek fungsi SQL; hanya masuk riwayat). Hari tujuan SELALU Besok dari
  // jam server: isian `hari` atau tanggal dari aplikasi diabaikan.
  // ------------------------------------------------------------
  async function aksiOrderAlihHari(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const p = await bacaPeran(pengguna.id);
    if (p.jenis === "nonaktif") {
      return galat(req, 403, PESAN_TIDAK_AKTIF);
    }
    if (p.jenis !== "staf" || p.peran !== "owner") {
      return galat(req, 403, "Aksi ini hanya untuk owner.");
    }

    if (typeof isi.id !== "string" || !regexUuid.test(isi.id)) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    // Jam opsional; format sebenarnya dicek fungsi SQL.
    let jam: string | null = null;
    if (isi.jam !== undefined && isi.jam !== null) {
      if (typeof isi.jam !== "string" || isi.jam.length > batasTeks) {
        return galat(req, 400, PETA_GALAT_ORDER_ALIH.jam_tidak_valid[1]);
      }
      jam = isi.jam;
    }

    // Alasan opsional; batas 100 karakter sebenarnya dicek fungsi SQL.
    let alasan: string | null = null;
    if (isi.alasan !== undefined && isi.alasan !== null) {
      if (typeof isi.alasan !== "string" || isi.alasan.length > batasTeks) {
        return galat(
          req,
          400,
          PETA_GALAT_ORDER_ALIH.alasan_alih_terlalu_panjang[1],
        );
      }
      alasan = isi.alasan;
    }

    const { data, error } = await klien.rpc("order_alih_hari", {
      p_akun: pengguna.id,
      p_order_id: isi.id,
      p_jam: jam,
      p_alasan: alasan,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_ORDER_ALIH, "order_alih_hari");
    }

    return balas(req, 200, { ok: true, order: data });
  }

  return { aksiOrderStatus, aksiOrderMetodeKoreksi, aksiOrderAlihHari };
}
