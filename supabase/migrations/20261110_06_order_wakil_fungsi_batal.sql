-- supabase/migrations/20261110_06_order_wakil_fungsi_batal.sql
-- Pembatalan ORD.12 (giliran 1): membuang fungsi `public.order_buat_wakil`.
-- Dijalankan MANUAL di SQL Editor (akun ketua) hanya bila migration 20261110_06_order_wakil_fungsi.sql
-- perlu dibatalkan. Hanya membuang fungsi itu; tabel, fungsi lain, dan pengaturan tidak disentuh.
--
-- PENTING: berkas ini TIDAK menghapus order yang sudah telanjur dibuat lewat fungsi tersebut
-- (order tidak bisa dihapus, O17). Order uji dibersihkan di LNC.01.
-- Bila aksi `order_buat_wakil` di `kedai` sudah ter-deploy, aksi itu akan galat umum 500 setelah fungsi
-- dibuang; batalkan juga aksinya (atau deploy ulang `kedai` tanpa aksi itu).

BEGIN;

DROP FUNCTION IF EXISTS public.order_buat_wakil(uuid, uuid, text, text, text, text, jsonb, text);

COMMIT;
