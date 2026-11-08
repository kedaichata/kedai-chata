-- supabase/migrations/20261108_order_batal.sql
-- Pembatalan ORD.01 (20261108_order.sql): membuang keenam tabel order dan keempat baris pengaturannya.
-- Dijalankan MANUAL di SQL Editor (akun ketua), HANYA bila perlu mundur.
--
-- PERINGATAN (baca dulu): berkas ini MENGHAPUS tabel beserta isinya. Aman dijalankan hanya selama
-- tabel masih kosong atau hanya berisi order uji. Bila sudah ada order sungguhan, JANGAN dijalankan;
-- bahas dulu dengan ketua (butuh "OK" dan sebaiknya ekspor data lebih dulu).
-- Tidak menyentuh tabel akun, menu, grup pilihan, dan pengaturan lain.
--
-- Berhenti sendiri (tanpa CASCADE) bila ada fungsi atau objek lain yang masih bergantung pada tabel ini,
-- misalnya fungsi order dari ORD.02 yang sudah dibuat dan terikat. Dalam kasus itu batalkan migration
-- yang lebih baru dulu, lalu jalankan berkas ini.

BEGIN;

-- Urutan: turunan dulu, lalu tabel induk
DROP TABLE public.baca_catatan;
DROP TABLE public.catatan_order;
DROP TABLE public.riwayat_status;
DROP TABLE public.order_item;
DROP TABLE public."order";
DROP TABLE public.pelanggan_luar;

-- Pengaturan yang dibuat ORD.01
DELETE FROM public.pengaturan
WHERE kunci IN ('item_maks_per_order', 'jumlah_maks_per_item',
                'catatan_maks_karakter', 'catatan_maks_per_order');

COMMIT;
