// supabase/functions/kedai/foto.ts
// FTO.02: tiga aksi foto bukti antar: `foto_minta_unggah`, `foto_catat`, `foto_lihat` (foto-bukti.md FT1 sampai FT5).
// Berkas BARU, dipanggil dari `index.ts` (satu import, satu blok sambungan, tiga `case`). Kode lama tidak dipindah
// (keputusan ketua 9 Nov 2026, AGENTS.md bagian 12). Pola sama dengan `order_status.ts`, `catatan.ts`, `order_wakil.ts`.
//
// Alat bantu (klien database, klien Storage, pembalas, pemeta galat, pembaca peran) DIBERIKAN `index.ts` lewat parameter
// `buatAksiFoto(alat)`, bukan diimpor, supaya berkas ini tidak mengimpor `index.ts` (yang langsung menjalankan server).
// Tambahan dibanding berkas lain: `storage` (bagian Storage dari klien kunci secret), karena alamat unggah dan tautan
// lihat dibuat lewat jalur resmi Storage, bukan lewat fungsi SQL.
//
// Fungsi SQL: supabase/migrations/20261111_02_foto_fungsi.sql (harus sudah dijalankan dan lulus cek SEBELUM berkas ini
// dideploy). Peran, kepemilikan, tipe Diantar, status, penggantian oleh pengunggah asli, bentuk lokasi, dan batas ukuran
// (`foto_maks_kb`, `foto_tautan_detik` dari pengaturan) dicek ulang di fungsi SQL (aturan 4, 8, 19); di sini hanya pagar
// kasar, lapis kedua peran, dan pekerjaan Storage.
//
// Aplikasi TIDAK menentukan nama berkas, ukuran, pengunggah, waktu, atau lama tautan. Aplikasi hanya mengirim id order
// dan jenis berkas (`jpg` atau `webp`). Nama berkas dibuat server: `<id order>/<uuid acak>.<jpg|webp>`. Ukuran dibaca
// server dari Storage, bukan dari kiriman aplikasi (SEC-06). Id akun selalu dari token login.
//
// Aplikasi tidak pernah menulis langsung ke Storage tanpa alamat unggah dari server (FT5, SEC-20). Bucket privat tanpa
// policy untuk aplikasi.
//
// Berkas yang sudah terunggah tetapi ditolak `foto_catat` (misalnya terlalu besar) TIDAK dihapus di sini (tanpa DELETE,
// aturan 12); ia menjadi berkas tanpa baris dan disapu `bersihkan` kelak (FT7, FTO.05).
// Isi push dan data pribadi: tidak ada di sini. Nama berkas tidak memuat data pribadi. Tidak ada yang ditulis ke log selain
// jenis galat.
// Kode galat `id_kosong` dan `pengaturan_rusak` sengaja tidak dipetakan (jadi galat umum 500), sama seperti aksi lain.

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

// Bagian klien Storage yang dipakai: alamat unggah, tautan lihat, dan daftar isi folder (untuk membaca ukuran).
// deno-lint-ignore no-explicit-any
type HasilStorage = PromiseLike<{ data: any; error: any }>;
type BucketStorage = {
  createSignedUploadUrl: (path: string) => HasilStorage;
  createSignedUrl: (path: string, detik: number) => HasilStorage;
  list: (path: string, opsi: Record<string, unknown>) => HasilStorage;
};
type KlienStorage = { from: (bucket: string) => BucketStorage };

type PetaGalat = Record<string, [number, string]>;

export type AlatKedai = {
  klien: KlienDb;
  storage: KlienStorage;
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
};

// Nama bucket foto bukti (dibuat di FTO.01). Hanya satu bucket; tidak ada bucket foto menu.
const BUCKET = "foto-bukti";

const PESAN_TIDAK_AKTIF = "Akun ini tidak aktif. Hubungi pengelola.";
const PESAN_DATA_TIDAK_VALID = "Data belum lengkap atau tidak valid.";
const PESAN_HANYA_STAF = "Aksi ini hanya untuk penjaga atau owner.";
const PESAN_FOTO_BELUM_ADA =
  "Foto belum terunggah. Ambil foto lagi lalu coba simpan.";

