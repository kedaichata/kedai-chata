-- supabase/migrations/20261113_02_ringkasan_7hari_batal.sql
-- Pembatalan untuk 20261113_02_ringkasan_7hari.sql (RKS.01).
-- Menghapus HANYA fungsi `public.ringkasan_7hari(uuid)`. Tidak menyentuh tabel, data, atau fungsi lain.
-- Tanpa CASCADE: bila ada objek lain yang bergantung pada fungsi ini, perintah gagal dan tidak ada yang berubah.
-- Dijalankan MANUAL di SQL Editor (akun ketua), hanya bila migration perlu dibatalkan.
-- Setelah RKS.02 jalan, batalkan juga aksi `ringkasan_7hari` di `kedai` lebih dulu (kalau tidak, aksinya akan galat).

BEGIN;

DROP FUNCTION public.ringkasan_7hari(uuid);

COMMIT;
