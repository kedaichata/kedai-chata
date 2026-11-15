-- supabase/migrations/20261115_02_wa_nomor_ambil_batal.sql
-- Pembatalan WAG.02: membuang fungsi wa_nomor_ambil.
-- Dijalankan MANUAL di SQL Editor (akun ketua), hanya bila migration 20261115_02_wa_nomor_ambil.sql
-- perlu dibatalkan. Butuh penjelasan dampak dan "OK" ketua.
--
-- DAMPAK:
--   - Hanya membuang satu fungsi baca-saja. Tabel, kolom, hak tabel, dan data tidak tersentuh.
--   - URUTAN: bila kode kirim_wa di `kedai` (WAG.05) sudah live, kosongkan secret WA_GATEWAY_URL dan
--     WA_GATEWAY_API_KEY dulu (WAG20) supaya tidak ada pemanggilan ke fungsi yang hilang.
--     Kegagalan itu memang tidak membatalkan aksi order (WAG02), tetapi akan memenuhi log dengan galat.
--   - Berkas ini dijalankan SEBELUM pembatal kolom staf.nomor_wa (20261115_staf_nomor_wa_batal.sql),
--     karena fungsi membaca kolom itu.
--   - Tanpa CASCADE. Bila ada objek lain yang bergantung pada fungsi ini, BERHENTI dan laporkan.
--   - Belum pernah dicoba.

BEGIN;

DROP FUNCTION IF EXISTS public.wa_nomor_ambil(uuid[]);

COMMIT;
