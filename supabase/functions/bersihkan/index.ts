// supabase/functions/bersihkan/index.ts
// FTO.05: Edge Function `bersihkan`, pembersih berkas foto bukti (foto-bukti.md FT6 sampai FT9, security.md aturan 3 dan 12).
// Fungsi ini TERPISAH dari `kedai` (folder sendiri). `kedai/index.ts` tidak disentuh.
//
// Yang dikerjakan (hanya di bucket `foto-bukti`):
//   1. Hapus berkas foto yang layak: sudah ditandai diganti, atau lebih tua dari `foto_simpan_hari` hari.
//      Pilihannya dari fungsi SQL `foto_bersih_pilih`; penandaan "sudah dibersihkan" lewat `foto_bersih_tandai`
//      (migration 20261111_03_foto_bersih_fungsi.sql, HARUS sudah dijalankan dan lulus cek SEBELUM berkas ini dideploy).
//   2. Sapu berkas tanpa baris di tabel `foto_bukti` yang lebih tua dari batas yang sama (sisa unggahan yang tidak
//      sempat dicatat, FT7). Ada tidaknya baris ditanyakan ke `foto_bersih_tanpa_baris`.
// Yang TIDAK dilakukan: menghapus baris tabel, order, catatan, atau berkas di bucket lain. Penghapusan berkas lewat
// jalur resmi Storage (bukan lewat SQL ke tabel Storage), karena berkas bisa tertinggal bila lewat SQL (FT7).
//
// MODE SIMULASI: bila isi permintaan memuat {"simulasi": true}, fungsi hanya MELAPORKAN jumlah yang akan diproses,
// tanpa menghapus berkas dan tanpa menandai baris. Penjadwal tidak pernah mengirim simulasi. Gunakan untuk uji
// pertama, karena foto yang terhapus tidak bisa dipulihkan.
//
// PAGAR AKSES (satu-satunya pagar, keputusan ketua 5 Nov 2026; AGENTS.md bagian 7): fungsi ini dideploy DENGAN
// `--no-verify-jwt`, jadi pengecekan token dari platform TIDAK ada. Karena itu RAHASIA PENJADWAL dicek PALING AWAL,
// sebelum membaca isi permintaan atau menyentuh database. Tanpa rahasia atau rahasia salah: 401. JANGAN dilonggarkan
// (misalnya hanya mengecek header ada atau tidak) dan JANGAN diubah agar menerima kunci Supabase lewat `Authorization`
// atau `apikey` (SEC-21): kunci Supabase tidak pernah dianggap rahasia penjadwal. Rahasia dikirim lewat header
// `x-rahasia-penjadwal`, nilainya dibandingkan dengan cara yang tidak membocorkan lewat waktu respons.
//
// Rahasia dan variabel lingkungan (hanya di dashboard, DILARANG ditulis di kode, repo, md, atau chat):
//   - RAHASIA_PENJADWAL : rahasia penjadwal, minimal 32 karakter acak. Bila kosong atau terlalu pendek, semua
//                         permintaan ditolak 401 (jalan aman), dan penyebabnya dicatat di log server.
//   - KUNCI_SECRET_KEDAI: kunci secret Supabase (sb_secret_...), variabel yang SAMA dengan `kedai` (keputusan ketua
//                         11 Nov 2026), dipakai untuk database dan Storage.
//   - SUPABASE_URL      : diisi otomatis oleh platform.
//
// Deploy (urutan aman AGENTS.md bagian 8), DENGAN --no-verify-jwt (khusus fungsi ini; flag `kedai` sengaja beda):
//   supabase functions deploy bersihkan --use-api --no-verify-jwt --project-ref "$PROJECT_REF"
//
// Balasan hanya berisi angka ringkasan, tanpa nama berkas, id, atau data pribadi. Log hanya jenis galat dan angka.
// Angka teknis di bawah (ukuran potongan, batas waktu) adalah batas kerja fungsi, bukan aturan bisnis; aturan bisnis
// (lama simpan) dibaca dari tabel pengaturan oleh fungsi SQL (AGENTS.md bagian 1).

import { createClient } from "npm:@supabase/supabase-js@2.58.0";

// ------------------------------------------------------------
// Pengaturan dasar
// ------------------------------------------------------------

// Satu-satunya bucket yang disentuh (dibuat di FTO.01). Tidak ada bucket foto menu.
const BUCKET = "foto-bukti";

// Nama header pembawa rahasia penjadwal.
const NAMA_HEADER_RAHASIA = "x-rahasia-penjadwal";

// Panjang minimal rahasia penjadwal; di bawah ini dianggap belum disetel (semua permintaan ditolak).
const PANJANG_RAHASIA_MIN = 32;

