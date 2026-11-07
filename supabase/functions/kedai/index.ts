// supabase/functions/kedai/index.ts
// AKN.04: Edge Function `kedai` versi pertama (opsi A).
// Aksi yang ada: `status` dan `daftar_profil`. Aksi lain ditambah di langkah berikutnya.
// AKN.07: ditambah `alamat_simpan` dan `alamat_nonaktif` (buku alamat, akun.md AK9).
// AKN.08a: ditambah `ganti_nama` dan `ganti_wa` (menu Akun, akun.md AK7, AK8).
// MNU.02: ditambah `menu_daftar`, `menu_simpan`, `menu_stok`, `menu_nonaktif` (menu.md MN5).
// MNU.07: `menu_simpan` menerima isian `deskripsi` (WAJIB dikirim, teks, boleh kosong; boleh beberapa baris)
//         dan memanggil fungsi SQL menu_simpan versi 7 argumen. Kode galat baru: deskripsi_tidak_valid.
//         `menu_daftar` tidak diubah di sini: fungsi SQL-nya kini membawa field `deskripsi`.
// MNU.09 (giliran 2): ditambah `grup_daftar`, `grup_simpan`, `grup_nonaktif`, `menu_grup_atur`
//         (grup pilihan gratis; semuanya owner saja). `menu_daftar` tidak diubah di sini:
//         fungsi SQL-nya kini membawa field `grup`. Kode galat baru dipetakan di PETA_GALAT_GRUP.
//
// Deploy (urutan aman AGENTS.md bagian 8), TANPA --no-verify-jwt:
//   supabase functions deploy kedai --use-api --project-ref "$PROJECT_REF"
//
// Rahasia: kunci secret Supabase (sb_secret_...) dibaca dari variabel lingkungan
// fungsi bernama KUNCI_SECRET_KEDAI (diisi ketua di dashboard). DILARANG ditulis di kode.
// SUPABASE_URL diisi otomatis oleh platform.

import { createClient } from "npm:@supabase/supabase-js@2.58.0";

// ------------------------------------------------------------
// Pengaturan dasar
// ------------------------------------------------------------

// Asal (origin) yang boleh memanggil dari peramban: hanya GitHub Pages ChATA.
const ASAL_DIIZINKAN = ["https://kedaichata.github.io"];

// Pengaturan yang aman ditampilkan ke aplikasi (selain ini tidak dikirim).
const PENGATURAN_AMAN = ["alamat_maks"];

// Batas ukuran isi permintaan (karakter), cegah kiriman berlebihan.
const BATAS_ISI = 10000;

// Batas panjang tiap isian teks sebelum diteruskan ke fungsi SQL.
// Aturan sebenarnya dicek fungsi SQL (aturan 19); ini hanya pagar kasar.
const BATAS_TEKS = 500;

// ------------------------------------------------------------
// Klien database (kunci secret, hanya di dalam fungsi)
// ------------------------------------------------------------

const URL_PROJECT = Deno.env.get("SUPABASE_URL") ?? "";
const KUNCI_SECRET = Deno.env.get("KUNCI_SECRET_KEDAI") ?? "";

const admin =
  URL_PROJECT && KUNCI_SECRET
    ? createClient(URL_PROJECT, KUNCI_SECRET, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

// ------------------------------------------------------------
// Pembantu balasan dan CORS
// ------------------------------------------------------------

function headerCors(req: Request): Record<string, string> {
  const asal = req.headers.get("origin") ?? "";
  const h: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Max-Age": "600",
  };
  if (ASAL_DIIZINKAN.includes(asal)) {
    h["Access-Control-Allow-Origin"] = asal;
  }
  return h;
}

