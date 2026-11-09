// supabase/functions/kedai/catatan.ts
// ORD.09 (giliran 2): dua aksi `catatan_tambah` dan `catatan_dibaca` (catatan berlapis, order.md O12 dan O14).
// Berkas BARU, dipanggil dari `index.ts` (satu import, satu blok sambungan, dua `case`). Kode lama tidak dipindah
// (keputusan ketua 9 Nov 2026, AGENTS.md bagian 12). Pola sama dengan `order_status.ts`.
//
// Alat bantu (klien database, pembalas, pemeta galat, pembaca peran) DIBERIKAN `index.ts` lewat parameter
// `buatAksiCatatan(alat)`, bukan diimpor, supaya berkas ini tidak mengimpor `index.ts` (yang langsung menjalankan server).
//
// Fungsi SQL: supabase/migrations/20261109_04_catatan_fungsi.sql (sudah dijalankan dan lulus cek SEBELUM berkas ini
// dideploy). Peran, kepemilikan, status, isi, dan batas (`catatan_maks_karakter`, `catatan_maks_per_order`) dicek ulang
// di fungsi SQL (aturan 4, 8, 19); di sini hanya pagar kasar dan lapis kedua peran.
//
// Aplikasi hanya mengirim id order dan isi catatan. Id akun selalu dari token login. Peran, nama penulis, waktu, dan
// penunjuk baca ditentukan server: isian seperti `peran`, `nama`, `waktu`, atau `catatan_id` diabaikan (SEC-06, SEC-19).
// Catatan tidak bisa diedit atau dihapus: memang tidak ada aksinya (SEC-15, SEC-17).
// Push catatan (O14) belum ada di sini (NTF). Tampilan catatan dan tanda "Catatan baru" adalah ORD.10.
//
// Kode galat: `id_kosong` dan `pengaturan_rusak` sengaja tidak dipetakan (jadi galat umum 500), sama seperti aksi order lain.

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

// catatan_tambah -> status dan pesan aman (AK14)
const PETA_GALAT_CATATAN_TAMBAH: PetaGalat = {
  akun_nonaktif: [403, PESAN_TIDAK_AKTIF],
  profil_tidak_ada: [400, "Lengkapi profil dulu."],
  peran_tidak_boleh: [403, "Penjaga hanya bisa membaca catatan."],
  catatan_kosong: [400, "Catatan tidak boleh kosong."],
  catatan_terlalu_panjang: [400, "Catatan terlalu panjang."],
  catatan_terlalu_banyak: [
    409,
    "Jumlah catatan di pesanan ini sudah mencapai batas.",
  ],
  order_tidak_ditemukan: [
    404,
    "Pesanan tidak ditemukan. Segarkan daftar pesanan.",
  ],
  sudah_ditolak: [
    409,
    "Pesanan ini sudah ditolak, jadi catatan tidak bisa ditambah.",
  ],
  sudah_dibatalkan: [
    409,
    "Pesanan ini sudah dibatalkan, jadi catatan tidak bisa ditambah.",
  ],
  catatan_terkunci: [
    409,
    "Pesanan sudah diproses, jadi catatan tidak bisa ditambah lagi. Segarkan daftar pesanan atau hubungi ChATA lewat WhatsApp.",
  ],
};

// catatan_dibaca -> status dan pesan aman
const PETA_GALAT_CATATAN_DIBACA: PetaGalat = {
  akun_nonaktif: [403, PESAN_TIDAK_AKTIF],
  profil_tidak_ada: [400, "Lengkapi profil dulu."],
  order_tidak_ditemukan: [
    404,
    "Pesanan tidak ditemukan. Segarkan daftar pesanan.",
  ],
};

export function buatAksiCatatan(alat: AlatKedai) {
  const { klien, bacaPeran, balas, galat, galatDariDb, regexUuid, batasTeks } =
    alat;

  // ------------------------------------------------------------
  // Aksi: catatan_tambah (order.md O12; security.md SEC-05, SEC-09, SEC-16, SEC-18, SEC-19)
  // Customer pemilik dan owner aktif. Penjaga dibalas 403 (lapis kedua). Isian: `id` (order) dan `isi` (teks catatan).
  // Kepemilikan, status (hanya Menunggu atau Disetujui), panjang, dan jumlah dicek fungsi SQL; di sini hanya pagar kasar.
  // Sukses: { ok: true, catatan: { id, nama_penulis, peran_penulis, isi, waktu }, order: { id, nomor, status },
  //           jumlah_catatan }.
  // ------------------------------------------------------------
  async function aksiCatatanTambah(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const p = await bacaPeran(pengguna.id);
    if (p.jenis === "nonaktif") {
      return galat(req, 403, PESAN_TIDAK_AKTIF);
    }
    // Lapis kedua peran: staf selain owner (penjaga) ditolak (SEC-16). Customer dan owner lanjut.
    if (p.jenis === "staf" && p.peran !== "owner") {
      return galat(req, 403, PETA_GALAT_CATATAN_TAMBAH.peran_tidak_boleh[1]);
    }

    // ID order dari aplikasi tidak dipercaya: fungsi SQL mengecek kepemilikan dan status (SEC-05, SEC-09).
    if (typeof isi.id !== "string" || !regexUuid.test(isi.id)) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }
    // Isi wajib teks; batas sebenarnya (dari pengaturan) dicek fungsi SQL, di sini hanya pagar kasar.
    if (typeof isi.isi !== "string") {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }
    if (isi.isi.length > batasTeks) {
      return galat(
        req,
        400,
        PETA_GALAT_CATATAN_TAMBAH.catatan_terlalu_panjang[1],
      );
    }

    const { data, error } = await klien.rpc("catatan_tambah", {
      p_akun: pengguna.id,
      p_order_id: isi.id,
      p_isi: isi.isi,
    });
    if (error) {
      return galatDariDb(
        req,
        error,
        PETA_GALAT_CATATAN_TAMBAH,
        "catatan_tambah",
      );
    }

    return balas(req, 200, {
      ok: true,
      catatan: data.catatan,
      order: data.order,
      jumlah_catatan: data.jumlah_catatan,
    });
  }

  // ------------------------------------------------------------
  // Aksi: catatan_dibaca (order.md O14; security.md SEC-05, SEC-09)
  // Semua peran aktif; hak lihat dijaga fungsi SQL (sama dengan order_detail, O11). Isian: `id` (order). Penunjuk
  // baca dihitung server dari catatan terbaru di order itu; aplikasi tidak mengirim id catatan.
  // Sukses: { ok: true, order_id, catatan_terakhir_id } (null bila order belum punya catatan).
  // ------------------------------------------------------------
  async function aksiCatatanDibaca(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const p = await bacaPeran(pengguna.id);
    if (p.jenis === "nonaktif") {
      return galat(req, 403, PESAN_TIDAK_AKTIF);
    }

    if (typeof isi.id !== "string" || !regexUuid.test(isi.id)) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    const { data, error } = await klien.rpc("catatan_dibaca", {
      p_akun: pengguna.id,
      p_order_id: isi.id,
    });
    if (error) {
      return galatDariDb(
        req,
        error,
        PETA_GALAT_CATATAN_DIBACA,
        "catatan_dibaca",
      );
    }

    return balas(req, 200, {
      ok: true,
      order_id: data.order_id,
      catatan_terakhir_id: data.catatan_terakhir_id,
    });
  }

  return { aksiCatatanTambah, aksiCatatanDibaca };
}