// Batas ukuran isi permintaan (karakter). Isinya hanya {"simulasi": true} atau kosong.
const BATAS_ISI = 1000;

// Jumlah berkas per panggilan hapus ke Storage.
const UKURAN_HAPUS = 100;

// Jumlah lokasi per panggilan `foto_bersih_tanpa_baris` (batas fungsi SQL 1000).
const UKURAN_CEK_YATIM = 500;

// Jumlah entri per halaman saat membaca isi bucket.
const HALAMAN = 100;

// Batas halaman daftar folder tingkat atas (HALAMAN x ini = jumlah folder maksimal yang dibaca per putaran).
const MAKS_HALAMAN_ROOT = 50;

// Jumlah folder yang dibaca bersamaan saat menyapu.
const PARALEL = 10;

// Batas waktu penyapuan berkas tanpa baris (milidetik). Lewat dari ini, penyapuan berhenti dan dilaporkan terpotong;
// berkas yang belum terbaca akan disapu pada putaran mingguan berikutnya.
const MAKS_MS_SAPUAN = 90_000;

// ------------------------------------------------------------
// Klien database dan Storage (kunci secret, hanya di dalam fungsi)
// ------------------------------------------------------------

const URL_PROJECT = Deno.env.get("SUPABASE_URL") ?? "";
const KUNCI_SECRET = Deno.env.get("KUNCI_SECRET_KEDAI") ?? "";
const RAHASIA_PENJADWAL = Deno.env.get("RAHASIA_PENJADWAL") ?? "";