function balas(req: Request, status: number, isi: unknown): Response {
  return new Response(JSON.stringify(isi), {
    status,
    headers: {
      ...headerCors(req),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function galat(req: Request, status: number, pesan: string): Response {
  return balas(req, status, { ok: false, pesan });
}

// ------------------------------------------------------------
// Lapis kedua: verifikasi token login sendiri (paling awal)
// Tanpa token atau token tidak valid: 401.
// Token yang lolos platform tetapi bukan token pengguna login
// (misalnya JWT kunci anon lama) juga ditolak: getUser gagal / tanpa id.
// ------------------------------------------------------------

type Pengguna = { id: string };

async function verifikasiToken(req: Request): Promise<Pengguna | null> {
  if (!admin) return null;
  const header = req.headers.get("authorization") ?? "";
  const cocok = header.match(/^Bearer\s+([A-Za-z0-9._-]+)$/);
  if (!cocok) return null;
  const token = cocok[1];

  // Kunci Supabase (bukan JWT) tidak pernah dianggap token pengguna.
  if (token.startsWith("sb_")) return null;

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  if (data.user.is_anonymous) return null;
  return { id: data.user.id };
}

// ------------------------------------------------------------
// Peran: dibaca server dari tabel staf (AK4)
// ------------------------------------------------------------

type Peran =
  | { jenis: "staf"; peran: string; nama: string }
  | { jenis: "nonaktif" }
  | { jenis: "customer" };

async function bacaPeran(id: string): Promise<Peran> {
  const { data, error } = await admin!
    .from("staf")
    .select("nama_tampilan, peran, aktif")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("baca_staf:" + (error.code ?? ""));
  if (!data) return { jenis: "customer" };
  if (!data.aktif) return { jenis: "nonaktif" };
  return { jenis: "staf", peran: data.peran, nama: data.nama_tampilan };
}

// ------------------------------------------------------------
// Aksi: status (semua yang login)
// ------------------------------------------------------------

async function aksiStatus(req: Request, pengguna: Pengguna): Promise<Response> {
  const p = await bacaPeran(pengguna.id);

  if (p.jenis === "nonaktif") {
    return galat(req, 403, "Akun ini tidak aktif. Hubungi pengelola.");
  }

  // Pengaturan yang aman ditampilkan
  const { data: baris, error: eSet } = await admin!
    .from("pengaturan")
    .select("kunci, nilai")
    .in("kunci", PENGATURAN_AMAN);
  if (eSet) throw new Error("baca_pengaturan:" + (eSet.code ?? ""));
  const pengaturan: Record<string, number | string> = {};
  for (const b of baris ?? []) {
    const angka = Number(b.nilai);
    pengaturan[b.kunci] = Number.isFinite(angka) ? angka : b.nilai;
  }

  // Staf: tidak punya profil customer dan alamat (AK4)
  if (p.jenis === "staf") {
    return balas(req, 200, {
      ok: true,
      peran: p.peran,
      nama_tampilan: p.nama,
      profil: null,
      alamat: [],
      pengaturan,
    });
  }

  // Customer: profil (bila sudah ada) dan alamat aktif miliknya sendiri
  const { data: profil, error: eProfil } = await admin!
    .from("profil")
    .select("nama_tampilan, nomor_wa")
    .eq("id", pengguna.id)
    .maybeSingle();
  if (eProfil) throw new Error("baca_profil:" + (eProfil.code ?? ""));

  let alamat: unknown[] = [];
  if (profil) {
    const { data, error: eAlamat } = await admin!
      .from("alamat")
      .select("id, alias, isi")
      .eq("pemilik", pengguna.id)
      .eq("aktif", true)
      .order("dibuat_pada", { ascending: true });
    if (eAlamat) throw new Error("baca_alamat:" + (eAlamat.code ?? ""));
    alamat = data ?? [];
  }

  // Profil null = aplikasi menampilkan layar Lengkapi profil (AK6)
  return balas(req, 200, {
    ok: true,
    peran: "customer",
    nama_tampilan: profil?.nama_tampilan ?? null,
    profil: profil
      ? { nama_tampilan: profil.nama_tampilan, nomor_wa: profil.nomor_wa }
      : null,
    alamat,
    pengaturan,
  });
}

// ------------------------------------------------------------
// Aksi: daftar_profil (customer)
// ID selalu dari token. Isian lain (peran, id, dst) diabaikan (SEC-06).
// ------------------------------------------------------------

// Kode galat fungsi SQL buat_profil -> status dan pesan aman (AK14)
const PETA_GALAT_PROFIL: Record<string, [number, string]> = {
  nama_tidak_valid: [
    400,
    "Nama 3 sampai 20 karakter, hanya huruf, angka, spasi, dan garis bawah.",
  ],
  wa_tidak_valid: [400, "Nomor WA tidak valid."],
  alias_tidak_valid: [400, "Nama alamat harus 3 sampai 30 karakter."],
  alamat_tidak_valid: [400, "Isi alamat harus 10 sampai 200 karakter."],
  profil_sudah_ada: [409, "Profil sudah pernah dibuat."],
  akun_staf: [403, "Akun staf tidak memakai profil customer."],
};

function teksAtauNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  if (v.length > BATAS_TEKS) return null;
  return v;
}

async function aksiDaftarProfil(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const p = await bacaPeran(pengguna.id);
  if (p.jenis !== "customer") {
    return galat(req, 403, "Aksi ini hanya untuk customer.");
  }

  const nama = teksAtauNull(isi.nama);
  const wa = teksAtauNull(isi.wa);
  const alias = teksAtauNull(isi.alias);
  const alamat = teksAtauNull(isi.alamat);
  if (nama === null || wa === null || alias === null || alamat === null) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  const { error } = await admin!.rpc("buat_profil", {
    p_id: pengguna.id,
    p_nama: nama,
    p_wa: wa,
    p_alias: alias,
    p_alamat: alamat,
  });

  if (error) {
    const pesanDb = error.message ?? "";
    for (const kode of Object.keys(PETA_GALAT_PROFIL)) {
      if (pesanDb.includes(kode)) {
        const [status, pesan] = PETA_GALAT_PROFIL[kode];
        return galat(req, status, pesan);
      }
    }
    // Kode lain (id_kosong, pengaturan_rusak, dst): galat umum
    throw new Error("buat_profil:" + (error.code ?? ""));
  }

  return balas(req, 200, { ok: true });
}

// ------------------------------------------------------------
// Aksi: alamat_simpan dan alamat_nonaktif (customer) (AKN.07, AK9)
// ID pemilik selalu dari token. ID alamat dari aplikasi tidak dipercaya:
// fungsi SQL mengecek kepemilikannya (SEC-09). Balasan sukses memuat daftar
// alamat aktif terbaru supaya aplikasi tidak perlu memanggil `status` lagi.
// ------------------------------------------------------------

const REGEX_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Kode galat fungsi SQL alamat_simpan dan alamat_nonaktif -> status dan pesan aman (AK14)
const PETA_GALAT_ALAMAT: Record<string, [number, string]> = {
  alias_tidak_valid: [400, "Nama alamat harus 3 sampai 30 karakter."],
  alamat_tidak_valid: [400, "Isi alamat harus 10 sampai 200 karakter."],
  alamat_penuh: [
    409,
    "Jumlah alamat sudah mencapai batas. Nonaktifkan salah satu dulu.",
  ],
  alamat_terakhir: [409, "Minimal harus ada satu alamat aktif."],
  alamat_tidak_ditemukan: [404, "Alamat tidak ditemukan."],
  profil_tidak_ada: [400, "Lengkapi profil dulu."],
};

// Daftar alamat aktif milik sendiri (kueri yang sama dengan `status`).
async function bacaAlamatAktif(id: string): Promise<unknown[]> {
  const { data, error } = await admin!
    .from("alamat")
    .select("id, alias, isi")
    .eq("pemilik", id)
    .eq("aktif", true)
    .order("dibuat_pada", { ascending: true });
  if (error) throw new Error("baca_alamat:" + (error.code ?? ""));
  return data ?? [];
}

// Galat fungsi SQL: kode yang dikenal dibalas pesan aman, selain itu dilempar (jadi 500 umum).
function galatDariDb(
  req: Request,
  error: { message?: string; code?: string },
  peta: Record<string, [number, string]>,
  nama: string,
): Response {
  const pesanDb = error.message ?? "";
  for (const kode of Object.keys(peta)) {
    if (pesanDb.includes(kode)) {
      const [status, pesan] = peta[kode];
      return galat(req, status, pesan);
    }
  }
  throw new Error(nama + ":" + (error.code ?? ""));
}

async function aksiAlamatSimpan(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const p = await bacaPeran(pengguna.id);
  if (p.jenis !== "customer") {
    return galat(req, 403, "Aksi ini hanya untuk customer.");
  }

  const alias = teksAtauNull(isi.alias);
  const teksAlamat = teksAtauNull(isi.isi);
  if (alias === null || teksAlamat === null) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  // `id` kosong = tambah alamat baru; `id` terisi = ubah alamat itu.
  let idAlamat: string | null = null;
  if (isi.id !== undefined && isi.id !== null) {
    if (typeof isi.id !== "string" || !REGEX_UUID.test(isi.id)) {
      return galat(req, 400, "Data belum lengkap atau tidak valid.");
    }
    idAlamat = isi.id;
  }

  const { error } = await admin!.rpc("alamat_simpan", {
    p_pemilik: pengguna.id,
    p_id: idAlamat,
    p_alias: alias,
    p_isi: teksAlamat,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_ALAMAT, "alamat_simpan");
  }

  return balas(req, 200, {
    ok: true,
    alamat: await bacaAlamatAktif(pengguna.id),
  });
}

async function aksiAlamatNonaktif(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const p = await bacaPeran(pengguna.id);
  if (p.jenis !== "customer") {
    return galat(req, 403, "Aksi ini hanya untuk customer.");
  }

  if (typeof isi.id !== "string" || !REGEX_UUID.test(isi.id)) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  const { error } = await admin!.rpc("alamat_nonaktif", {
    p_pemilik: pengguna.id,
    p_id: isi.id,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_ALAMAT, "alamat_nonaktif");
  }

  return balas(req, 200, {
    ok: true,
    alamat: await bacaAlamatAktif(pengguna.id),
  });
}

// ------------------------------------------------------------
// Aksi: ganti_nama dan ganti_wa (customer) (AKN.08a, AK7, AK8)
// ID pemilik selalu dari token. Aplikasi hanya mengirim nilai barunya.
// Aturan sebenarnya dicek fungsi SQL ganti_nama dan ganti_wa; ini hanya pagar kasar.
// Staf tidak punya profil customer: ditolak 403 di sini dan profil_tidak_ada di SQL.
// ------------------------------------------------------------

// Kode galat fungsi SQL ganti_nama dan ganti_wa -> status dan pesan aman (AK14)
const PETA_GALAT_UBAH_PROFIL: Record<string, [number, string]> = {
  nama_tidak_valid: [
    400,
    "Nama 3 sampai 20 karakter, hanya huruf, angka, spasi, dan garis bawah.",
  ],
  wa_tidak_valid: [400, "Nomor WA tidak valid."],
  profil_tidak_ada: [400, "Lengkapi profil dulu."],
};

async function aksiGantiNama(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const p = await bacaPeran(pengguna.id);
  if (p.jenis !== "customer") {
    return galat(req, 403, "Aksi ini hanya untuk customer.");
  }

  const nama = teksAtauNull(isi.nama);
  if (nama === null) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  const { error } = await admin!.rpc("ganti_nama", {
    p_pemilik: pengguna.id,
    p_nama: nama,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_UBAH_PROFIL, "ganti_nama");
  }

  return balas(req, 200, { ok: true });
}

async function aksiGantiWa(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const p = await bacaPeran(pengguna.id);
  if (p.jenis !== "customer") {
    return galat(req, 403, "Aksi ini hanya untuk customer.");
  }

  const wa = teksAtauNull(isi.wa);
  if (wa === null) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  const { error } = await admin!.rpc("ganti_wa", {
    p_pemilik: pengguna.id,
    p_wa: wa,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_UBAH_PROFIL, "ganti_wa");
  }

  return balas(req, 200, { ok: true });
}

// ------------------------------------------------------------
// Aksi: menu_daftar, menu_simpan, menu_stok, menu_nonaktif (MNU.02, menu.md MN5)
// `menu_daftar`: semua peran (nonaktif ditolak). Owner mendapat semua menu,
// customer dan penjaga hanya menu aktif. Yang lain: hanya owner (SEC-07, SEC-08).
// ID pelaku selalu dari token. Aplikasi hanya mengirim nama, harga, nama berkas
// foto, dan pilihan; peran dan id pelaku dari aplikasi diabaikan (SEC-06).
// Aturan sebenarnya dicek fungsi SQL (aturan 19); ini hanya pagar kasar.
// Balasan sukses memuat daftar menu terbaru supaya aplikasi tidak perlu memanggil lagi.
// ------------------------------------------------------------

// Kode galat fungsi SQL menu -> status dan pesan aman (AK14)
// (id_kosong dan pengaturan_rusak sengaja tidak dipetakan: jadi galat umum 500)
const PETA_GALAT_MENU: Record<string, [number, string]> = {
  bukan_owner: [403, "Aksi ini hanya untuk owner."],
  nama_tidak_valid: [400, "Nama menu 3 sampai 40 karakter."],
  harga_tidak_valid: [400, "Harga tidak valid atau melebihi batas."],
  foto_tidak_valid: [
    400,
    "Nama berkas foto hanya huruf kecil, angka, dan strip, berakhiran .jpg atau .webp.",
  ],
  nama_kembar: [409, "Sudah ada menu aktif dengan nama yang sama."],
  menu_tidak_ditemukan: [404, "Menu tidak ditemukan."],
  menu_tidak_aktif: [409, "Menu ini nonaktif. Aktifkan dulu."],
  stok_tidak_valid: [400, "Data belum lengkap atau tidak valid."],
  // MNU.07: batas panjang ada di pengaturan `deskripsi_menu_maks`, jadi pesan tanpa angka (tidak ditulis mati).
  deskripsi_tidak_valid: [400, "Deskripsi menu terlalu panjang."],
};

// Batas atas bilangan bulat 32-bit (kolom harga bertipe integer).
const BATAS_INTEGER = 2147483647;

// Lapis kedua peran owner: bukan staf aktif berperan owner = 403.
async function tolakBukanOwner(
  req: Request,
  pengguna: Pengguna,
): Promise<Response | null> {
  const p = await bacaPeran(pengguna.id);
  if (p.jenis === "nonaktif") {
    return galat(req, 403, "Akun ini tidak aktif. Hubungi pengelola.");
  }
  if (p.jenis !== "staf" || p.peran !== "owner") {
    return galat(req, 403, "Aksi ini hanya untuk owner.");
  }
  return null;
}

// Daftar menu dari fungsi SQL (semua = true hanya untuk owner).
async function bacaDaftarMenu(semua: boolean): Promise<unknown[]> {
  const { data, error } = await admin!.rpc("menu_daftar", { p_semua: semua });
  if (error) throw new Error("menu_daftar:" + (error.code ?? ""));
  return Array.isArray(data) ? data : [];
}

async function aksiMenuDaftar(
  req: Request,
  pengguna: Pengguna,
): Promise<Response> {
  const p = await bacaPeran(pengguna.id);
  if (p.jenis === "nonaktif") {
    return galat(req, 403, "Akun ini tidak aktif. Hubungi pengelola.");
  }
  const semua = p.jenis === "staf" && p.peran === "owner";
  return balas(req, 200, { ok: true, menu: await bacaDaftarMenu(semua) });
}

async function aksiMenuSimpan(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const tolak = await tolakBukanOwner(req, pengguna);
  if (tolak) return tolak;

  const nama = teksAtauNull(isi.nama);
  if (nama === null) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  // Harga harus bilangan bulat dalam jangkauan integer; batas wajar dicek fungsi SQL.
  if (
    typeof isi.harga !== "number" ||
    !Number.isInteger(isi.harga) ||
    Math.abs(isi.harga) > BATAS_INTEGER
  ) {
    return galat(req, 400, PETA_GALAT_MENU.harga_tidak_valid[1]);
  }

  // Foto opsional: kosong atau tidak dikirim = tanpa foto. Bentuk namanya dicek fungsi SQL.
  let foto: string | null = null;
  if (isi.foto !== undefined && isi.foto !== null) {
    const teksFoto = teksAtauNull(isi.foto);
    if (teksFoto === null) {
      return galat(req, 400, PETA_GALAT_MENU.foto_tidak_valid[1]);
    }
    foto = teksFoto.trim() === "" ? null : teksFoto.trim();
  }

  // Deskripsi (MNU.07): WAJIB dikirim dan berupa teks (boleh kosong = tanpa deskripsi). Bila field tidak ada,
  // permintaan ditolak supaya deskripsi lama tidak terhapus tanpa sengaja. Boleh beberapa baris; fungsi SQL
  // merapikan dan mengecek batas panjang dari pengaturan (ini hanya pagar kasar).
  if (typeof isi.deskripsi !== "string") {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }
  const deskripsi = teksAtauNull(isi.deskripsi);
  if (deskripsi === null) {
    return galat(req, 400, PETA_GALAT_MENU.deskripsi_tidak_valid[1]);
  }

  // `id` kosong = tambah menu baru; `id` terisi = ubah menu itu.
  let idMenu: string | null = null;
  if (isi.id !== undefined && isi.id !== null) {
    if (typeof isi.id !== "string" || !REGEX_UUID.test(isi.id)) {
      return galat(req, 400, "Data belum lengkap atau tidak valid.");
    }
    idMenu = isi.id;
  }

  // `aktifkan` = true: aktifkan kembali menu nonaktif. Selain true dianggap tidak.
  const aktifkan = isi.aktifkan === true;

  const { data, error } = await admin!.rpc("menu_simpan", {
    p_oleh: pengguna.id,
    p_id: idMenu,
    p_nama: nama,
    p_harga: isi.harga,
    p_foto: foto,
    p_deskripsi: deskripsi,
    p_aktifkan: aktifkan,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_MENU, "menu_simpan");
  }

  return balas(req, 200, {
    ok: true,
    id: typeof data === "string" ? data : null,
    menu: await bacaDaftarMenu(true),
  });
}

async function aksiMenuStok(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const tolak = await tolakBukanOwner(req, pengguna);
  if (tolak) return tolak;

  if (
    typeof isi.id !== "string" ||
    !REGEX_UUID.test(isi.id) ||
    typeof isi.tersedia !== "boolean"
  ) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  const { error } = await admin!.rpc("menu_stok", {
    p_oleh: pengguna.id,
    p_id: isi.id,
    p_tersedia: isi.tersedia,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_MENU, "menu_stok");
  }

  return balas(req, 200, { ok: true, menu: await bacaDaftarMenu(true) });
}

async function aksiMenuNonaktif(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const tolak = await tolakBukanOwner(req, pengguna);
  if (tolak) return tolak;

  if (typeof isi.id !== "string" || !REGEX_UUID.test(isi.id)) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  const { error } = await admin!.rpc("menu_nonaktif", {
    p_oleh: pengguna.id,
    p_id: isi.id,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_MENU, "menu_nonaktif");
  }

  return balas(req, 200, { ok: true, menu: await bacaDaftarMenu(true) });
}

// ------------------------------------------------------------
// Aksi: grup_daftar, grup_simpan, grup_nonaktif, menu_grup_atur (MNU.09 giliran 2)
// Semuanya HANYA owner (SEC-07, SEC-08), dicek dua lapis: di sini dan di fungsi SQL.
// ID pelaku selalu dari token. Aplikasi hanya mengirim nama, daftar opsi, dan id pilihan;
// peran dan id pelaku dari aplikasi diabaikan (SEC-06).
// Aturan sebenarnya dicek fungsi SQL (aturan 19); ini hanya pagar kasar dan bentuk data.
// Balasan sukses memuat daftar terbaru (`grup` dan/atau `menu`) supaya aplikasi tidak
// perlu memanggil lagi. `grup` = semua grup beserta semua opsinya (termasuk nonaktif),
// karena `grup_simpan` meminta daftar opsi LENGKAP saat mengubah grup.
// ------------------------------------------------------------

// Kode galat fungsi SQL grup pilihan -> status dan pesan aman (AK14)
// Pesan batas jumlah sengaja tanpa angka: batasnya ada di pengaturan, bukan ditulis mati.
// (id_kosong dan pengaturan_rusak sengaja tidak dipetakan: jadi galat umum 500;
//  pilihan_rusak hanya muncul dari opsi_periksa yang belum dipanggil aksi mana pun,
//  jadi dipetakan nanti di ORD.01.)
const PETA_GALAT_GRUP: Record<string, [number, string]> = {
  bukan_owner: [403, "Aksi ini hanya untuk owner."],
  grup_nama_tidak_valid: [400, "Nama grup 3 sampai 30 karakter."],
  grup_nama_kembar: [409, "Sudah ada grup aktif dengan nama yang sama."],
  grup_tidak_ditemukan: [404, "Grup pilihan tidak ditemukan."],
  grup_tidak_aktif: [409, "Grup ini nonaktif. Aktifkan dulu."],
  grup_tidak_valid: [400, "Data belum lengkap atau tidak valid."],
  grup_terlalu_banyak: [409, "Jumlah grup di menu ini sudah mencapai batas."],
  opsi_tidak_valid: [
    400,
    "Pilihan tidak valid. Tiap grup butuh minimal 2 pilihan aktif, tepat satu pilihan bawaan yang aktif, dan nama pilihan 2 sampai 30 karakter.",
  ],
  opsi_tidak_lengkap: [
    409,
    "Daftar pilihan sudah berubah. Muat ulang layar lalu coba lagi.",
  ],
  opsi_nama_kembar: [
    409,
    "Ada pilihan aktif dengan nama yang sama di grup ini.",
  ],
  opsi_terlalu_banyak: [
    409,
    "Jumlah pilihan aktif di grup ini sudah mencapai batas.",
  ],
  menu_tidak_ditemukan: [404, "Menu tidak ditemukan."],
};

// Pagar kasar jumlah elemen kiriman (batas sebenarnya dicek fungsi SQL dari pengaturan).
const BATAS_OPSI_KIRIMAN = 100;
const BATAS_GRUP_KIRIMAN = 50;

// Semua grup beserta semua opsinya (hanya dipanggil untuk owner).
async function bacaDaftarGrup(): Promise<unknown[]> {
  const { data, error } = await admin!.rpc("grup_daftar", { p_semua: true });
  if (error) throw new Error("grup_daftar:" + (error.code ?? ""));
  return Array.isArray(data) ? data : [];
}

// Rapikan bentuk daftar opsi kiriman aplikasi: hanya field id, nama, bawaan, aktif yang diteruskan.
// null = bentuk tidak valid. Aturan isi (jumlah, bawaan, nama kembar, dst) dicek fungsi SQL.
function rapikanOpsi(v: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(v) || v.length > BATAS_OPSI_KIRIMAN) return null;
  const hasil: Record<string, unknown>[] = [];
  for (const el of v) {
    if (el === null || typeof el !== "object" || Array.isArray(el)) return null;
    const o = el as Record<string, unknown>;
    const item: Record<string, unknown> = {};

    // id: kosong = opsi baru; terisi harus uuid
    if (o.id === undefined || o.id === null || o.id === "") {
      item.id = null;
    } else if (typeof o.id === "string" && REGEX_UUID.test(o.id)) {
      item.id = o.id;
    } else {
      return null;
    }

    // nama: teks (rapikan dan batas panjang dicek fungsi SQL)
    const nama = teksAtauNull(o.nama);
    if (nama === null) return null;
    item.nama = nama;

    // bawaan dan aktif: boleh tidak dikirim; bila dikirim harus boolean
    if (o.bawaan !== undefined && o.bawaan !== null) {
      if (typeof o.bawaan !== "boolean") return null;
      item.bawaan = o.bawaan;
    }
    if (o.aktif !== undefined && o.aktif !== null) {
      if (typeof o.aktif !== "boolean") return null;
      item.aktif = o.aktif;
    }
    hasil.push(item);
  }
  return hasil;
}

async function aksiGrupDaftar(
  req: Request,
  pengguna: Pengguna,
): Promise<Response> {
  const tolak = await tolakBukanOwner(req, pengguna);
  if (tolak) return tolak;

  return balas(req, 200, { ok: true, grup: await bacaDaftarGrup() });
}

async function aksiGrupSimpan(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const tolak = await tolakBukanOwner(req, pengguna);
  if (tolak) return tolak;

  const nama = teksAtauNull(isi.nama);
  const opsi = rapikanOpsi(isi.opsi);
  if (nama === null || opsi === null) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  // `id` kosong = tambah grup baru; `id` terisi = ubah grup itu (opsi harus LENGKAP).
  let idGrup: string | null = null;
  if (isi.id !== undefined && isi.id !== null) {
    if (typeof isi.id !== "string" || !REGEX_UUID.test(isi.id)) {
      return galat(req, 400, "Data belum lengkap atau tidak valid.");
    }
    idGrup = isi.id;
  }

  // `aktifkan` = true: aktifkan kembali grup nonaktif sambil mengubahnya. Selain true dianggap tidak.
  const aktifkan = isi.aktifkan === true;

  const { data, error } = await admin!.rpc("grup_simpan", {
    p_oleh: pengguna.id,
    p_id: idGrup,
    p_nama: nama,
    p_opsi: opsi,
    p_aktifkan: aktifkan,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_GRUP, "grup_simpan");
  }

  // `menu` ikut dibalas karena nama grup dan opsi tampil di tiap menu (field `grup`).
  return balas(req, 200, {
    ok: true,
    id: typeof data === "string" ? data : null,
    grup: await bacaDaftarGrup(),
    menu: await bacaDaftarMenu(true),
  });
}

async function aksiGrupNonaktif(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const tolak = await tolakBukanOwner(req, pengguna);
  if (tolak) return tolak;

  if (typeof isi.id !== "string" || !REGEX_UUID.test(isi.id)) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  const { error } = await admin!.rpc("grup_nonaktif", {
    p_oleh: pengguna.id,
    p_id: isi.id,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_GRUP, "grup_nonaktif");
  }

  return balas(req, 200, {
    ok: true,
    grup: await bacaDaftarGrup(),
    menu: await bacaDaftarMenu(true),
  });
}

async function aksiMenuGrupAtur(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const tolak = await tolakBukanOwner(req, pengguna);
  if (tolak) return tolak;

  if (typeof isi.menu_id !== "string" || !REGEX_UUID.test(isi.menu_id)) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  // `grup_ids` = daftar LENGKAP grup aktif yang diinginkan (urutan = urutan tampil);
  // daftar kosong = lepas semua. Dobel dan batas jumlah dicek fungsi SQL.
  if (
    !Array.isArray(isi.grup_ids) ||
    isi.grup_ids.length > BATAS_GRUP_KIRIMAN
  ) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }
  const grupIds: string[] = [];
  for (const g of isi.grup_ids) {
    if (typeof g !== "string" || !REGEX_UUID.test(g)) {
      return galat(req, 400, "Data belum lengkap atau tidak valid.");
    }
    grupIds.push(g);
  }

  const { error } = await admin!.rpc("menu_grup_atur", {
    p_oleh: pengguna.id,
    p_menu_id: isi.menu_id,
    p_grup_ids: grupIds,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_GRUP, "menu_grup_atur");
  }

  return balas(req, 200, { ok: true, menu: await bacaDaftarMenu(true) });
}

// ------------------------------------------------------------
// Pintu masuk
// ------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // Preflight CORS: tanpa isi, tanpa token (ini bukan aksi).
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: headerCors(req) });
  }

  // Lapis kedua: cek token paling awal, sebelum membaca apa pun dari isi.
  let pengguna: Pengguna | null = null;
  try {
    pengguna = await verifikasiToken(req);
  } catch (_e) {
    pengguna = null;
  }
  if (!pengguna) {
    return galat(req, 401, "Sesi tidak valid. Silakan masuk lagi.");
  }

  if (req.method !== "POST") {
    return galat(req, 405, "Permintaan tidak dikenal.");
  }

  // Baca isi permintaan
  let isi: Record<string, unknown>;
  try {
    const teks = await req.text();
    if (teks.length > BATAS_ISI) {
      return galat(req, 413, "Permintaan terlalu besar.");
    }
    const j = JSON.parse(teks);
    if (j === null || typeof j !== "object" || Array.isArray(j)) {
      return galat(req, 400, "Permintaan tidak valid.");
    }
    isi = j as Record<string, unknown>;
  } catch (_e) {
    return galat(req, 400, "Permintaan tidak valid.");
  }

  const aksi = typeof isi.aksi === "string" ? isi.aksi : "";

  try {
    switch (aksi) {
      case "status":
        return await aksiStatus(req, pengguna);
      case "daftar_profil":
        return await aksiDaftarProfil(req, pengguna, isi);
      case "alamat_simpan":
        return await aksiAlamatSimpan(req, pengguna, isi);
      case "alamat_nonaktif":
        return await aksiAlamatNonaktif(req, pengguna, isi);
      case "ganti_nama":
        return await aksiGantiNama(req, pengguna, isi);
      case "ganti_wa":
        return await aksiGantiWa(req, pengguna, isi);
      case "menu_daftar":
        return await aksiMenuDaftar(req, pengguna);
      case "menu_simpan":
        return await aksiMenuSimpan(req, pengguna, isi);
      case "menu_stok":
        return await aksiMenuStok(req, pengguna, isi);
      case "menu_nonaktif":
        return await aksiMenuNonaktif(req, pengguna, isi);
      case "grup_daftar":
        return await aksiGrupDaftar(req, pengguna);
      case "grup_simpan":
        return await aksiGrupSimpan(req, pengguna, isi);
      case "grup_nonaktif":
        return await aksiGrupNonaktif(req, pengguna, isi);
      case "menu_grup_atur":
        return await aksiMenuGrupAtur(req, pengguna, isi);
      default:
        return galat(req, 400, "Aksi tidak dikenal.");
    }
  } catch (e) {
    // Hanya jenis galat yang dicatat di log server; tanpa data pengguna.
    console.error("kedai galat, aksi:", aksi, "|", (e as Error).message);
    return galat(req, 500, "Terjadi masalah di server. Coba lagi nanti.");
  }
});
