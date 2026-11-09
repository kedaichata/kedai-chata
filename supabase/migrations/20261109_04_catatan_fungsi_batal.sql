-- supabase/migrations/20261109_04_catatan_fungsi_batal.sql
-- Pembatal untuk 20261109_04_catatan_fungsi.sql (ORD.09): membuang dua fungsi baru.
-- Dijalankan MANUAL di SQL Editor (akun ketua) HANYA bila migration ORD.09 perlu dibatalkan.
-- Yang berubah: HANYA dua fungsi `catatan_tambah` dan `catatan_dibaca` hilang. Tidak menyentuh tabel, hak tabel,
--   pengaturan, atau fungsi lain.
-- PERHATIAN: catatan yang SUDAH ditulis lewat `catatan_tambah` (dan penunjuk di `baca_catatan`) TIDAK ikut hilang;
--   tabelnya tidak disentuh dan tidak ada hak DELETE (O17, SEC-15). Pembersihan data uji ada di LNC.01.
-- Urutan bila `kedai` sudah men-deploy aksi catatan: deploy dulu `kedai` versi tanpa aksi itu, baru jalankan berkas ini;
--   kalau tidak, aksi `catatan_tambah` dan `catatan_dibaca` membalas galat umum 500 sampai `kedai` diganti.

BEGIN;

DROP FUNCTION public.catatan_tambah(uuid, uuid, text);
DROP FUNCTION public.catatan_dibaca(uuid, uuid);

COMMIT;
