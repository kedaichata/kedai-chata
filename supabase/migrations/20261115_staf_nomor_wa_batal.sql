-- supabase/migrations/20261115_staf_nomor_wa_batal.sql
-- Pembatalan WAG.01: membuang kolom nomor_wa dari tabel staf.
-- Dijalankan MANUAL di SQL Editor (akun ketua), hanya bila migration 20261115_staf_nomor_wa.sql
-- perlu dibatalkan. Butuh penjelasan dampak dan "OK" ketua.
--
-- DAMPAK:
--   - Semua nomor WA staf yang sudah diisi ikut hilang dan tidak bisa dipulihkan dari database.
--     Isi ulang lewat SQL Editor bila kolom dibuat lagi.
--   - Constraint staf_wa_cek ikut terbuang bersama kolomnya.
--   - URUTAN: bila fungsi wa_nomor_ambil (WAG.02) sudah dibuat, BUANG FUNGSI ITU DULU
--     (pembatalnya ada di berkas WAG.02), baru jalankan berkas ini. Bila kode kirim_wa di `kedai`
--     (WAG.05) sudah live, kosongkan secret WA_GATEWAY_URL dan WA_GATEWAY_API_KEY dulu
--     (WAG20) supaya tidak ada pemanggilan ke fungsi yang hilang.
--   - Tidak menyentuh kolom, baris, atau tabel lain.
--   - Belum pernah dicoba.

BEGIN;

ALTER TABLE public.staf
  DROP COLUMN IF EXISTS nomor_wa;

COMMIT;
