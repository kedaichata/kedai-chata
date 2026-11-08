-- supabase/migrations/20261108_02_order_fungsi_batal.sql
-- Pembatalan ORD.02 (giliran 1): membuang tiga fungsi order yang dibuat oleh 20261108_02_order_fungsi.sql.
-- Dijalankan MANUAL di SQL Editor (akun ketua), hanya bila migration tersebut perlu dibatalkan.
-- Dampak: hanya fungsi yang hilang. Tabel order dan isinya (order, item, catatan, riwayat) TIDAK disentuh
-- dan TIDAK dihapus. Bila sudah ada order uji yang dibuat lewat fungsi ini, order itu tetap ada.
-- Tidak menyentuh `opsi_periksa`, `menu_daftar`, atau fungsi lain.

BEGIN;

DROP FUNCTION IF EXISTS public.order_buat(uuid, text, uuid, text, text, jsonb, text);
DROP FUNCTION IF EXISTS public.order_daftar(uuid, text, text);
DROP FUNCTION IF EXISTS public.order_detail(uuid, uuid);

COMMIT;
