-- supabase/migrations/20261106_alamat_batal.sql
-- Pembatalan AKN.07 (20261106_alamat.sql). Jalankan di SQL Editor HANYA bila perlu.
-- Hanya membuang dua fungsi. Tabel alamat dan isinya TIDAK disentuh.
-- Bila `kedai` sudah dideploy dengan aksi alamat, aksi itu akan gagal (galat 500) sampai
-- migration dijalankan lagi atau `kedai` dideploy ulang tanpa aksi tersebut.

BEGIN;

DROP FUNCTION IF EXISTS public.alamat_simpan(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS public.alamat_nonaktif(uuid, uuid);

COMMIT;
