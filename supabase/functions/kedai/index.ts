// supabase/functions/kedai/index.ts
// AKN.04: Edge Function `kedai` versi pertama (opsi A).
// Aksi yang ada: `status` dan `daftar_profil`. Aksi lain ditambah di langkah berikutnya.
// AKN.07: ditambah `alamat_simpan` dan `alamat_nonaktif` (buku alamat, akun.md AK9).
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
      default:
        return galat(req, 400, "Aksi tidak dikenal.");
    }
  } catch (e) {
    // Hanya jenis galat yang dicatat di log server; tanpa data pengguna.
    console.error("kedai galat, aksi:", aksi, "|", (e as Error).message);
    return galat(req, 500, "Terjadi masalah di server. Coba lagi nanti.");
  }
});
