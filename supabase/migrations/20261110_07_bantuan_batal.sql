-- supabase/migrations/20261110_07_bantuan_batal.sql
-- Pembatalan BTN.01 (20261110_07_bantuan.sql). Jalankan di SQL Editor HANYA bila perlu.
-- ⚠️ Menghapus tabel `bantuan` beserta ISINYA. Bila sudah ada isi dari lembar, isinya hilang dari database
--    (lembar Google Sheet tetap menjadi cadangan, bantuan.md BT7). Butuh "OK" ketua.
-- Sengaja TANPA CASCADE supaya gagal aman bila ada yang bergantung.
-- Tidak menyentuh order, akun, menu, atau tabel lain.

BEGIN;

DROP TABLE IF EXISTS public.bantuan;

COMMIT;
