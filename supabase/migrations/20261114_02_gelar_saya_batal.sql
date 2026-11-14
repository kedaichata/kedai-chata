-- supabase/migrations/20261114_02_gelar_saya_batal.sql
-- Pembatal GLR.02. Dijalankan MANUAL di SQL Editor (akun ketua), hanya bila perlu.
-- Hanya membuang fungsi gelar_saya. Tabel gelar, pengaturan, dan data lain tidak ikut berubah.
--
-- URUTAN: bila aksi `gelar_saya` di `kedai` (GLR.03) sudah dideploy, deploy `kedai` versi
-- sebelumnya dulu, supaya aksi tidak memanggil fungsi yang sudah hilang.
-- Belum pernah dicoba.

BEGIN;

DROP FUNCTION public.gelar_saya(uuid);

COMMIT;
