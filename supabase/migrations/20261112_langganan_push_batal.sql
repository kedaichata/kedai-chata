-- supabase/migrations/20261112_langganan_push_batal.sql
-- Pembatalan NTF.02: membuang tabel langganan_push dan baris pengaturan push_maks_perangkat.
-- Dijalankan MANUAL di SQL Editor (akun ketua), hanya bila migration 20261112_langganan_push.sql
-- perlu dibatalkan. Butuh penjelasan dampak dan "OK" ketua.
--
-- DAMPAK:
--   - Semua baris langganan push ikut hilang. Pengguna yang sudah mengaktifkan notifikasi harus
--     mengaktifkannya lagi.
--   - Jalankan HANYA bila aksi `push_daftar` dan `push_nonaktifkan` di `kedai` (NTF.03) belum dideploy,
--     atau sudah ditarik. Bila sudah live, aksi itu akan galat tanpa tabelnya.
--   - Tidak menyentuh tabel atau data lain.
--   - Belum pernah dicoba.

BEGIN;

DROP TABLE IF EXISTS public.langganan_push;

DELETE FROM public.pengaturan
 WHERE kunci = 'push_maks_perangkat';

COMMIT;