const admin =
  URL_PROJECT && KUNCI_SECRET
    ? createClient(URL_PROJECT, KUNCI_SECRET, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

// ------------------------------------------------------------
// Pembantu
// ------------------------------------------------------------

const REGEX_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Balasan JSON. Tanpa header CORS: fungsi ini dipanggil penjadwal dari database, bukan dari peramban.
function jawab(status: number, isi: unknown): Response {
  return new Response(JSON.stringify(isi), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// Kode galat Storage atau database untuk log (tanpa pesan mentah, tanpa data).
// deno-lint-ignore no-explicit-any
function kodeGalat(e: any): string {
  return String(e?.statusCode ?? e?.status ?? e?.code ?? "");
}

function potongan<T>(daftar: T[], ukuran: number): T[][] {
  const hasil: T[][] = [];
  for (let i = 0; i < daftar.length; i += ukuran) {
    hasil.push(daftar.slice(i, i + ukuran));
  }
  return hasil;
}

// Perbandingan rahasia tanpa membocorkan lewat waktu respons: kedua sisi di-hash SHA-256 (panjang sama),
// lalu dibandingkan seluruh bytes tanpa berhenti di selisih pertama.
async function samaRahasia(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let selisih = 0;
  for (let i = 0; i < x.length; i++) selisih |= x[i] ^ y[i];
  return selisih === 0;
}

// Pagar akses: rahasia penjadwal. Sah hanya bila rahasia sudah disetel (cukup panjang) DAN header cocok persis.
async function rahasiaSah(req: Request): Promise<boolean> {
  if (RAHASIA_PENJADWAL.length < PANJANG_RAHASIA_MIN) {
    console.error(
      "bersihkan: RAHASIA_PENJADWAL belum disetel atau terlalu pendek",
    );
    return false;
  }
  const kiriman = req.headers.get(NAMA_HEADER_RAHASIA) ?? "";
  if (kiriman === "") return false;
  return await samaRahasia(kiriman, RAHASIA_PENJADWAL);
}

// ------------------------------------------------------------
// Langkah 1: hapus berkas foto yang layak (diganti atau lewat batas simpan)
// ------------------------------------------------------------

type FotoLayak = { id: string; lokasi: string };

type Ringkasan = {
  foto_diproses: number; // dihapus (atau, bila simulasi, yang akan dihapus)
  foto_ditandai: number; // baris yang diberi dibersihkan_pada
  yatim_diproses: number; // berkas tanpa baris, dihapus (atau akan dihapus)
  sapuan_terpotong: boolean;
  gagal: number;
};

async function bersihkanFotoLayak(
  foto: FotoLayak[],
  simulasi: boolean,
  hasil: Ringkasan,
): Promise<void> {
  const bucket = admin!.storage.from(BUCKET);
  for (const grup of potongan(foto, UKURAN_HAPUS)) {
    if (simulasi) {
      hasil.foto_diproses += grup.length;
      continue;
    }

    // Hapus berkas lewat jalur resmi Storage. Berkas yang sudah tidak ada bukan galat.
    const { error: eHapus } = await bucket.remove(grup.map((f) => f.lokasi));
    if (eHapus) {
      hasil.gagal++;
      console.error("bersihkan: hapus berkas gagal, kode", kodeGalat(eHapus));
      continue; // baris tidak ditandai; putaran berikutnya mengulang dengan aman
    }

    // Baru setelah berkas terhapus: tandai barisnya. Fungsi SQL hanya menandai baris yang memang layak.
    const { data: n, error: eTandai } = await admin!.rpc("foto_bersih_tandai", {
      p_ids: grup.map((f) => f.id),
    });
    if (eTandai) {
      hasil.gagal++;
      console.error("bersihkan: tandai gagal, kode", kodeGalat(eTandai));
      continue; // berkas sudah terhapus; putaran berikutnya menandai
    }
    hasil.foto_diproses += grup.length;
    hasil.foto_ditandai += Number(n) || 0;
  }
}

// ------------------------------------------------------------
// Langkah 2: sapu berkas tanpa baris yang lebih tua dari batas
// ------------------------------------------------------------

// Kumpulkan lokasi berkas yang lebih tua dari `batas` (milidetik). Struktur bucket: `<id order>/<nama berkas>`.
// Hanya berkas yang dikumpulkan; folder di Storage bersifat maya dan hilang sendiri bila kosong.
async function kumpulkanBerkasLama(
  batas: number,
  mulai: number,
): Promise<{ lokasi: string[]; terpotong: boolean }> {
  const bucket = admin!.storage.from(BUCKET);
  const lokasi: string[] = [];
  const folder: string[] = [];
  let terpotong = false;

  // Daftar tingkat atas: entri dengan id kosong adalah folder, entri dengan id adalah berkas di akar.
  let selesai = false;
  for (let h = 0; h < MAKS_HALAMAN_ROOT; h++) {
    const { data, error } = await bucket.list("", {
      limit: HALAMAN,
      offset: h * HALAMAN,
    });
    if (error) throw new Error("list_akar:" + kodeGalat(error));
    // deno-lint-ignore no-explicit-any
    const baris: any[] = Array.isArray(data) ? data : [];
    for (const b of baris) {
      if (typeof b?.name !== "string" || b.name.startsWith(".")) continue;
      if (b.id === null || b.id === undefined) {
        folder.push(b.name);
      } else if (Date.parse(b.created_at) < batas) {
        lokasi.push(b.name);
      }
    }
    if (baris.length < HALAMAN) {
      selesai = true;
      break;
    }
  }
  if (!selesai) terpotong = true;

  // Isi tiap folder, beberapa folder bersamaan. Berhenti bila waktu penyapuan habis.
  for (const grup of potongan(folder, PARALEL)) {
    if (Date.now() - mulai > MAKS_MS_SAPUAN) {
      terpotong = true;
      break;
    }
    const balasan = await Promise.all(
      grup.map(async (nama) => {
        const { data, error } = await bucket.list(nama, { limit: HALAMAN });
        if (error) throw new Error("list_folder:" + kodeGalat(error));
        // deno-lint-ignore no-explicit-any
        const isi: any[] = Array.isArray(data) ? data : [];
        const hasil: string[] = [];
        for (const b of isi) {
          if (typeof b?.name !== "string" || b.name.startsWith(".")) continue;
          if (b.id === null || b.id === undefined) continue; // sub-folder tidak dipakai aplikasi
          // Umur dari waktu dibuat di Storage; tanpa waktu yang valid dianggap baru (tidak disapu).
          const dibuat = Date.parse(b.created_at);
          if (Number.isFinite(dibuat) && dibuat < batas) {
            hasil.push(nama + "/" + b.name);
          }
        }
        return hasil;
      }),
    );
    for (const hasil of balasan) lokasi.push(...hasil);
  }

  return { lokasi, terpotong };
}

async function sapuBerkasYatim(
  batas: number,
  mulai: number,
  simulasi: boolean,
  hasil: Ringkasan,
): Promise<void> {
  const bucket = admin!.storage.from(BUCKET);
  const { lokasi, terpotong } = await kumpulkanBerkasLama(batas, mulai);
  if (terpotong) hasil.sapuan_terpotong = true;

  // Dari berkas yang lama, mana yang tidak punya baris di tabel foto_bukti.
  const yatim: string[] = [];
  for (const grup of potongan(lokasi, UKURAN_CEK_YATIM)) {
    const { data, error } = await admin!.rpc("foto_bersih_tanpa_baris", {
      p_lokasi: grup,
    });
    if (error) throw new Error("tanpa_baris:" + kodeGalat(error));
    if (Array.isArray(data)) {
      for (const l of data) if (typeof l === "string") yatim.push(l);
    }
  }

  for (const grup of potongan(yatim, UKURAN_HAPUS)) {
    if (simulasi) {
      hasil.yatim_diproses += grup.length;
      continue;
    }
    const { error } = await bucket.remove(grup);
    if (error) {
      hasil.gagal++;
      console.error("bersihkan: hapus yatim gagal, kode", kodeGalat(error));
      continue;
    }
    hasil.yatim_diproses += grup.length;
  }
}

// ------------------------------------------------------------
// Satu putaran pembersihan
// ------------------------------------------------------------

async function jalankan(simulasi: boolean): Promise<Ringkasan> {
  const mulai = Date.now();
  const hasil: Ringkasan = {
    foto_diproses: 0,
    foto_ditandai: 0,
    yatim_diproses: 0,
    sapuan_terpotong: false,
    gagal: 0,
  };

  // Pilihan dari database: batas waktu dan foto yang layak. Batas dihitung fungsi SQL dari `foto_simpan_hari`.
  const { data: pilih, error: ePilih } = await admin!.rpc("foto_bersih_pilih");
  if (ePilih) throw new Error("foto_bersih_pilih:" + kodeGalat(ePilih));

  const batas = Date.parse(pilih?.batas_waktu);
  if (!Number.isFinite(batas)) throw new Error("batas_waktu_rusak");

  // Hanya lokasi yang bentuknya wajar yang diteruskan ke Storage (pagar tambahan; database sudah menjaga bentuknya).
  const foto: FotoLayak[] = [];
  if (Array.isArray(pilih?.foto)) {
    for (const f of pilih.foto) {
      if (
        typeof f?.id === "string" &&
        REGEX_UUID.test(f.id) &&
        typeof f?.lokasi === "string" &&
        f.lokasi.length > 0 &&
        !f.lokasi.startsWith("/") &&
        !f.lokasi.includes("..")
      ) {
        foto.push({ id: f.id, lokasi: f.lokasi });
      }
    }
  }

  await bersihkanFotoLayak(foto, simulasi, hasil);

  // Penyapuan berkas tanpa baris adalah tambahan: galatnya dicatat dan tidak membatalkan hasil langkah 1.
  try {
    await sapuBerkasYatim(batas, mulai, simulasi, hasil);
  } catch (e) {
    hasil.gagal++;
    console.error(
      "bersihkan: penyapuan berkas tanpa baris gagal:",
      (e as Error).message,
    );
  }

  return hasil;
}

// ------------------------------------------------------------
// Pintu masuk
// ------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // Pagar akses PALING AWAL: rahasia penjadwal. Tanpa rahasia yang benar tidak ada yang dibaca atau dihapus.
  let sah = false;
  try {
    sah = await rahasiaSah(req);
  } catch (_e) {
    sah = false;
  }
  if (!sah) {
    return jawab(401, { ok: false, pesan: "Tidak diizinkan." });
  }

  if (req.method !== "POST") {
    return jawab(405, { ok: false, pesan: "Permintaan tidak dikenal." });
  }

  if (!admin) {
    console.error(
      "bersihkan: klien database tidak siap (URL atau kunci secret kosong)",
    );
    return jawab(500, { ok: false, pesan: "Terjadi masalah di server." });
  }

  // Isi permintaan: kosong, atau objek JSON. Hanya `simulasi === true` yang diperhatikan; selainnya diabaikan.
  let simulasi = false;
  try {
    const teks = await req.text();
    if (teks.length > BATAS_ISI) {
      return jawab(413, { ok: false, pesan: "Permintaan terlalu besar." });
    }
    if (teks.trim() !== "") {
      const j = JSON.parse(teks);
      if (j === null || typeof j !== "object" || Array.isArray(j)) {
        return jawab(400, { ok: false, pesan: "Permintaan tidak valid." });
      }
      simulasi = (j as Record<string, unknown>).simulasi === true;
    }
  } catch (_e) {
    return jawab(400, { ok: false, pesan: "Permintaan tidak valid." });
  }

  try {
    const hasil = await jalankan(simulasi);
    const ringkasan = { ok: hasil.gagal === 0, simulasi, ...hasil };
    console.log("bersihkan selesai:", JSON.stringify(ringkasan));
    // Bila ada yang gagal, status 500 supaya tercatat sebagai gagal di catatan pemanggilan.
    return jawab(hasil.gagal === 0 ? 200 : 500, ringkasan);
  } catch (e) {
    // Hanya jenis galat yang dicatat; tanpa data.
    console.error("bersihkan galat:", (e as Error).message);
    return jawab(500, { ok: false, pesan: "Terjadi masalah di server." });
  }
});
