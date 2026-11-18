-- supabase/migrations/20261118_03_belanja_fungsi_batal.sql
-- Pembatalan BLJ.02: membuang sepuluh fungsi Belanja Warung yang dibuat 20261118_03_belanja_fungsi.sql.
-- Dijalankan MANUAL di SQL Editor (akun ketua), dengan penjelasan dampak dan "OK" ketua.
--
-- Yang DIBUANG: hanya fungsi (tujuh fungsi utama, lalu tiga pembantu).
-- Yang TIDAK disentuh: tabel `belanja` dan `belanja_item` beserta isinya, hak tabel, dan pengaturan.
--   Catatan yang sudah tersimpan tetap ada.
--
-- URUTAN PENTING: bila `kedai` dengan `belanja.ts` (BLJ.03) sudah di-deploy, deploy `kedai` versi
-- SEBELUMNYA lebih dulu. Kalau tidak, owner yang membuka Belanja Warung melihat galat umum.
-- Fungsi utama dibuang dulu, baru pembantu, karena yang utama memanggil pembantu.
-- Belum pernah dicoba.

BEGIN;

DROP FUNCTION IF EXISTS public.belanja_daftar(uuid, boolean);
DROP FUNCTION IF EXISTS public.belanja_kunci(uuid, uuid);
DROP FUNCTION IF EXISTS public.belanja_judul_ubah(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.belanja_item_batal(uuid, uuid);
DROP FUNCTION IF EXISTS public.belanja_item_ubah(uuid, uuid, jsonb);
DROP FUNCTION IF EXISTS public.belanja_item_tambah(uuid, uuid, jsonb);
DROP FUNCTION IF EXISTS public.belanja_buat(uuid, text, jsonb);

DROP FUNCTION IF EXISTS public.belanja_item_periksa(jsonb);
DROP FUNCTION IF EXISTS public.belanja_owner(uuid);
DROP FUNCTION IF EXISTS public.belanja_angka(text);

COMMIT;
