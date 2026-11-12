// supabase/functions/kedai/push.ts
// NTF.03: aksi `push_daftar` dan `push_nonaktifkan` (notifikasi.md NT5, NT7; security.md SEC-09, SEC-25).
// Berkas BARU, dipanggil dari `index.ts` (satu import, satu blok sambungan, dua `case`). Kode lama tidak dipindah
// (keputusan ketua 9 Nov 2026, AGENTS.md bagian 12). Pola sama dengan `inbox.ts`, `foto.ts`, dan lainnya.
//
// Alat bantu (klien database, pembalas, pemeta galat) DIBERIKAN `index.ts` lewat parameter `buatAksiPush(alat)`,
// bukan diimpor, supaya berkas ini tidak mengimpor `index.ts` (yang langsung menjalankan server).
//
// Fungsi SQL: supabase/migrations/20261112_02_langganan_push_fungsi.sql (sudah dijalankan dan lulus cek SEBELUM
// berkas ini dideploy). Akun nonaktif, format isian, dan batas perangkat (`push_maks_perangkat`) dicek di fungsi SQL
// (aturan 19); di sini hanya pagar kasar bentuk isian.
//
// Dua aksi ini untuk SEMUA yang login (customer, owner, penjaga). Id akun SELALU dari token login: isian `akun`,
// `id`, atau `peran` dari aplikasi diabaikan, tidak pernah diteruskan (SEC-06, SEC-09, SEC-25).
//
// Isian `push_daftar` (dari PushSubscription peramban): `endpoint` (teks), `p256dh` (teks), `auth` (teks).
// Isian `push_nonaktifkan`: `endpoint` (teks).
// Isi langganan (endpoint dan dua kunci) TIDAK PERNAH dikirim balik ke aplikasi dan tidak ditulis di log.
//
// Kode galat `pengaturan_rusak` sengaja tidak dipetakan (jadi galat umum 500), sama seperti aksi lain.
// Pengirim push TIDAK ada di sini (NTF.06).

// Bentuk yang sama dengan `Pengguna` di index.ts.
type Pengguna = { id: string };

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
  balas: (req: Request, status: number, isi: unknown) => Response;
  galat: (req: Request, status: number, pesan: string) => Response;
  galatDariDb: (
    req: Request,
    error: { message?: string; code?: string },
    peta: PetaGalat,
    nama: string,
  ) => Response;
};

const PESAN_DATA_TIDAK_VALID = "Data belum lengkap atau tidak valid.";

// Pagar kasar panjang isian (batas sebenarnya dicek fungsi SQL: endpoint 20 sampai 2000, kunci 1 sampai 200).
const BATAS_ENDPOINT = 2000;
const BATAS_KUNCI = 200;

// push_daftar dan push_nonaktifkan -> status dan pesan aman (AK14)
const PETA_GALAT_PUSH: PetaGalat = {
  id_kosong: [400, PESAN_DATA_TIDAK_VALID],
  akun_nonaktif: [403, "Akun ini tidak aktif. Hubungi pengelola."],
  langganan_tidak_valid: [400, "Data notifikasi perangkat tidak valid."],
};

// Teks tidak kosong dengan batas panjang, atau null bila bentuknya salah.
function teksBatas(v: unknown, batas: number): string | null {
  if (typeof v !== "string") return null;
  if (v.length === 0 || v.length > batas) return null;
  return v;
}

export function buatAksiPush(alat: AlatKedai) {
  const { klien, balas, galat, galatDariDb } = alat;

  // ------------------------------------------------------------
  // Aksi: push_daftar (notifikasi.md NT5; Handoff #2 dan blok 12 Nov 2026)
  // Menyimpan langganan satu perangkat untuk akun pemanggil. HP yang sama dipakai akun lain: baris dipindah ke
  // akun yang login. Perangkat aktif melebihi batas: yang aktif terlama dinonaktifkan, pendaftaran baru tetap berhasil.
  // Sukses: { ok: true, perangkat_dinonaktifkan: <jumlah perangkat lama yang dimatikan karena batas> }
  // ------------------------------------------------------------
  async function aksiPushDaftar(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const endpoint = teksBatas(isi.endpoint, BATAS_ENDPOINT);
    const p256dh = teksBatas(isi.p256dh, BATAS_KUNCI);
    const auth = teksBatas(isi.auth, BATAS_KUNCI);
    if (endpoint === null || p256dh === null || auth === null) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    // Akun dari token, bukan dari isi permintaan.
    const { data, error } = await klien.rpc("push_daftar", {
      p_akun: pengguna.id,
      p_endpoint: endpoint,
      p_p256dh: p256dh,
      p_auth: auth,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_PUSH, "push_daftar");
    }

    const dilepas = Number(data);
    return balas(req, 200, {
      ok: true,
      perangkat_dinonaktifkan:
        Number.isSafeInteger(dilepas) && dilepas > 0 ? dilepas : 0,
    });
  }

  // ------------------------------------------------------------
  // Aksi: push_nonaktifkan (notifikasi.md NT5; security.md SEC-25)
  // Mematikan langganan satu perangkat, HANYA bila milik pemanggil (dicek fungsi SQL). Juga dipanggil saat Keluar.
  // Balasan selalu sama bila bentuk isian benar, baik langganannya ada, sudah mati, maupun milik akun lain, supaya
  // keberadaan langganan akun lain tidak bocor dan proses Keluar tidak macet.
  // Sukses: { ok: true }
  // ------------------------------------------------------------
  async function aksiPushNonaktifkan(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const endpoint = teksBatas(isi.endpoint, BATAS_ENDPOINT);
    if (endpoint === null) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    const { error } = await klien.rpc("push_nonaktifkan", {
      p_akun: pengguna.id,
      p_endpoint: endpoint,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_PUSH, "push_nonaktifkan");
    }

    return balas(req, 200, { ok: true });
  }

  return { aksiPushDaftar, aksiPushNonaktifkan };
}
