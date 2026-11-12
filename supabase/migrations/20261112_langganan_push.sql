-- supabase/migrations/20261112_langganan_push.sql
-- NTF.02: tabel langganan_push, satu baris pengaturan push_maks_perangkat, hak minimal, dan RLS.
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo.
-- Pembatalan: supabase/migrations/20261112_langganan_push_batal.sql
-- Cek hasil: supabase/templates/20261112_langganan_push_cek.sql
-- Tanpa data nyata. Semua objek di sini BARU; tabel order, inbox, foto_bukti, dan tabel lain tidak disentuh.
-- Aksi `kedai` (push_daftar, push_nonaktifkan) dikerjakan di NTF.03, bukan di berkas ini.
-- Sampai NTF.03 dideploy, tidak ada yang membaca atau menulis tabel ini.
--
-- Yang BARU:
--   - tabel `public.langganan_push`
--   - baris pengaturan `push_maks_perangkat`
--
-- Keputusan yang berlaku (notifikasi.md NT5, NT7; database.md bagian 2, 3, 4):
--   - Satu akun boleh punya beberapa perangkat. Satu baris per perangkat.
--   - Langganan yang mati atau dimatikan pengguna DINONAKTIFKAN (`aktif` = false), tidak dihapus.
--   - `service_role` HANYA baca, tambah, dan ubah: tanpa DELETE. anon/authenticated nol hak.
--   - Isi langganan (alamat push dan dua kunci) tidak pernah dikirim balik ke aplikasi (aturan di NTF.03).
--   - Nilai awal `push_maks_perangkat` = 5.
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   1. Nama tabel `langganan_push` (sesuai database.md); nama kolom `akun`, `endpoint`, `kunci_p256dh`,
--      `kunci_auth`, `aktif`, `dibuat_pada`, `terakhir_berhasil_pada`.
--   2. `id` bertipe uuid dengan nilai bawaan, jadi tidak ada urutan nomor otomatis yang perlu dicabut haknya.
--   3. `akun` merujuk `auth.users` (owner dan penjaga tidak punya profil), sama seperti `inbox.penerima`.
--   4. `endpoint` UNIK se-tabel: satu HP punya satu endpoint. Bila HP yang sama dipakai bergantian dua akun,
--      NTF.03 memindahkan baris itu ke akun yang sedang login, bukan membuat baris dobel.
--   5. `endpoint` harus diawali `https://`, 20 sampai 2000 karakter, tanpa spasi atau karakter kontrol.
--   6. Dua kunci langganan: 1 sampai 200 karakter, hanya huruf, angka, `-`, `_`, dan `=` (base64url).
--   7. Batas "maksimal `push_maks_perangkat` perangkat aktif per akun" TIDAK dijaga tabel. Pengecekannya
--      dilakukan `push_daftar` (NTF.03), yang juga memastikan nilai pengaturan bilangan bulat 1 sampai 20
--      (di luar itu galat `pengaturan_rusak`). Tabel `pengaturan` sendiri tidak diberi pagar di sini.

BEGIN;

-- ============================================================
-- 1. Pengaturan baru (database.md bagian 4: angka yang bisa berubah ada di database)
-- ============================================================
INSERT INTO public.pengaturan (kunci, nilai, keterangan)
VALUES
  ('push_maks_perangkat', '5', 'Batas perangkat aktif per akun untuk notifikasi push (NT5)');

-- ============================================================
-- 2. langganan_push (NT5): satu baris per perangkat.
--    Tidak dihapus oleh aplikasi; yang mati atau dimatikan ditandai aktif = false.
-- ============================================================
CREATE TABLE public.langganan_push (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  akun                   uuid        NOT NULL REFERENCES auth.users (id),
  endpoint               text        NOT NULL
    CONSTRAINT langganan_push_endpoint_cek CHECK (
      char_length(endpoint) BETWEEN 20 AND 2000
      AND endpoint LIKE 'https://%'
      AND endpoint !~ '[[:space:][:cntrl:]]'
    ),
  kunci_p256dh           text        NOT NULL
    CONSTRAINT langganan_push_p256dh_cek CHECK (
      char_length(kunci_p256dh) BETWEEN 1 AND 200
      AND kunci_p256dh ~ '^[A-Za-z0-9_=-]+$'
    ),
  kunci_auth             text        NOT NULL
    CONSTRAINT langganan_push_auth_cek CHECK (
      char_length(kunci_auth) BETWEEN 1 AND 200
      AND kunci_auth ~ '^[A-Za-z0-9_=-]+$'
    ),
  aktif                  boolean     NOT NULL DEFAULT true,
  dibuat_pada            timestamptz NOT NULL DEFAULT now(),
  terakhir_berhasil_pada timestamptz,
  CONSTRAINT langganan_push_endpoint_unik UNIQUE (endpoint)
);

-- Untuk menghitung dan mengambil perangkat aktif per akun (batas NT5 dan pengirim push)
CREATE INDEX langganan_push_akun_aktif_idx
  ON public.langganan_push (akun)
  WHERE aktif;

-- ============================================================
-- 3. RLS aktif, TANPA policy untuk aplikasi (AGENTS.md bagian 7)
-- ============================================================
ALTER TABLE public.langganan_push ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. Hak: cabut SEMUA dulu (termasuk bawaan Supabase), lalu beri ulang
--    seminimal mungkin ke service_role. Tanpa DELETE. anon/authenticated nol.
-- ============================================================
REVOKE ALL ON TABLE public.langganan_push FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.langganan_push TO service_role;

COMMIT;
