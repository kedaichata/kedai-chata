// supabase/functions/kedai/pelanggan_luar.ts
// ORD.11 (giliran 2): tiga aksi `pelanggan_luar_daftar`, `pelanggan_luar_simpan`, `pelanggan_luar_nonaktif`
// (pelanggan tanpa akun, order.md O16). Hanya owner.
// Berkas BARU, dipanggil dari `index.ts` (satu import, satu blok sambungan, tiga `case`). Kode lama tidak dipindah
// (keputusan ketua 9 Nov 2026, AGENTS.md bagian 12). Pola sama dengan `order_status.ts` dan `catatan.ts`.
//
// Alat bantu (klien database, pembalas, pemeta galat, pembaca peran) DIBERIKAN `index.ts` lewat parameter
// `buatAksiPelangganLuar(alat)`, bukan diimpor, supaya berkas ini tidak mengimpor `index.ts` (yang langsung
// menjalankan server).
//
// Fungsi SQL: supabase/migrations/20261109_05_pelanggan_luar_fungsi.sql (sudah dijalankan dan lulus cek SEBELUM
// berkas ini dideploy). Peran, panjang isian, format nomor WA, dan cek nama kembar dicek ulang di fungsi SQL
// (aturan 4, 8, 19); di sini hanya pagar kasar dan lapis kedua peran.
//
// Aplikasi hanya mengirim id pelanggan dan isian pelanggan. Id akun selalu dari token login. Isian lain
// (misalnya `dibuat_oleh`, `aktif`, `peran`) diabaikan. Pelanggan tidak bisa dihapus: memang tidak ada aksinya
// (security.md aturan 15). Aktifkan lagi lewat `pelanggan_luar_simpan` dengan `aktifkan: true` (keputusan ketua
// 9 Nov 2026, pola sama dengan `menu_simpan`).
//
// Data pribadi (nama, nomor WA, alamat): tidak ditulis ke log dan tidak dimuat di pesan galat.
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
const PESAN_HANYA_OWNER = "Aksi ini hanya untuk owner.";
const PESAN_DATA_TIDAK_VALID = "Data belum lengkap atau tidak valid.";

// pelanggan_luar_daftar -> status dan pesan aman (AK14)
const PETA_GALAT_PELANGGAN_DAFTAR: PetaGalat = {
  akun_nonaktif: [403, PESAN_TIDAK_AKTIF],
  peran_tidak_boleh: [403, PESAN_HANYA_OWNER],
};

// pelanggan_luar_simpan -> status dan pesan aman
const PETA_GALAT_PELANGGAN_SIMPAN: PetaGalat = {
  akun_nonaktif: [403, PESAN_TIDAK_AKTIF],
  peran_tidak_boleh: [403, PESAN_HANYA_OWNER],
  nama_tidak_valid: [400, "Nama harus 3 sampai 30 karakter."],
  keterangan_tidak_valid: [
    400,
    "Keterangan harus 3 sampai 100 karakter, atau dikosongkan.",
  ],
  wa_tidak_valid: [
    400,
    "Nomor WA tidak valid. Contoh: 081234567890, atau dikosongkan.",
  ],
  alamat_tidak_valid: [
    400,
    "Alamat antar harus 10 sampai 200 karakter, atau dikosongkan.",
  ],
  pelanggan_sudah_ada: [
    409,
    "Pelanggan dengan nama dan keterangan yang sama sudah ada. Beri keterangan lain untuk membedakan.",
  ],
  pelanggan_tidak_ditemukan: [
    404,
    "Pelanggan tidak ditemukan. Segarkan daftar pelanggan.",
  ],
};

// pelanggan_luar_nonaktif -> status dan pesan aman
const PETA_GALAT_PELANGGAN_NONAKTIF: PetaGalat = {
  akun_nonaktif: [403, PESAN_TIDAK_AKTIF],
  peran_tidak_boleh: [403, PESAN_HANYA_OWNER],
  pelanggan_tidak_ditemukan: [
    404,
    "Pelanggan tidak ditemukan. Segarkan daftar pelanggan.",
  ],
};

