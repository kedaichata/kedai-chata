-- supabase/migrations/20261106_ganti_profil_batal.sql
-- Pembatalan AKN.08a (20261106_ganti_profil.sql). Jalankan di SQL Editor HANYA bila perlu.
-- Hanya membuang dua fungsi. Tabel profil dan isinya TIDAK disentuh.
-- Bila `kedai` sudah dideploy dengan aksi ganti_nama dan ganti_wa, aksi itu akan gagal (galat 500)
-- sampai migration dijalankan lagi atau `kedai` dideploy ulang tanpa aksi tersebut.

BEGIN;

DROP FUNCTION IF EXISTS public.ganti_nama(uuid, text);
DROP FUNCTION IF EXISTS public.ganti_wa(uuid, text);

COMMIT;
