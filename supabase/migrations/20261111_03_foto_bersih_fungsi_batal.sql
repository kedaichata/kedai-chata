-- supabase/migrations/20261111_03_foto_bersih_fungsi_batal.sql
-- Pembatalan FTO.05 langkah 2: membuang tiga fungsi pembantu `bersihkan`.
-- Dijalankan MANUAL di SQL Editor (akun ketua) hanya bila migration 20261111_03_foto_bersih_fungsi.sql dibatalkan.
-- Tidak menyentuh tabel, data foto, bucket, pengaturan, atau fungsi lain.
-- Catatan: bila `bersihkan` sudah dideploy dan penjadwal sudah dipasang, matikan penjadwal dulu
-- (langkah pembatalannya ditulis bersama berkas penjadwal) sebelum membuang fungsi ini.
-- Baris `foto_bukti` yang sudah ditandai `dibersihkan_pada` oleh fungsi ini TIDAK dikembalikan (tidak ikut berubah).

BEGIN;

DROP FUNCTION IF EXISTS public.foto_bersih_pilih();
DROP FUNCTION IF EXISTS public.foto_bersih_tandai(uuid[]);
DROP FUNCTION IF EXISTS public.foto_bersih_tanpa_baris(text[]);

COMMIT;
