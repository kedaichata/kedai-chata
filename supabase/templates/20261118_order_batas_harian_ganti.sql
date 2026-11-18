-- supabase/templates/20261118_order_batas_harian_ganti.sql
-- BTO.02a: template mengganti batas order per customer per hari (pengaturan `order_maks_per_hari`).
-- Dijalankan MANUAL di SQL Editor (akun ketua, profil browser terpisah), lalu LOGOUT dashboard.
-- Tanpa data nyata. Isian diisi di dashboard saja.
--
-- Dampak: berlaku langsung untuk order BARU. Order yang sudah ada tidak berubah. Customer yang hari itu
-- sudah kena batas bisa memesan lagi bila angkanya dinaikkan. Tidak perlu ubah kode atau deploy `kedai`.
--
-- Cara pakai:
--   1. Jalankan LANGKAH 1 (cek nilai sekarang).
--   2. Di LANGKAH 2, ganti tulisan ISI_ANGKA_DI_SINI (di DUA tempat) dengan angka baru, tanpa tanda kutip
--      tambahan, misalnya 8. Jangan ganti bagian lain. Lalu jalankan.
--      Angka harus bilangan bulat 1 atau lebih, tanpa nol di depan, maksimal 6 digit.
--   3. Jalankan LANGKAH 3 (cek nilai sesudah).
--
-- Pagar: bila angkanya tidak valid, atau tulisan ISI_ANGKA_DI_SINI lupa diganti, perintah tidak mengubah
-- apa pun dan hasilnya 0 baris (nilai lama tetap aman).
-- Hanya kolom `nilai` pada satu baris (`order_maks_per_hari`) yang disentuh.

-- LANGKAH 1: nilai sekarang
SELECT kunci, nilai FROM public.pengaturan WHERE kunci = 'order_maks_per_hari';

-- LANGKAH 2: ganti nilai (ganti ISI_ANGKA_DI_SINI di dua tempat)
UPDATE public.pengaturan
   SET nilai = 'ISI_ANGKA_DI_SINI'
 WHERE kunci = 'order_maks_per_hari'
   AND 'ISI_ANGKA_DI_SINI' ~ '^[1-9][0-9]{0,5}$'
RETURNING kunci, nilai;

-- LANGKAH 3: nilai sesudah
SELECT kunci, nilai FROM public.pengaturan WHERE kunci = 'order_maks_per_hari';
