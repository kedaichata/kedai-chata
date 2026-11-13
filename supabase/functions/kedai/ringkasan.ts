// supabase/functions/kedai/ringkasan.ts
// RKS.02: aksi `ringkasan_7hari` (Ringkasan order 7 hari untuk owner; ringkasan.md RK1, RK10, RK11, RK15;
// security.md SEC-36, SEC-37).
// Berkas BARU, dipanggil dari `index.ts` (satu import, satu blok sambungan, satu `case`). Kode lama tidak dipindah
// (keputusan ketua 9 Nov 2026, AGENTS.md bagian 12). Pola sama dengan `order_status.ts` dan `inbox.ts`.
//
// Alat bantu (klien database, pembaca peran, pembalas, pemeta galat) DIBERIKAN `index.ts` lewat parameter
// `buatAksiRingkasan(alat)`, bukan diimpor, supaya berkas ini tidak mengimpor `index.ts` (yang langsung
// menjalankan server).
//
// Fungsi SQL: supabase/migrations/20261113_02_ringkasan_7hari.sql (sudah dijalankan dan lulus cek A sampai G
// SEBELUM berkas ini dideploy; Handoff #1 di ringkasan.md). Hari, jumlah, nilai, rata-rata, terlaris, dan tersepi
// SEMUA dihitung fungsi SQL dari jam server (RK10). Di sini tidak ada perhitungan apa pun.
//
// Aksi ini HANYA MEMBACA. Tanpa `tulisInbox`, tanpa push.
//
// Aplikasi tidak mengirim apa pun yang dipakai: seluruh isian dari aplikasi (`akun`, `id`, `peran`, `hari`,
// tanggal, dan lainnya) diabaikan dan tidak pernah diteruskan (SEC-06). Id akun SELALU dari token login.
// Hak owner dipaksa di sini (lapis kedua) dan di fungsi SQL (`bukan_owner`) (security.md aturan 8, SEC-36).
//
// Kode galat: `id_kosong` dan `pengaturan_rusak` sengaja tidak dipetakan (jadi galat umum 500), sama seperti aksi lain.
// Balasan hanya angka dan tanggal, tanpa data pribadi (RK15, SEC-37).

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
const PESAN_HANYA_OWNER = "Aksi ini hanya untuk owner.";

// ringkasan_7hari -> status dan pesan aman (AK14)
const PETA_GALAT_RINGKASAN: PetaGalat = {
  akun_nonaktif: [403, PESAN_TIDAK_AKTIF],
  bukan_owner: [403, PESAN_HANYA_OWNER],
};

export function buatAksiRingkasan(alat: AlatKedai) {
  const { klien, bacaPeran, balas, galat, galatDariDb } = alat;

  // ------------------------------------------------------------
  // Aksi: ringkasan_7hari (ringkasan.md RK1, RK10; security.md SEC-36, SEC-37)
  // Hanya owner aktif. Tanpa isian: semua isian dari aplikasi diabaikan.
  // Sukses: { ok: true, ringkasan: { hari_ini, total_order, total_nilai, rata_rata_order,
  //   per_hari: [7 elemen], belum_ada_perbedaan, terlaris, tersepi } } (bentuk dari fungsi SQL, diteruskan apa adanya).
  // ------------------------------------------------------------
  async function aksiRingkasan7Hari(
    req: Request,
    pengguna: Pengguna,
    _isi: Record<string, unknown>,
  ): Promise<Response> {
    const p = await bacaPeran(pengguna.id);
    if (p.jenis === "nonaktif") {
      return galat(req, 403, PESAN_TIDAK_AKTIF);
    }
    // Lapis kedua peran: hanya owner (SEC-36 untuk customer dan penjaga)
    if (p.jenis !== "staf" || p.peran !== "owner") {
      return galat(req, 403, PESAN_HANYA_OWNER);
    }

    const { data, error } = await klien.rpc("ringkasan_7hari", {
      p_akun: pengguna.id,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_RINGKASAN, "ringkasan_7hari");
    }

    if (
      data === null ||
      typeof data !== "object" ||
      !Array.isArray(data.per_hari)
    ) {
      throw new Error("ringkasan_7hari:bentuk_balasan");
    }

    return balas(req, 200, { ok: true, ringkasan: data });
  }

  return { aksiRingkasan7Hari };
}
