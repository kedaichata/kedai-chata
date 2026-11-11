-- supabase/migrations/20261111_06_inbox_fungsi_batal.sql
-- Pembatalan INB.02 (20261111_06_inbox_fungsi.sql). Dijalankan MANUAL di SQL Editor (akun ketua).
-- Aman hanya bila `kedai` BELUM memanggil fungsi ini. Bila INB.03 atau INB.04 sudah dideploy,
-- cabut dulu pemanggilannya di `kedai` dan deploy ulang, baru jalankan berkas ini
-- (butuh penjelasan dampak dan "OK").
--
-- Yang dibuang: tiga fungsi `inbox_tulis`, `inbox_daftar`, `inbox_terbaru`.
-- Yang TIDAK disentuh: tabel `inbox` beserta isinya, pengaturan, dan semua fungsi lain.
-- Pembatalan ini belum pernah dicoba.

BEGIN;

DROP FUNCTION public.inbox_tulis(uuid, text, uuid);
DROP FUNCTION public.inbox_daftar(uuid, bigint);
DROP FUNCTION public.inbox_terbaru(uuid);

COMMIT;
