-- supabase/migrations/20261107_menu_batal.sql
-- Pembatalan MNU.01 (20261107_menu.sql). Jalankan di SQL Editor HANYA bila perlu.
-- ⚠️ Menghapus tabel menu beserta ISINYA (semua menu uji) dan baris pengaturan
--    harga_maks_menu. Butuh "OK" ketua.
-- ⚠️ Jalankan hanya bila tabel lain yang bergantung (order_item, dst.) belum dibuat
--    atau sudah dibatalkan lebih dulu. Sengaja TANPA CASCADE supaya gagal aman
--    bila masih ada yang bergantung. Setelah ORD.01 jalan, pembatalan ini TIDAK aman.
-- ⚠️ Bila fungsi SQL menu (MNU.02) sudah dibuat, batalkan dulu fungsi itu,
--    karena fungsi bergantung pada tabel ini.

BEGIN;

DROP TABLE IF EXISTS public.menu;

DELETE FROM public.pengaturan WHERE kunci = 'harga_maks_menu';

COMMIT;
