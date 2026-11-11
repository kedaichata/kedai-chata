-- supabase/migrations/20261111_05_inbox_batal.sql
-- Pembatalan INB.01 (20261111_05_inbox.sql). Dijalankan MANUAL di SQL Editor (akun ketua).
-- Aman hanya SEBELUM fungsi `inbox_tulis` dan `inbox_daftar` (INB.02) dibuat, dan sebelum `kedai`
-- memanggilnya. Bila fungsi itu sudah ada, buang fungsinya dulu (butuh penjelasan dampak dan "OK").
--
-- Yang dibuang:
--   - tabel `public.inbox` (beserta indeks dan urutan nomornya) dan SEMUA isinya
--   - baris pengaturan `inbox_simpan_hari` dan `inbox_maks_tampil`
-- Yang TIDAK disentuh: tabel order, foto_bukti, dan tabel lain.
--
-- Perhatian: isi tabel `inbox` hilang dan tidak bisa dipulihkan. Pesan inbox hanya teks umum
-- (bukan data order), jadi tidak ada order atau catatan yang ikut hilang.
-- Pembatalan ini belum pernah dicoba.

BEGIN;

DROP TABLE public.inbox;

DELETE FROM public.pengaturan
WHERE kunci IN ('inbox_simpan_hari', 'inbox_maks_tampil');

COMMIT;
