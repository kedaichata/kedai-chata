-- supabase/migrations/20261112_02_langganan_push_fungsi_batal.sql
-- Pembatal NTF.03 tahap 1: membuang dua fungsi push_daftar dan push_nonaktifkan.
-- Tabel `langganan_push`, isinya, dan pengaturan `push_maks_perangkat` TIDAK ikut berubah.
-- Jalankan hanya bila aksi `kedai` push_daftar dan push_nonaktifkan belum dideploy
-- (atau sudah dideploy ulang tanpa dua aksi itu). Belum pernah dicoba.
-- Dijalankan MANUAL di SQL Editor (akun ketua), setelah penjelasan dampak dan "OK" ketua.

BEGIN;

DROP FUNCTION IF EXISTS public.push_daftar(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.push_nonaktifkan(uuid, text);

COMMIT;
