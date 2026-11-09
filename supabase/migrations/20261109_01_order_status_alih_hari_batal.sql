-- supabase/migrations/20261109_01_order_status_alih_hari_batal.sql
-- Pembatalan ORD.07 (giliran 1): menghapus tiga fungsi yang dibuat oleh
-- supabase/migrations/20261109_01_order_status_alih_hari.sql.
-- Dijalankan MANUAL di SQL Editor (akun ketua), hanya bila migration itu perlu dibatalkan.
-- Tanpa data nyata.
--
-- Yang DIHAPUS: `public.order_status(uuid, uuid, text, text)`, `public.order_metode_koreksi(uuid, uuid, text)`,
--   `public.order_alih_hari(uuid, uuid, text, text)`.
-- Yang SENGAJA TIDAK DISENTUH: semua tabel, pagar, dan fungsi lain (order_buat, order_daftar, order_detail,
--   order_batal, order_setuju, order_tolak), pengaturan, dan `kedai/index.ts`.
-- Yang TIDAK ikut kembali: baris `riwayat_status` yang sudah tercatat oleh tiga fungsi ini (riwayat hanya
--   bertambah, security.md aturan 15), dan perubahan pada order (status, metode bayar, hari, jam) yang
--   sudah terjadi lewat fungsi ini. Bila sudah ada order yang diubah, koreksi lewat keputusan terpisah.
-- PERHATIAN: bila `kedai/index.ts` sudah men-deploy aksi `order_status`, `order_metode_koreksi`, atau
--   `order_alih_hari`, aksi itu akan gagal (galat umum) setelah fungsi dihapus. Batalkan juga deploy-nya
--   (kembali ke versi `kedai` sebelumnya) sebelum menjalankan berkas ini.
-- Cek sesudahnya: supabase/templates/20261109_01_order_status_alih_hari_cek.sql (hasil: ketiga fungsi tidak ada).

BEGIN;

DROP FUNCTION public.order_status(uuid, uuid, text, text);
DROP FUNCTION public.order_metode_koreksi(uuid, uuid, text);
DROP FUNCTION public.order_alih_hari(uuid, uuid, text, text);

COMMIT;
