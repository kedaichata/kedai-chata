-- supabase/migrations/20261118_02_belanja_batal.sql
-- Pembatalan BLJ.01: membuang tabel belanja_item, belanja, dan lima baris pengaturan belanja.
-- Dijalankan MANUAL di SQL Editor (akun ketua), dengan penjelasan dampak dan "OK" ketua.
--
-- PERINGATAN:
--   - Semua catatan belanja dan itemnya ikut hilang. Saat BLJ.01 baru dipasang, tabel masih kosong.
--   - Bila fungsi SQL belanja (BLJ.02) atau aksi `kedai` belanja (BLJ.03) sudah dipasang, BUANG
--     fungsinya lebih dulu (dan deploy `kedai` versi sebelumnya), kalau tidak, langkah ini gagal
--     atau aksi belanja jadi galat.
--   - Tabel lain, fungsi lain, dan pengaturan lain tidak disentuh.
-- Belum pernah dicoba.

BEGIN;

DROP TABLE public.belanja_item;
DROP TABLE public.belanja;

DELETE FROM public.pengaturan
 WHERE kunci IN (
   'belanja_harga_maks',
   'belanja_nama_maks',
   'belanja_judul_maks',
   'belanja_item_maks',
   'belanja_terkunci_tampil'
 );

COMMIT;
