-- supabase/migrations/20261114_gelar_batal.sql
-- Pembatal GLR.01. Dijalankan MANUAL di SQL Editor (akun ketua), hanya bila perlu.
-- Membuang tabel `gelar` (beserta semua isinya) dan satu baris pengaturan `gelar_apresiasi`.
-- Tidak menyentuh tabel order, order_item, menu, atau pengaturan lain.
--
-- URUTAN: bila fungsi `gelar_saya` (GLR.02) sudah dibuat, BUANG FUNGSI ITU DULU
-- (lewat pembatal GLR.02), karena fungsi merujuk tabel ini.
-- DAMPAK: semua aturan gelar yang sudah diimpor ikut hilang; pulihkan dari lembar `gelar-isi`
-- (lembar adalah sumber dan cadangannya, GL14). Belum pernah dicoba.
-- Penghapusan ini dijalankan ketua di SQL Editor (peran pemilik), bukan lewat aplikasi;
-- service_role tetap tidak punya hak DELETE.

BEGIN;

DROP TABLE public.gelar;

DELETE FROM public.pengaturan WHERE kunci = 'gelar_apresiasi';

COMMIT;
