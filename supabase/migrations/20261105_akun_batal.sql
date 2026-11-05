-- supabase/migrations/20261105_akun_batal.sql
-- Pembatalan AKN.03 (20261105_akun.sql). Jalankan di SQL Editor HANYA bila perlu.
-- ⚠️ Menghapus tabel beserta ISINYA (akun uji, profil, alamat, staf). Butuh "OK" ketua.
-- ⚠️ Jalankan hanya bila tabel lain yang bergantung (order, dst.) belum dibuat
--    atau sudah dibatalkan lebih dulu. Sengaja TANPA CASCADE supaya gagal aman
--    bila masih ada yang bergantung.

BEGIN;

DROP FUNCTION IF EXISTS public.buat_profil(uuid, text, text, text, text);

DROP TABLE IF EXISTS public.alamat;
DROP TABLE IF EXISTS public.profil;
DROP TABLE IF EXISTS public.staf;
DROP TABLE IF EXISTS public.pengaturan;

COMMIT;
