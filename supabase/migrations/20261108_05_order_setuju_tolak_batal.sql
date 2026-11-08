-- supabase/migrations/20261108_05_order_setuju_tolak_batal.sql
-- Pembatalan ORD.05 giliran 1: menghapus fungsi `order_setuju` dan `order_tolak`.
-- Dijalankan MANUAL di SQL Editor (akun ketua), hanya bila migration 20261108_05_order_setuju_tolak.sql
-- harus ditarik. Tidak menyentuh tabel, data order, atau fungsi lain.
-- Catatan: bila order sudah pernah disetujui atau ditolak lewat fungsi ini, order itu TETAP
-- (status, metode bayar, dan riwayatnya tidak berubah); hanya fungsinya yang hilang.
-- Bila `kedai` sudah di-deploy dengan aksi setuju/tolak, aksi itu akan membalas galat umum sampai
-- fungsinya dipasang lagi.

BEGIN;

DROP FUNCTION IF EXISTS public.order_setuju(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.order_tolak(uuid, uuid, text);

COMMIT;
