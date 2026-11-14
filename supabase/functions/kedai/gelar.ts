// supabase/functions/kedai/gelar.ts
// GLR.03: aksi `gelar_saya` (Gelar customer; gelar.md GL1 sampai GL8, GL22, GL23; security.md SEC-38, SEC-39).
// Berkas BARU, dipanggil dari `index.ts` (satu import, satu blok sambungan, satu `case`). Kode lama tidak dipindah
// (keputusan ketua 9 Nov 2026, AGENTS.md bagian 12). Pola sama dengan `ringkasan.ts` dan `order_status.ts`.
//
// Alat bantu (klien database, pembaca peran, pembalas, pemeta galat) DIBERIKAN `index.ts` lewat parameter
// `buatAksiGelar(alat)`, bukan diimpor, supaya berkas ini tidak mengimpor `index.ts` (yang langsung
// menjalankan server).
//
// Fungsi SQL: supabase/migrations/20261114_02_gelar_saya.sql (sudah dijalankan dan lulus cek SEBELUM berkas ini
// dideploy; Handoff #1 di gelar.md). Penentuan gelar tingkat, gelar menu, dan kalimat apresiasi SEMUA dihitung
// fungsi SQL dari jam dan data server (GL23). Di sini tidak ada perhitungan apa pun.
//
// Aksi ini HANYA MEMBACA. Tanpa `tulisInbox`, tanpa push.
//
// Aplikasi tidak mengirim apa pun yang dipakai: seluruh isian dari aplikasi (`akun`, `id`, `peran`, dan lainnya)
// diabaikan dan tidak pernah diteruskan (SEC-06). Id akun SELALU dari token login.
// Hak customer dipaksa di sini (lapis kedua) dan di fungsi SQL (`peran_tidak_boleh`) (GL7, SEC-38).
//
// Kode galat: `id_kosong` dan `pengaturan_rusak` sengaja tidak dipetakan (jadi galat umum 500), sama seperti aksi lain.
// Balasan hanya nama gelar, deskripsi gelar tingkat, nama gelar menu, dan kalimat apresiasi, tanpa angka dan tanpa
// data pribadi (GL15, GL23, SEC-39).

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
};

const PESAN_TIDAK_AKTIF = "Akun ini tidak aktif. Hubungi pengelola.";
const PESAN_HANYA_CUSTOMER = "Aksi ini hanya untuk customer.";

// gelar_saya -> status dan pesan aman (AK14)
const PETA_GALAT_GELAR: PetaGalat = {
  akun_nonaktif: [403, PESAN_TIDAK_AKTIF],
  peran_tidak_boleh: [403, PESAN_HANYA_CUSTOMER],
  profil_tidak_ada: [400, "Lengkapi profil dulu."],
};

// Pemeriksaan bentuk balasan fungsi SQL sebelum diteruskan ke layar.
// deno-lint-ignore no-explicit-any
function bentukBalasanValid(d: any): boolean {
  if (d === null || typeof d !== "object" || Array.isArray(d)) return false;
  if (typeof d.apresiasi !== "string") return false;
  if (!Array.isArray(d.menu)) return false;
  for (const m of d.menu) {
    if (m === null || typeof m !== "object" || typeof m.nama !== "string") {
      return false;
    }
  }
  if (d.tingkat !== null) {
    if (
      d.tingkat === undefined ||
      typeof d.tingkat !== "object" ||
      Array.isArray(d.tingkat) ||
      typeof d.tingkat.nama !== "string" ||
      typeof d.tingkat.deskripsi !== "string"
    ) {
      return false;
    }
  }
  return true;
}

export function buatAksiGelar(alat: AlatKedai) {
  const { klien, bacaPeran, balas, galat, galatDariDb } = alat;

  // ------------------------------------------------------------
  // Aksi: gelar_saya (gelar.md GL7, GL22, GL23; security.md SEC-38, SEC-39)
  // Hanya customer aktif. Tanpa isian: semua isian dari aplikasi diabaikan.
  // Sukses: { ok: true, gelar: { tingkat: {nama, deskripsi} | null, menu: [{nama}], apresiasi } }
  // (bentuk dari fungsi SQL, diteruskan apa adanya setelah dicek bentuknya).
  // ------------------------------------------------------------
  async function aksiGelarSaya(
    req: Request,
    pengguna: Pengguna,
    _isi: Record<string, unknown>,
  ): Promise<Response> {
    const p = await bacaPeran(pengguna.id);
    if (p.jenis === "nonaktif") {
      return galat(req, 403, PESAN_TIDAK_AKTIF);
    }
    // Lapis kedua peran: hanya customer (SEC-38 untuk owner dan penjaga)
    if (p.jenis !== "customer") {
      return galat(req, 403, PESAN_HANYA_CUSTOMER);
    }

    const { data, error } = await klien.rpc("gelar_saya", {
      p_akun: pengguna.id,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_GELAR, "gelar_saya");
    }

    if (!bentukBalasanValid(data)) {
      throw new Error("gelar_saya:bentuk_balasan");
    }

    return balas(req, 200, { ok: true, gelar: data });
  }

  return { aksiGelarSaya };
}