export function buatAksiPelangganLuar(alat: AlatKedai) {
  const { klien, bacaPeran, balas, galat, galatDariDb, regexUuid, batasTeks } =
    alat;

  // Lapis kedua peran: hanya owner aktif (SEC-07 untuk customer, SEC-14 untuk customer dan penjaga).
  // Mengembalikan Response penolakan, atau null bila boleh lanjut.
  async function tolakBukanOwner(
    req: Request,
    pengguna: Pengguna,
  ): Promise<Response | null> {
    const p = await bacaPeran(pengguna.id);
    if (p.jenis === "nonaktif") {
      return galat(req, 403, PESAN_TIDAK_AKTIF);
    }
    if (p.jenis !== "staf" || p.peran !== "owner") {
      return galat(req, 403, PESAN_HANYA_OWNER);
    }
    return null;
  }

  // Kolom teks opsional pada simpan: kolom WAJIB ada di isian (tidak dikirim = ditolak, supaya data lama tidak
  // terhapus tanpa sengaja). Teks atau null; null dan teks kosong sama-sama berarti "dikosongkan" (dirapikan
  // fungsi SQL). Panjang sebenarnya dicek fungsi SQL; di sini hanya pagar kasar.
  // Mengembalikan { sah: false } bila bentuknya salah.
  function bacaKolomOpsional(
    nilai: unknown,
  ): { sah: true; teks: string | null } | { sah: false } {
    if (nilai === null) {
      return { sah: true, teks: null };
    }
    if (typeof nilai !== "string" || nilai.length > batasTeks) {
      return { sah: false };
    }
    return { sah: true, teks: nilai };
  }

  // ------------------------------------------------------------
  // Aksi: pelanggan_luar_daftar (order.md O16; security.md SEC-07, SEC-14)
  // Hanya owner aktif. Isian: `semua` (opsional, true/false; true = ikut menampilkan yang nonaktif, bawaan false).
  // Sukses: { ok: true, daftar: [ { id, nama, keterangan, nomor_wa, alamat_antar, aktif } ] }.
  // Urutan dari server: abjad nama; bila ikut nonaktif, yang aktif di atas.
  // ------------------------------------------------------------
  async function aksiPelangganLuarDaftar(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const tolak = await tolakBukanOwner(req, pengguna);
    if (tolak) return tolak;

    let semua = false;
    if (isi.semua !== undefined && isi.semua !== null) {
      if (typeof isi.semua !== "boolean") {
        return galat(req, 400, PESAN_DATA_TIDAK_VALID);
      }
      semua = isi.semua;
    }

    const { data, error } = await klien.rpc("pelanggan_luar_daftar", {
      p_akun: pengguna.id,
      p_semua: semua,
    });
    if (error) {
      return galatDariDb(
        req,
        error,
        PETA_GALAT_PELANGGAN_DAFTAR,
        "pelanggan_luar_daftar",
      );
    }

    return balas(req, 200, { ok: true, daftar: data });
  }

  // ------------------------------------------------------------
  // Aksi: pelanggan_luar_simpan (order.md O16; security.md SEC-07, SEC-14, SEC-18)
  // Hanya owner aktif. Isian: `id` (kosong = tambah baru; terisi = ubah pelanggan itu), `nama` (wajib),
  // `keterangan`, `nomor_wa`, `alamat_antar` (ketiganya WAJIB ada di isian, teks atau null; kosong = dikosongkan),
  // `aktifkan` (true = aktifkan lagi pelanggan yang nonaktif; selain true dianggap tidak; diabaikan saat tambah baru).
  // Sukses: { ok: true, pelanggan: { id, nama, keterangan, nomor_wa, alamat_antar, aktif } }.
  // ------------------------------------------------------------
  async function aksiPelangganLuarSimpan(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const tolak = await tolakBukanOwner(req, pengguna);
    if (tolak) return tolak;

    // `id` kosong = tambah baru; `id` terisi = ubah pelanggan itu (keberadaannya dicek fungsi SQL).
    let idPelanggan: string | null = null;
    if (isi.id !== undefined && isi.id !== null) {
      if (typeof isi.id !== "string" || !regexUuid.test(isi.id)) {
        return galat(req, 400, PESAN_DATA_TIDAK_VALID);
      }
      idPelanggan = isi.id;
    }

    // Nama wajib teks; batas sebenarnya (3 sampai 30) dicek fungsi SQL.
    if (typeof isi.nama !== "string" || isi.nama.length > batasTeks) {
      return galat(req, 400, PETA_GALAT_PELANGGAN_SIMPAN.nama_tidak_valid[1]);
    }

    const keterangan = bacaKolomOpsional(isi.keterangan);
    if (!keterangan.sah) {
      return galat(
        req,
        400,
        PETA_GALAT_PELANGGAN_SIMPAN.keterangan_tidak_valid[1],
      );
    }
    const nomorWa = bacaKolomOpsional(isi.nomor_wa);
    if (!nomorWa.sah) {
      return galat(req, 400, PETA_GALAT_PELANGGAN_SIMPAN.wa_tidak_valid[1]);
    }
    const alamat = bacaKolomOpsional(isi.alamat_antar);
    if (!alamat.sah) {
      return galat(req, 400, PETA_GALAT_PELANGGAN_SIMPAN.alamat_tidak_valid[1]);
    }

    const aktifkan = isi.aktifkan === true;

    const { data, error } = await klien.rpc("pelanggan_luar_simpan", {
      p_akun: pengguna.id,
      p_id: idPelanggan,
      p_nama: isi.nama,
      p_keterangan: keterangan.teks,
      p_wa: nomorWa.teks,
      p_alamat: alamat.teks,
      p_aktifkan: aktifkan,
    });
    if (error) {
      return galatDariDb(
        req,
        error,
        PETA_GALAT_PELANGGAN_SIMPAN,
        "pelanggan_luar_simpan",
      );
    }

    return balas(req, 200, { ok: true, pelanggan: data });
  }

  // ------------------------------------------------------------
  // Aksi: pelanggan_luar_nonaktif (order.md O16; security.md SEC-07, SEC-14)
  // Hanya owner aktif. Isian: `id` (pelanggan). Pelanggan yang sudah nonaktif: sukses tanpa perubahan.
  // Sukses: { ok: true, pelanggan: { id, nama, keterangan, nomor_wa, alamat_antar, aktif } }.
  // ------------------------------------------------------------
  async function aksiPelangganLuarNonaktif(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const tolak = await tolakBukanOwner(req, pengguna);
    if (tolak) return tolak;

    if (typeof isi.id !== "string" || !regexUuid.test(isi.id)) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    const { data, error } = await klien.rpc("pelanggan_luar_nonaktif", {
      p_akun: pengguna.id,
      p_id: isi.id,
    });
    if (error) {
      return galatDariDb(
        req,
        error,
        PETA_GALAT_PELANGGAN_NONAKTIF,
        "pelanggan_luar_nonaktif",
      );
    }

    return balas(req, 200, { ok: true, pelanggan: data });
  }

  return {
    aksiPelangganLuarDaftar,
    aksiPelangganLuarSimpan,
    aksiPelangganLuarNonaktif,
  };
}
