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
// ORD.02 (giliran 2): ditambah `order_buat` (customer), `order_daftar` dan `order_detail` (semua peran
//         yang aktif; hak lihat dijaga fungsi SQL, order.md O11). Kode galat baru dipetakan di
//         PETA_GALAT_ORDER, termasuk `pilihan_rusak` dari opsi_periksa.
// ORD.04 (giliran 2): ditambah `order_batal` (customer: order miliknya saat Menunggu; owner: dari
//         Disetujui sampai Siap, alasan opsional; penjaga ditolak). Kode galat baru dipetakan di
//         PETA_GALAT_ORDER_BATAL. Fungsi SQL: 20261108_03_order_batal_fungsi.sql.
// ORD.04 (perbaikan pesan 409): PETA_GALAT_ORDER_BATAL ditambah `sudah_dibatalkan` dan `sudah_ditolak`
//         supaya order yang sudah Dibatalkan atau Ditolak tidak lagi dibilang "sudah diproses".
//         Kode baru ini dikirim fungsi SQL `order_batal` versi baru (migration susulan, dijalankan
//         SETELAH berkas ini dideploy). Sebelum SQL baru jalan, pemetaan ini belum terpakai (aman).
// ORD.05 (giliran 2): ditambah `order_setuju` (owner, metode bayar wajib) dan `order_tolak` (owner,
//         alasan opsional). Hanya owner; customer dan penjaga ditolak 403 (SEC-07, SEC-08). Kode galat
//         baru dipetakan di PETA_GALAT_ORDER_KEPUTUSAN. Fungsi SQL: 20261108_05_order_setuju_tolak.sql
//         (sudah dijalankan dan lulus cek SEBELUM berkas ini dideploy). Push ada di NTF, bukan di sini.
// ORD.07 (giliran 2): ditambah `order_status` (penjaga dan owner), `order_metode_koreksi` dan `order_alih_hari`
//         (owner saja). Kodenya ada di BERKAS BARU `order_status.ts` (folder yang sama), diimpor di bawah;
//         kode lama di berkas ini tidak dipindah (keputusan ketua 9 Nov 2026). Fungsi SQL:
//         20261109_01_order_status_alih_hari.sql (sudah dijalankan dan lulus cek SEBELUM berkas ini dideploy).
// ORD.09 (giliran 2): ditambah `catatan_tambah` (customer pemilik dan owner; penjaga ditolak 403) dan `catatan_dibaca`
//         (semua peran aktif; hak lihat dijaga fungsi SQL). Kodenya ada di BERKAS BARU `catatan.ts` (folder yang sama),
//         diimpor di bawah; kode lama tidak dipindah. Fungsi SQL: 20261109_04_catatan_fungsi.sql (sudah dijalankan
//         dan lulus cek SEBELUM berkas ini dideploy). Push catatan ada di NTF, bukan di sini.
// ORD.11 (giliran 2): ditambah `pelanggan_luar_daftar`, `pelanggan_luar_simpan` (tambah, ubah, dan aktifkan lagi),
//         dan `pelanggan_luar_nonaktif` (pelanggan tanpa akun, O16). Hanya owner; customer dan penjaga ditolak 403
//         (SEC-07, SEC-14). Kodenya ada di BERKAS BARU `pelanggan_luar.ts` (folder yang sama), diimpor di bawah;
//         kode lama tidak dipindah. Fungsi SQL: 20261109_05_pelanggan_luar_fungsi.sql (sudah dijalankan dan lulus
//         cek SEBELUM berkas ini dideploy).
// ORD.12 (giliran 2): ditambah `order_buat_wakil` (order wakil owner untuk pelanggan tanpa akun, O15). Hanya owner;
//         customer dan penjaga ditolak 403 (SEC-07, SEC-08, SEC-13). Kodenya ada di BERKAS BARU `order_wakil.ts`
//         (folder yang sama), diimpor di bawah; kode lama tidak dipindah. Fungsi SQL: 20261110_06_order_wakil_fungsi.sql
//         (sudah dijalankan dan lulus cek SEBELUM berkas ini dideploy). Push ada di NTF, bukan di sini.
// BTN.02: ditambah `bantuan_daftar` (semua yang login; isi aktif disaring peran dari tabel staf oleh server,
//         peran dari aplikasi diabaikan, BT5 dan SEC-31). Kodenya ada di BERKAS BARU `bantuan.ts` (folder yang sama),
//         diimpor di bawah; kode lama tidak dipindah. Hanya membaca tabel `bantuan`: tanpa fungsi SQL baru
//         dan tanpa migration (tabelnya sudah ada dari BTN.01).
// FTO.02: ditambah `foto_minta_unggah`, `foto_catat` (penjaga dan owner; customer ditolak 403) dan `foto_lihat`
//         (semua peran aktif; hak lihat dijaga fungsi SQL). Kodenya ada di BERKAS BARU `foto.ts` (folder yang sama),
//         diimpor di bawah; kode lama tidak dipindah. Berkas ini juga memberi `foto.ts` klien Storage (`admin.storage`).
//         Fungsi SQL: 20261111_02_foto_fungsi.sql (HARUS sudah dijalankan dan lulus cek SEBELUM berkas ini dideploy).
//         Push foto ada di NTF, bukan di sini.
// INB.03: `status` kini membawa satu angka tambahan `inbox_terbaru` (nomor item Kotak masuk terbaru milik akun itu,
//         atau null bila tidak ada) untuk titik merah (inbox.md IB10). Angka numpang di balasan `status` yang sudah ada,
//         tanpa panggilan tambahan dari aplikasi. Bila pengambilan angka gagal, `status` tetap dibalas normal dengan
//         angka null (IB12). Ditambah aksi `inbox_daftar` (semua peran aktif; akun selalu dari token, SEC-34). Kodenya ada
//         di BERKAS BARU `inbox.ts` (folder yang sama), diimpor di bawah; kode lama tidak dipindah. Fungsi SQL:
//         20261111_06_inbox_fungsi.sql (sudah dijalankan dan lulus cek SEBELUM berkas ini dideploy).
//         `inbox_tulis` BELUM dipanggil di mana pun (INB.04).
// INB.04 (giliran 1): `inbox_tulis` dipanggil lewat pembantu `tulisInbox` (dari `inbox.ts`) SETELAH aksi berhasil, untuk
//         kejadian `order_baru` (order_buat), `setujui` (order_setuju), `tolak` (order_tolak), `batal_customer` dan
//         `batal_owner` (order_batal, dibedakan dari peran yang dibaca server). Pelaku = id dari token. Kegagalan menulis
//         inbox TIDAK membatalkan aksi dan tidak mengubah balasan (inbox.md IB12). Logika aksi lama tidak diubah.
//         Kejadian lain (status, alih_hari, catatan, order_wakil, foto) dipasang di giliran berikutnya.
// INB.04 (giliran 2): `tulisInbox` dioper ke `buatAksiOrderStatus` (order_status.ts) untuk kejadian `status` (hanya arah
//         maju; mundur tidak memanggil) dan `alih_hari`. Dioper lewat pembungkus kecil karena `tulisInbox` baru didapat
//         dari `buatAksiInbox` di bagian bawah berkas ini; pembungkus baru dipanggil saat aksi berjalan, jadi aman.
//
// Deploy (urutan aman AGENTS.md bagian 8), TANPA --no-verify-jwt:
//   supabase functions deploy kedai --use-api --project-ref "$PROJECT_REF"
//
// Rahasia: kunci secret Supabase (sb_secret_...) dibaca dari variabel lingkungan
// fungsi bernama KUNCI_SECRET_KEDAI (diisi ketua di dashboard). DILARANG ditulis di kode.
// SUPABASE_URL diisi otomatis oleh platform.