// foto_cek_unggah, foto_catat, foto_lihat_cek -> status dan pesan aman (AK14)
// Satu peta untuk ketiganya (kode galat tidak bentrok).
const PETA_GALAT_FOTO: PetaGalat = {
  akun_nonaktif: [403, PESAN_TIDAK_AKTIF],
  peran_tidak_boleh: [403, PESAN_HANYA_STAF],
  order_tidak_ditemukan: [
    404,
    "Pesanan tidak ditemukan. Segarkan daftar pesanan.",
  ],
  bukan_antar: [409, "Foto bukti hanya untuk pesanan yang diantar."],
  status_tidak_boleh: [
    409,
    "Foto hanya bisa ditambah saat pesanan sedang diantar atau sudah selesai. Segarkan daftar pesanan.",
  ],
  bukan_pengunggah: [
    403,
    "Foto ini hanya bisa diganti oleh yang mengunggahnya.",
  ],
  lokasi_tidak_valid: [400, PESAN_DATA_TIDAK_VALID],
  ukuran_tidak_valid: [400, "Foto tidak valid. Ambil foto lagi."],
  ukuran_terlalu_besar: [400, "Foto terlalu besar. Ambil foto lagi."],
  foto_sudah_dicatat: [409, "Foto ini sudah tersimpan. Segarkan pesanan."],
};

// Jenis berkas yang boleh diminta aplikasi; cocok dengan jenis yang diizinkan bucket (jpeg dan webp).
const JENIS_BOLEH = ["jpg", "webp"];

