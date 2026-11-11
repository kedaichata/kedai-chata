// supabase/functions/kedai/inbox.ts
// INB.03: aksi `inbox_daftar` (Kotak masuk, inbox.md IB1, IB5, IB6, IB8, IB9, IB11, IB15; security.md SEC-34).
// Berkas BARU, dipanggil dari `index.ts` (satu import, satu blok sambungan, satu `case`). Kode lama tidak dipindah
// (keputusan ketua 9 Nov 2026, AGENTS.md bagian 12). Pola sama dengan `order_status.ts`, `foto.ts`, dan lainnya.
//
// Alat bantu (klien database, pembalas, pemeta galat) DIBERIKAN `index.ts` lewat parameter `buatAksiInbox(alat)`,
// bukan diimpor, supaya berkas ini tidak mengimpor `index.ts` (yang langsung menjalankan server).
//
// Fungsi SQL: supabase/migrations/20261111_06_inbox_fungsi.sql (sudah dijalankan dan lulus cek SEBELUM berkas ini
// dideploy). Akun nonaktif, masa tampil (`inbox_simpan_hari`), dan batas jumlah (`inbox_maks_tampil`) dicek dan
// dibaca di fungsi SQL (aturan 19); di sini hanya pagar kasar bentuk isian.
//
// Aksi ini HANYA MEMBACA. Penulisan inbox (`inbox_tulis`) bukan di sini: dipasang di aksi order pada INB.04.
//
// Aplikasi hanya mengirim `penanda`: nomor item terakhir yang sudah dilihat di HP ini (dari localStorage, per akun).
// Penanda bukan identitas dan hanya dipakai untuk mengurutkan dan menandai "belum dibaca" (IB9). Id akun SELALU dari
// token login: isian `akun`, `id`, atau `peran` dari aplikasi diabaikan, tidak pernah diteruskan (SEC-34, SEC-06).
//
// Teks inbox sama dengan teks push: umum, tanpa data pribadi (IB4). Layar wajib memasangnya lewat `textContent` (SEC-35).
// Kode galat `pengaturan_rusak` sengaja tidak dipetakan (jadi galat umum 500), sama seperti aksi lain.

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

// inbox_daftar -> status dan pesan aman (AK14)
const PETA_GALAT_INBOX: PetaGalat = {
  id_kosong: [400, PESAN_DATA_TIDAK_VALID],
  akun_nonaktif: [403, "Akun ini tidak aktif. Hubungi pengelola."],
};

export function buatAksiInbox(alat: AlatKedai) {
  const { klien, balas, galat, galatDariDb } = alat;

  // ------------------------------------------------------------
  // Aksi: inbox_daftar (inbox.md IB5, IB6, IB9, IB11; security.md SEC-34)
  // Semua peran aktif (customer, owner, penjaga). Hanya milik pemanggil: akun dari token login.
  // Isian: `penanda` (opsional; bilangan bulat nol atau lebih; kosong dianggap 0 = semua belum dibaca).
  // Sukses: { ok: true, butir: [{ id, teks, nomor_order, waktu, belum }], terbaru, maks }
  //   - `butir` sudah berurutan: belum dibaca di atas, lalu terbaru dulu; `waktu` berupa teks WIB
  //     ("YYYY-MM-DD HH:MM"); `terbaru` = nomor item terbaru atau null; `maks` = batas jumlah tampil.
  //   - Setelah menggambar daftar, aplikasi menggeser penanda lokal ke `terbaru` (bila tidak null).
  // ------------------------------------------------------------
  async function aksiInboxDaftar(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    // Penanda: kosong = 0. Bila dikirim, harus bilangan bulat aman dan tidak negatif. Teks atau tipe lain ditolak.
    let penanda = 0;
    if (isi.penanda !== undefined && isi.penanda !== null) {
      if (
        typeof isi.penanda !== "number" ||
        !Number.isSafeInteger(isi.penanda) ||
        isi.penanda < 0
      ) {
        return galat(req, 400, PESAN_DATA_TIDAK_VALID);
      }
      penanda = isi.penanda;
    }

    // Akun dari token, bukan dari isi permintaan. Peran staf nonaktif ditolak fungsi SQL (akun_nonaktif).
    const { data, error } = await klien.rpc("inbox_daftar", {
      p_akun: pengguna.id,
      p_penanda: penanda,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_INBOX, "inbox_daftar");
    }

    if (
      data === null ||
      typeof data !== "object" ||
      !Array.isArray(data.butir)
    ) {
      throw new Error("inbox_daftar:bentuk_balasan");
    }

    return balas(req, 200, {
      ok: true,
      butir: data.butir,
      terbaru: data.terbaru ?? null,
      maks: data.maks,
    });
  }

  return { aksiInboxDaftar };
}
