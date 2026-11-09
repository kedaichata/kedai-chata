-- supabase/migrations/20261109_05_pelanggan_luar_fungsi_batal.sql
-- Pembatal ORD.11 (giliran 1): menghapus tiga fungsi yang dibuat 20261109_05_pelanggan_luar_fungsi.sql.
-- Tabel `pelanggan_luar` dan datanya TIDAK disentuh (tidak ada tabel atau data yang dihapus).
-- Dijalankan MANUAL di SQL Editor (akun ketua), hanya bila migration ORD.11 perlu dibatalkan.
--
-- URUTAN PENTING: bila aksi `kedai` untuk pelanggan tanpa akun (giliran 2) sudah dideploy, kembalikan dulu
-- `kedai` ke versi sebelum ORD.11 (deploy ulang `index.ts` lama tanpa `pelanggan_luar.ts`), baru jalankan
-- berkas ini. Bila tidak, ketiga aksi itu akan galat 500 karena fungsinya hilang.

BEGIN;

DROP FUNCTION IF EXISTS public.pelanggan_luar_daftar(uuid, boolean);
DROP FUNCTION IF EXISTS public.pelanggan_luar_simpan(uuid, uuid, text, text, text, text, boolean);
DROP FUNCTION IF EXISTS public.pelanggan_luar_nonaktif(uuid, uuid);

COMMIT;