export function buatAksiFoto(alat: AlatKedai) {
  const { klien, storage, bacaPeran, balas, galat, galatDariDb, regexUuid } =
    alat;

  // Lapis kedua peran untuk aksi tulis: hanya penjaga atau owner aktif (SEC-07, SEC-08).
  // Mengembalikan balasan galat bila ditolak, atau null bila boleh lanjut.
  async function tolakBukanStaf(
    req: Request,
    pengguna: Pengguna,
  ): Promise<Response | null> {
    const p = await bacaPeran(pengguna.id);
    if (p.jenis === "nonaktif") {
      return galat(req, 403, PESAN_TIDAK_AKTIF);
    }
    if (p.jenis !== "staf" || (p.peran !== "owner" && p.peran !== "penjaga")) {
      return galat(req, 403, PESAN_HANYA_STAF);
    }
    return null;
  }

  // ------------------------------------------------------------
  // Aksi: foto_minta_unggah (foto-bukti.md FT1, FT2, FT4, FT5; security.md SEC-07, SEC-08, SEC-20, SEC-29)
  // Penjaga dan owner aktif. Customer dibalas 403. Isian: `id` (order) dan `jenis` ("jpg" atau "webp").
  // Server mengecek hak (fungsi SQL foto_cek_unggah: tipe Diantar, status Diantar atau Selesai, dan bila sudah ada foto,
  // hanya pengunggah asli), lalu membuat alamat unggah bertanda tangan untuk nama berkas buatan server.
  // Sukses: { ok: true, lokasi, token, url_unggah, mengganti, maks_kb }. Aplikasi mengunggah ke `url_unggah` memakai
  // `token`, lalu memanggil `foto_catat` dengan `lokasi` yang sama.
  // ------------------------------------------------------------
  async function aksiFotoMintaUnggah(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const tolak = await tolakBukanStaf(req, pengguna);
    if (tolak) return tolak;

    // ID order dari aplikasi tidak dipercaya: fungsi SQL yang mengecek order dan haknya (SEC-09).
    if (typeof isi.id !== "string" || !regexUuid.test(isi.id)) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }
    if (typeof isi.jenis !== "string" || !JENIS_BOLEH.includes(isi.jenis)) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    const { data, error } = await klien.rpc("foto_cek_unggah", {
      p_akun: pengguna.id,
      p_order_id: isi.id,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_FOTO, "foto_cek_unggah");
    }

    // Nama berkas dibuat server (FT5). Id order huruf kecil supaya cocok dengan pagar bentuk di fungsi SQL.
    const lokasi =
      isi.id.toLowerCase() + "/" + crypto.randomUUID() + "." + isi.jenis;

    const { data: unggah, error: eUnggah } = await storage
      .from(BUCKET)
      .createSignedUploadUrl(lokasi);
    if (eUnggah || !unggah?.token || !unggah?.signedUrl) {
      throw new Error(
        "foto_alamat_unggah:" + (eUnggah?.statusCode ?? eUnggah?.status ?? ""),
      );
    }

    return balas(req, 200, {
      ok: true,
      lokasi,
      token: unggah.token,
      url_unggah: unggah.signedUrl,
      mengganti: data.mengganti === true,
      maks_kb: data.maks_kb,
    });
  }

  // ------------------------------------------------------------
  // Aksi: foto_catat (foto-bukti.md FT2, FT4, FT10; security.md SEC-07, SEC-08, SEC-29)
  // Penjaga dan owner aktif. Isian: `id` (order) dan `lokasi` (yang tadi diberikan `foto_minta_unggah`).
  // Server memeriksa berkas benar-benar ada di Storage dan membaca UKURAN-nya sendiri (bukan dari aplikasi), lalu fungsi
  // SQL foto_catat mengecek ulang hak, bentuk lokasi, dan batas ukuran, menandai foto lama diganti (bila ada), dan
  // mencatat foto baru dalam satu langkah atomik.
  // Sukses: { ok: true, order: { id, nomor, mengganti } }.
  // ------------------------------------------------------------
  async function aksiFotoCatat(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const tolak = await tolakBukanStaf(req, pengguna);
    if (tolak) return tolak;

    if (typeof isi.id !== "string" || !regexUuid.test(isi.id)) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }
    if (typeof isi.lokasi !== "string" || isi.lokasi.length > 200) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    // Pagar kasar: lokasi harus `<id order>/<nama berkas>`, folder-nya id order ini. Bentuk persisnya dicek fungsi SQL.
    const garis = isi.lokasi.indexOf("/");
    if (garis < 1 || garis === isi.lokasi.length - 1) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }
    const folder = isi.lokasi.slice(0, garis);
    const nama = isi.lokasi.slice(garis + 1);
    if (folder !== isi.id.toLowerCase() || nama.includes("/")) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    // Baca ukuran berkas dari Storage. Folder hanya milik order ini (sudah dicek di atas), jadi tidak mengintip order lain.
    const { data: daftar, error: eDaftar } = await storage
      .from(BUCKET)
      .list(folder, { limit: 5, search: nama });
    if (eDaftar) {
      throw new Error(
        "foto_baca_berkas:" + (eDaftar?.statusCode ?? eDaftar?.status ?? ""),
      );
    }
    const berkas = Array.isArray(daftar)
      ? // deno-lint-ignore no-explicit-any
        daftar.find((b: any) => b?.name === nama)
      : null;
    const ukuran = Number(berkas?.metadata?.size);
    if (!berkas || !Number.isFinite(ukuran) || ukuran < 1) {
      return galat(req, 409, PESAN_FOTO_BELUM_ADA);
    }

    const { data, error } = await klien.rpc("foto_catat", {
      p_akun: pengguna.id,
      p_order_id: isi.id,
      p_lokasi: isi.lokasi,
      p_ukuran_byte: ukuran,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_FOTO, "foto_catat");
    }

    return balas(req, 200, { ok: true, order: data });
  }

  // ------------------------------------------------------------
  // Aksi: foto_lihat (foto-bukti.md FT3, FT5, FT6; security.md SEC-05, SEC-09, SEC-20)
  // Semua peran aktif; hak lihat dijaga fungsi SQL foto_lihat_cek: customer hanya order miliknya, owner semua, penjaga
  // tidak untuk order Menunggu, Ditolak, Dibatalkan. Isian: `id` (order). Aplikasi tidak mengirim nama berkas.
  // Sukses: { ok: true, status: "ada", url, berlaku_detik, diunggah_pada }
  //      atau { ok: true, status: "dibersihkan" }  (layar: "Foto sudah dihapus")
  //      atau { ok: true, status: "tidak_ada" }.
  // Tautan hidup `foto_tautan_detik` detik (dari pengaturan). Tiap membuka foto, aplikasi minta tautan baru.
  // ------------------------------------------------------------
  async function aksiFotoLihat(
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

    const { data, error } = await klien.rpc("foto_lihat_cek", {
      p_akun: pengguna.id,
      p_order_id: isi.id,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_FOTO, "foto_lihat_cek");
    }

    if (data.status !== "ada") {
      return balas(req, 200, { ok: true, status: data.status });
    }

    const { data: tautan, error: eTautan } = await storage
      .from(BUCKET)
      .createSignedUrl(data.lokasi, data.detik);
    if (eTautan || !tautan?.signedUrl) {
      // Baris foto ada tetapi berkasnya tidak ada atau Storage bermasalah: pesan umum, tanpa galat mentah (aturan 9).
      return galat(req, 404, "Foto tidak ditemukan. Coba lagi nanti.");
    }

    return balas(req, 200, {
      ok: true,
      status: "ada",
      url: tautan.signedUrl,
      berlaku_detik: data.detik,
      diunggah_pada: data.diunggah_pada,
    });
  }

  return { aksiFotoMintaUnggah, aksiFotoCatat, aksiFotoLihat };
}