import { createClient } from "npm:@supabase/supabase-js@2.58.0";
// ORD.07: aksi order_status, order_metode_koreksi, order_alih_hari ada di berkas terpisah.
import { buatAksiOrderStatus } from "./order_status.ts";
// ORD.09: aksi catatan_tambah dan catatan_dibaca ada di berkas terpisah.
import { buatAksiCatatan } from "./catatan.ts";
// ORD.11: aksi pelanggan_luar_daftar, pelanggan_luar_simpan, pelanggan_luar_nonaktif ada di berkas terpisah.
import { buatAksiPelangganLuar } from "./pelanggan_luar.ts";
// ORD.12: aksi order_buat_wakil ada di berkas terpisah.
import { buatAksiOrderWakil } from "./order_wakil.ts";
// BTN.02: aksi bantuan_daftar ada di berkas terpisah.
import { buatAksiBantuan } from "./bantuan.ts";
// FTO.02: aksi foto_minta_unggah, foto_catat, foto_lihat ada di berkas terpisah.
import { buatAksiFoto } from "./foto.ts";
// INB.03: aksi inbox_daftar ada di berkas terpisah.
import { buatAksiInbox } from "./inbox.ts";

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

// INB.03: nomor item Kotak masuk terbaru milik akun ini (titik merah, inbox.md IB10). Numpang di balasan `status`.
// Inbox bukan inti sistem (IB12): galat apa pun (fungsi SQL maupun jaringan) membuat angkanya null,
// dan `status` tetap dibalas normal. Yang dicatat di log hanya jenis galat, tanpa data pengguna.
async function bacaInboxTerbaru(id: string): Promise<number | null> {
  try {
    const { data, error } = await admin!.rpc("inbox_terbaru", { p_akun: id });
    if (error) {
      console.error(
        "kedai status: inbox_terbaru gagal |",
        String(error.message ?? "").slice(0, 100),
      );
      return null;
    }
    if (data === null || data === undefined) return null;
    const angka = Number(data);
    return Number.isSafeInteger(angka) && angka > 0 ? angka : null;
  } catch (_e) {
    console.error("kedai status: inbox_terbaru gagal tersambung");
    return null;
  }
}

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

  // INB.03: angka titik merah Kotak masuk (null bila tidak ada atau gagal; tidak pernah menggagalkan `status`)
  const inboxTerbaru = await bacaInboxTerbaru(pengguna.id);

  // Staf: tidak punya profil customer dan alamat (AK4)
  if (p.jenis === "staf") {
    return balas(req, 200, {
      ok: true,
      peran: p.peran,
      nama_tampilan: p.nama,
      profil: null,
      alamat: [],
      pengaturan,
      inbox_terbaru: inboxTerbaru,
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
    inbox_terbaru: inboxTerbaru,
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
// Aksi: order_buat, order_daftar, order_detail (ORD.02 giliran 2, order.md O2 sampai O4, O11, O20)
// `order_buat`: HANYA customer. Aplikasi hanya mengirim tipe, id alamat, hari ("Hari ini" atau
// "Besok"), jam, daftar item (id menu, jumlah, id opsi), dan catatan awal. Harga, total, status,
// metode bayar, peran, dan id pengguna dari aplikasi tidak pernah diteruskan (SEC-06): item dibangun
// ulang hanya dari tiga isian di atas, dan id akun selalu dari token.
// `order_daftar` dan `order_detail`: semua peran yang aktif. Order mana yang boleh dilihat ditentukan
// fungsi SQL dari peran di tabel staf (O11, SEC-05, SEC-08), bukan dari kiriman aplikasi.
// Aturan sebenarnya dicek fungsi SQL (aturan 19); ini hanya pagar kasar dan bentuk data.
// ------------------------------------------------------------

// Kode galat fungsi SQL order -> status dan pesan aman (AK14)
// Pesan batas jumlah sengaja tanpa angka: batasnya ada di pengaturan, bukan ditulis mati.
// (id_kosong, pengaturan_rusak, dan total_terlalu_besar sengaja tidak dipetakan: jadi galat umum 500.)
const PETA_GALAT_ORDER: Record<string, [number, string]> = {
  bukan_customer: [403, "Aksi ini hanya untuk customer."],
  akun_nonaktif: [403, "Akun ini tidak aktif. Hubungi pengelola."],
  profil_tidak_ada: [400, "Lengkapi profil dulu."],
  tipe_tidak_valid: [400, "Tipe pesanan tidak valid."],
  hari_tidak_valid: [400, "Hari tidak valid."],
  jam_tidak_valid: [400, "Jam tidak valid. Isi jam dan menit."],
  item_tidak_valid: [400, "Data pesanan belum lengkap atau tidak valid."],
  item_kosong: [400, "Pilih minimal satu menu."],
  item_terlalu_banyak: [
    409,
    "Jumlah jenis menu dalam satu pesanan sudah mencapai batas.",
  ],
  jumlah_tidak_valid: [400, "Jumlah menu tidak valid."],
  jumlah_terlalu_banyak: [409, "Jumlah satu menu melebihi batas."],
  menu_tidak_ditemukan: [
    404,
    "Ada menu yang tidak ditemukan. Muat ulang menu lalu coba lagi.",
  ],
  menu_tidak_tersedia: [
    409,
    "Ada menu yang sedang habis atau tidak tersedia. Muat ulang menu lalu coba lagi.",
  ],
  opsi_tidak_valid: [
    409,
    "Pilihan menu berubah atau tidak valid. Muat ulang menu lalu coba lagi.",
  ],
  pilihan_rusak: [
    409,
    "Pilihan menu sedang bermasalah. Coba lagi nanti atau hubungi pengelola.",
  ],
  alamat_wajib: [400, "Pilih alamat antar."],
  alamat_tidak_ditemukan: [404, "Alamat tidak ditemukan."],
  catatan_terlalu_panjang: [400, "Catatan terlalu panjang."],
  status_tidak_valid: [400, "Filter status tidak valid."],
  order_tidak_ditemukan: [404, "Pesanan tidak ditemukan."],
};

// Pagar kasar jumlah baris item kiriman (batas sebenarnya dicek fungsi SQL dari pengaturan).
const BATAS_ITEM_KIRIMAN = 50;

type ItemKiriman = { menu_id: string; jumlah: number; opsi_ids: string[] };

// Bentuk kiriman item dicek kasar lalu DIBANGUN ULANG: hanya menu_id, jumlah, dan opsi_ids yang
// diteruskan. Harga, nama, subtotal, atau isian lain dari aplikasi dibuang (SEC-06).
// Mengembalikan null bila bentuknya salah.
function bacaItemKiriman(v: unknown): ItemKiriman[] | null {
  if (!Array.isArray(v) || v.length > BATAS_ITEM_KIRIMAN) return null;
  const hasil: ItemKiriman[] = [];
  for (const e of v) {
    if (e === null || typeof e !== "object" || Array.isArray(e)) return null;
    const baris = e as Record<string, unknown>;
    if (typeof baris.menu_id !== "string" || !REGEX_UUID.test(baris.menu_id)) {
      return null;
    }
    if (typeof baris.jumlah !== "number" || !Number.isInteger(baris.jumlah)) {
      return null;
    }
    let opsi: string[] = [];
    if (baris.opsi_ids !== undefined && baris.opsi_ids !== null) {
      if (
        !Array.isArray(baris.opsi_ids) ||
        baris.opsi_ids.length > BATAS_OPSI_KIRIMAN
      ) {
        return null;
      }
      for (const o of baris.opsi_ids) {
        if (typeof o !== "string" || !REGEX_UUID.test(o)) return null;
      }
      opsi = baris.opsi_ids as string[];
    }
    hasil.push({
      menu_id: baris.menu_id,
      jumlah: baris.jumlah,
      opsi_ids: opsi,
    });
  }
  return hasil;
}

async function aksiOrderBuat(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  // Lapis kedua peran: hanya customer (SEC-07). Peran dari aplikasi diabaikan.
  const p = await bacaPeran(pengguna.id);
  if (p.jenis === "nonaktif") {
    return galat(req, 403, "Akun ini tidak aktif. Hubungi pengelola.");
  }
  if (p.jenis !== "customer") {
    return galat(req, 403, "Aksi ini hanya untuk customer.");
  }

  const tipe = teksAtauNull(isi.tipe);
  const hari = teksAtauNull(isi.hari);
  const jam = teksAtauNull(isi.jam);
  const item = bacaItemKiriman(isi.item);
  if (tipe === null || hari === null || jam === null || item === null) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  // Alamat antar: boleh kosong (tipe Diambil dan Makan di warung). Kepemilikan dicek fungsi SQL (SEC-09).
  let idAlamat: string | null = null;
  if (isi.alamat_id !== undefined && isi.alamat_id !== null) {
    if (typeof isi.alamat_id !== "string" || !REGEX_UUID.test(isi.alamat_id)) {
      return galat(req, 400, "Data belum lengkap atau tidak valid.");
    }
    idAlamat = isi.alamat_id;
  }

  // Catatan awal: boleh kosong. Batas sebenarnya dari pengaturan, dicek fungsi SQL.
  let catatan: string | null = null;
  if (isi.catatan !== undefined && isi.catatan !== null) {
    if (typeof isi.catatan !== "string" || isi.catatan.length > BATAS_TEKS) {
      return galat(req, 400, PETA_GALAT_ORDER.catatan_terlalu_panjang[1]);
    }
    catatan = isi.catatan;
  }

  const { data, error } = await admin!.rpc("order_buat", {
    p_akun: pengguna.id,
    p_tipe: tipe,
    p_alamat_id: idAlamat,
    p_hari: hari,
    p_jam: jam,
    p_item: item,
    p_catatan: catatan,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_ORDER, "order_buat");
  }

  // INB.04: kabar ke Kotak masuk (owner). Id order dari balasan fungsi SQL; bila tidak ada, dilewati dan dicatat di log.
  // Kegagalan tidak membatalkan order dan tidak mengubah balasan (IB12).
  if (
    data !== null &&
    typeof data === "object" &&
    typeof data.id === "string" &&
    REGEX_UUID.test(data.id)
  ) {
    await tulisInbox(pengguna.id, "order_baru", data.id);
  } else {
    console.error("kedai inbox: id order tidak ada di balasan order_buat");
  }

  return balas(req, 200, { ok: true, order: data });
}

async function aksiOrderDaftar(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const p = await bacaPeran(pengguna.id);
  if (p.jenis === "nonaktif") {
    return galat(req, 403, "Akun ini tidak aktif. Hubungi pengelola.");
  }

  // Filter hari (hanya dipakai owner, peran lain diabaikan fungsi SQL) dan filter status: boleh kosong.
  let hari: string | null = null;
  if (isi.hari !== undefined && isi.hari !== null) {
    if (typeof isi.hari !== "string" || isi.hari.length > 20) {
      return galat(req, 400, "Data belum lengkap atau tidak valid.");
    }
    hari = isi.hari;
  }
  let status: string | null = null;
  if (isi.status !== undefined && isi.status !== null) {
    if (typeof isi.status !== "string" || isi.status.length > 30) {
      return galat(req, 400, "Data belum lengkap atau tidak valid.");
    }
    status = isi.status;
  }

  const { data, error } = await admin!.rpc("order_daftar", {
    p_akun: pengguna.id,
    p_hari: hari,
    p_status: status,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_ORDER, "order_daftar");
  }

  return balas(req, 200, {
    ok: true,
    daftar: Array.isArray(data) ? data : [],
  });
}

async function aksiOrderDetail(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const p = await bacaPeran(pengguna.id);
  if (p.jenis === "nonaktif") {
    return galat(req, 403, "Akun ini tidak aktif. Hubungi pengelola.");
  }

  // ID order dari aplikasi tidak dipercaya: fungsi SQL mengecek hak lihat (SEC-05, SEC-09).
  if (typeof isi.id !== "string" || !REGEX_UUID.test(isi.id)) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  const { data, error } = await admin!.rpc("order_detail", {
    p_akun: pengguna.id,
    p_order_id: isi.id,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_ORDER, "order_detail");
  }

  return balas(req, 200, { ok: true, order: data });
}

// ------------------------------------------------------------
// Aksi: order_batal (ORD.04 giliran 2, order.md O9 dan blok 8 Nov 2026, security.md blok 8 Nov 2026)
// Customer: hanya order MILIKNYA saat Menunggu. Owner: dari Disetujui sampai Diantar/Siap, alasan
// opsional (maks 200 karakter, tampil ke customer). Penjaga ditolak di sini (lapis kedua, SEC-08).
// Peran, status, dan kepemilikan sebenarnya dicek fungsi SQL (aturan 19); alasan dari customer
// diabaikan. Aplikasi hanya mengirim id order dan alasan; id akun selalu dari token.
// Push ke customer, owner, dan penjaga dipasang di NTF.06 (bukan di sini).
// ------------------------------------------------------------

// Kode galat fungsi SQL order_batal -> status dan pesan aman (AK14)
// (id_kosong sengaja tidak dipetakan: jadi galat umum 500.)
const PETA_GALAT_ORDER_BATAL: Record<string, [number, string]> = {
  akun_nonaktif: [403, "Akun ini tidak aktif. Hubungi pengelola."],
  profil_tidak_ada: [400, "Lengkapi profil dulu."],
  peran_tidak_boleh: [403, "Aksi ini hanya untuk customer atau owner."],
  alasan_terlalu_panjang: [400, "Alasan terlalu panjang."],
  order_tidak_ditemukan: [404, "Pesanan tidak ditemukan."],
  sudah_diproses: [
    409,
    "Pesanan sudah diproses, jadi tidak bisa dibatalkan dari sini. Segarkan daftar pesanan atau hubungi ChATA lewat WhatsApp.",
  ],
  tidak_bisa_dibatalkan: [
    409,
    "Pesanan dengan status ini tidak bisa dibatalkan. Segarkan daftar pesanan.",
  ],
  // Perbaikan pesan 409 (customer dan owner): order yang sudah Dibatalkan.
  sudah_dibatalkan: [409, "Pesanan ini sudah dibatalkan."],
  // Perbaikan pesan 409 (customer): order yang sudah Ditolak owner.
  sudah_ditolak: [
    409,
    "Pesanan ini sudah ditolak sebelumnya, jadi tidak bisa dibatalkan lagi. Hubungi tim ChATA lewat WhatsApp bila perlu.",
  ],
};

async function aksiOrderBatal(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const p = await bacaPeran(pengguna.id);
  if (p.jenis === "nonaktif") {
    return galat(req, 403, "Akun ini tidak aktif. Hubungi pengelola.");
  }
  // Lapis kedua peran: staf selain owner (penjaga) ditolak (SEC-08). Customer dan owner lanjut.
  if (p.jenis === "staf" && p.peran !== "owner") {
    return galat(req, 403, "Aksi ini hanya untuk customer atau owner.");
  }

  // ID order dari aplikasi tidak dipercaya: fungsi SQL mengecek kepemilikan dan status (SEC-05, SEC-09).
  if (typeof isi.id !== "string" || !REGEX_UUID.test(isi.id)) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  // Alasan: hanya dari owner, boleh kosong. Dari customer tidak diteruskan (diabaikan).
  let alasan: string | null = null;
  if (p.jenis === "staf" && isi.alasan !== undefined && isi.alasan !== null) {
    if (typeof isi.alasan !== "string" || isi.alasan.length > BATAS_TEKS) {
      return galat(req, 400, PETA_GALAT_ORDER_BATAL.alasan_terlalu_panjang[1]);
    }
    alasan = isi.alasan;
  }

  const { data, error } = await admin!.rpc("order_batal", {
    p_akun: pengguna.id,
    p_order_id: isi.id,
    p_alasan: alasan,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_ORDER_BATAL, "order_batal");
  }

  // INB.04: kabar ke Kotak masuk. Jenis kejadian dari peran yang dibaca server (staf owner = batal_owner,
  // selain itu customer = batal_customer), bukan dari aplikasi. Kegagalan tidak membatalkan aksi (IB12).
  await tulisInbox(
    pengguna.id,
    p.jenis === "staf" ? "batal_owner" : "batal_customer",
    isi.id,
  );

  return balas(req, 200, { ok: true, order: data });
}

// ------------------------------------------------------------
// Aksi: order_setuju dan order_tolak (ORD.05, order.md O6, O7, O8, security.md SEC-07, SEC-08, SEC-10, SEC-11)
// Hanya owner aktif. Customer dan penjaga ditolak di sini (lapis kedua); fungsi SQL mengecek ulang peran,
// mengunci baris order (satu pemenang bila dua owner bersamaan), dan hanya menerima order Menunggu.
// Aplikasi hanya mengirim id order dan (setuju) metode bayar atau (tolak) alasan. Id akun selalu dari token.
// Push ke customer dan penjaga dipasang di NTF (bukan di sini).
// ------------------------------------------------------------

// Kode galat fungsi SQL order_setuju dan order_tolak -> status dan pesan aman (AK14)
// (id_kosong sengaja tidak dipetakan: jadi galat umum 500.)
const PETA_GALAT_ORDER_KEPUTUSAN: Record<string, [number, string]> = {
  akun_nonaktif: [403, "Akun ini tidak aktif. Hubungi pengelola."],
  peran_tidak_boleh: [403, "Aksi ini hanya untuk owner."],
  metode_tidak_valid: [400, "Pilih metode bayar: Transfer, Tunai, atau QRIS."],
  alasan_terlalu_panjang: [400, "Alasan terlalu panjang."],
  order_tidak_ditemukan: [404, "Pesanan tidak ditemukan."],
  sudah_diproses: [409, "Pesanan sudah diproses. Segarkan daftar pesanan."],
  sudah_ditolak: [409, "Pesanan ini sudah ditolak."],
  sudah_dibatalkan: [409, "Pesanan ini sudah dibatalkan."],
};

async function aksiOrderSetuju(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const p = await bacaPeran(pengguna.id);
  if (p.jenis === "nonaktif") {
    return galat(req, 403, "Akun ini tidak aktif. Hubungi pengelola.");
  }
  // Lapis kedua peran: hanya owner (SEC-07 untuk customer, SEC-08 untuk penjaga)
  if (p.jenis !== "staf" || p.peran !== "owner") {
    return galat(req, 403, "Aksi ini hanya untuk owner.");
  }

  // ID order dari aplikasi tidak dipercaya: fungsi SQL yang mengecek order dan statusnya.
  if (typeof isi.id !== "string" || !REGEX_UUID.test(isi.id)) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  // Metode bayar wajib. Nilai yang sah dicek fungsi SQL (Transfer, Tunai, QRIS; SEC-11).
  if (typeof isi.metode !== "string" || isi.metode.length > BATAS_TEKS) {
    return galat(req, 400, PETA_GALAT_ORDER_KEPUTUSAN.metode_tidak_valid[1]);
  }

  const { data, error } = await admin!.rpc("order_setuju", {
    p_akun: pengguna.id,
    p_order_id: isi.id,
    p_metode: isi.metode,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_ORDER_KEPUTUSAN, "order_setuju");
  }

  // INB.04: kabar ke Kotak masuk (customer pemilik dan penjaga). Kegagalan tidak membatalkan aksi (IB12).
  await tulisInbox(pengguna.id, "setujui", isi.id);

  return balas(req, 200, { ok: true, order: data });
}

async function aksiOrderTolak(
  req: Request,
  pengguna: Pengguna,
  isi: Record<string, unknown>,
): Promise<Response> {
  const p = await bacaPeran(pengguna.id);
  if (p.jenis === "nonaktif") {
    return galat(req, 403, "Akun ini tidak aktif. Hubungi pengelola.");
  }
  if (p.jenis !== "staf" || p.peran !== "owner") {
    return galat(req, 403, "Aksi ini hanya untuk owner.");
  }

  if (typeof isi.id !== "string" || !REGEX_UUID.test(isi.id)) {
    return galat(req, 400, "Data belum lengkap atau tidak valid.");
  }

  // Alasan opsional; panjang sebenarnya (maks 200) dicek fungsi SQL.
  let alasan: string | null = null;
  if (isi.alasan !== undefined && isi.alasan !== null) {
    if (typeof isi.alasan !== "string" || isi.alasan.length > BATAS_TEKS) {
      return galat(
        req,
        400,
        PETA_GALAT_ORDER_KEPUTUSAN.alasan_terlalu_panjang[1],
      );
    }
    alasan = isi.alasan;
  }

  const { data, error } = await admin!.rpc("order_tolak", {
    p_akun: pengguna.id,
    p_order_id: isi.id,
    p_alasan: alasan,
  });
  if (error) {
    return galatDariDb(req, error, PETA_GALAT_ORDER_KEPUTUSAN, "order_tolak");
  }

  // INB.04: kabar ke Kotak masuk (customer pemilik). Alasan tolak TIDAK ikut (IB4). Kegagalan tidak membatalkan aksi (IB12).
  await tulisInbox(pengguna.id, "tolak", isi.id);

  return balas(req, 200, { ok: true, order: data });
}

// ------------------------------------------------------------
// ORD.07: sambungan ke berkas order_status.ts. Alat bantu di atas diberikan lewat parameter
// (berkas itu tidak mengimpor index.ts). `admin` pasti ada bila sampai ke aksi, karena
// verifikasiToken menolak (401) lebih dulu bila `admin` kosong.
// ------------------------------------------------------------

const { aksiOrderStatus, aksiOrderMetodeKoreksi, aksiOrderAlihHari } =
  buatAksiOrderStatus({
    // deno-lint-ignore no-explicit-any
    klien: admin as any,
    bacaPeran,
    balas,
    galat,
    galatDariDb,
    regexUuid: REGEX_UUID,
    batasTeks: BATAS_TEKS,
    // INB.04 giliran 2: pembungkus; `tulisInbox` dideklarasikan lebih bawah (dari buatAksiInbox) dan baru dipakai saat aksi berjalan.
    tulisInbox: (pelaku: string, kejadian: string, orderId: string) =>
      tulisInbox(pelaku, kejadian, orderId),
  });

// ------------------------------------------------------------
// ORD.09: sambungan ke berkas catatan.ts, dengan alat bantu yang sama seperti di atas.
// ------------------------------------------------------------

const { aksiCatatanTambah, aksiCatatanDibaca } = buatAksiCatatan({
  // deno-lint-ignore no-explicit-any
  klien: admin as any,
  bacaPeran,
  balas,
  galat,
  galatDariDb,
  regexUuid: REGEX_UUID,
  batasTeks: BATAS_TEKS,
});

// ------------------------------------------------------------
// ORD.11: sambungan ke berkas pelanggan_luar.ts, dengan alat bantu yang sama seperti di atas.
// ------------------------------------------------------------

const {
  aksiPelangganLuarDaftar,
  aksiPelangganLuarSimpan,
  aksiPelangganLuarNonaktif,
} = buatAksiPelangganLuar({
  // deno-lint-ignore no-explicit-any
  klien: admin as any,
  bacaPeran,
  balas,
  galat,
  galatDariDb,
  regexUuid: REGEX_UUID,
  batasTeks: BATAS_TEKS,
});

// ------------------------------------------------------------
// ORD.12: sambungan ke berkas order_wakil.ts, dengan alat bantu yang sama seperti di atas, ditambah
// `bacaItemKiriman` dan `PETA_GALAT_ORDER` (dipakai ulang dari aksi order_buat, tidak ditulis ulang).
// ------------------------------------------------------------

const { aksiOrderBuatWakil } = buatAksiOrderWakil({
  // deno-lint-ignore no-explicit-any
  klien: admin as any,
  bacaPeran,
  balas,
  galat,
  galatDariDb,
  regexUuid: REGEX_UUID,
  batasTeks: BATAS_TEKS,
  bacaItemKiriman,
  petaGalatOrder: PETA_GALAT_ORDER,
});

// ------------------------------------------------------------
// BTN.02: sambungan ke berkas bantuan.ts. Hanya perlu klien (baca), bacaPeran, balas, dan galat.
// ------------------------------------------------------------

const { aksiBantuanDaftar } = buatAksiBantuan({
  // deno-lint-ignore no-explicit-any
  klien: admin as any,
  bacaPeran,
  balas,
  galat,
});

// ------------------------------------------------------------
// FTO.02: sambungan ke berkas foto.ts, dengan alat bantu yang sama seperti di atas, ditambah `storage`
// (bagian Storage dari klien kunci secret, untuk alamat unggah dan tautan lihat). Tanpa `batasTeks`: tidak dipakai.
// ------------------------------------------------------------

const { aksiFotoMintaUnggah, aksiFotoCatat, aksiFotoLihat } = buatAksiFoto({
  // deno-lint-ignore no-explicit-any
  klien: admin as any,
  // deno-lint-ignore no-explicit-any
  storage: (admin?.storage ?? null) as any,
  bacaPeran,
  balas,
  galat,
  galatDariDb,
  regexUuid: REGEX_UUID,
});

// ------------------------------------------------------------
// INB.03: sambungan ke berkas inbox.ts. Hanya perlu klien, balas, galat, dan galatDariDb.
// ------------------------------------------------------------

// INB.04: `tulisInbox` juga diambil di sini; dipakai aksi order di atas (dipanggil saat permintaan masuk, setelah
// modul selesai dimuat, jadi urutan penulisan di berkas ini aman).
const { aksiInboxDaftar, tulisInbox } = buatAksiInbox({
  // deno-lint-ignore no-explicit-any
  klien: admin as any,
  balas,
  galat,
  galatDariDb,
});

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
      case "order_buat":
        return await aksiOrderBuat(req, pengguna, isi);
      case "order_daftar":
        return await aksiOrderDaftar(req, pengguna, isi);
      case "order_detail":
        return await aksiOrderDetail(req, pengguna, isi);
      case "order_batal":
        return await aksiOrderBatal(req, pengguna, isi);
      case "order_setuju":
        return await aksiOrderSetuju(req, pengguna, isi);
      case "order_tolak":
        return await aksiOrderTolak(req, pengguna, isi);
      case "order_status":
        return await aksiOrderStatus(req, pengguna, isi);
      case "order_metode_koreksi":
        return await aksiOrderMetodeKoreksi(req, pengguna, isi);
      case "order_alih_hari":
        return await aksiOrderAlihHari(req, pengguna, isi);
      case "catatan_tambah":
        return await aksiCatatanTambah(req, pengguna, isi);
      case "catatan_dibaca":
        return await aksiCatatanDibaca(req, pengguna, isi);
      case "pelanggan_luar_daftar":
        return await aksiPelangganLuarDaftar(req, pengguna, isi);
      case "pelanggan_luar_simpan":
        return await aksiPelangganLuarSimpan(req, pengguna, isi);
      case "pelanggan_luar_nonaktif":
        return await aksiPelangganLuarNonaktif(req, pengguna, isi);
      case "order_buat_wakil":
        return await aksiOrderBuatWakil(req, pengguna, isi);
      case "bantuan_daftar":
        return await aksiBantuanDaftar(req, pengguna);
      case "foto_minta_unggah":
        return await aksiFotoMintaUnggah(req, pengguna, isi);
      case "foto_catat":
        return await aksiFotoCatat(req, pengguna, isi);
      case "foto_lihat":
        return await aksiFotoLihat(req, pengguna, isi);
      case "inbox_daftar":
        return await aksiInboxDaftar(req, pengguna, isi);
      default:
        return galat(req, 400, "Aksi tidak dikenal.");
    }
  } catch (e) {
    // Hanya jenis galat yang dicatat di log server; tanpa data pengguna.
    console.error("kedai galat, aksi:", aksi, "|", (e as Error).message);
    return galat(req, 500, "Terjadi masalah di server. Coba lagi nanti.");
  }
});
