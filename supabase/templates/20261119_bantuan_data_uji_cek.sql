-- supabase/templates/20261119_bantuan_data_uji_cek.sql
-- LNC.01: cek isi uji Bantuan (BTN.04, SEC-30) sebelum baris induk LNC.01 dicentang.
-- BACA-SAJA (hanya SELECT). Tidak mengubah apa pun. Jalankan di SQL Editor akun ketua.
-- Kolom `isi` SENGAJA tidak ditampilkan (bisa berisi tag HTML uji dan menyulitkan dibaca di chat).
-- Tanpa data nyata.
--
-- Cara baca hasil (satu tabel, kolom `blok` menunjukkan asal baris):
--   A-ringkasan            : jumlah baris total, aktif, dan nonaktif.
--   B-uji                  : baris uji (bagian "Uji impor" atau kunci berawalan uji-).
--                            Harapan: 4 baris (uji-kutip, uji-baris, uji-nonaktif, uji-html), semuanya aktif = false.
--   C-aktif-mencurigakan   : baris AKTIF yang namanya, judulnya, atau isinya mirip uji / berisi tanda < atau >.
--                            Harapan: kosong. Bila ada isinya, bisa saja bukan uji (misalnya teks "Menu > Akun"):
--                            periksa satu per satu bersama di chat.
--   D-pengganti            : status penjaga-07 (harapan aktif = false, digantikan notif-06) dan notif-06 (aktif = true).

SELECT 'A-ringkasan'::text AS blok,
       ('total ' || count(*) || ', aktif ' || count(*) FILTER (WHERE aktif)
        || ', nonaktif ' || count(*) FILTER (WHERE NOT aktif))::text AS kunci,
       NULL::text AS bagian,
       NULL::text AS peran,
       NULL::boolean AS aktif,
       NULL::timestamptz AS diubah_pada
FROM public.bantuan

UNION ALL

SELECT 'B-uji', kunci, bagian, peran, aktif, diubah_pada
FROM public.bantuan
WHERE bagian ILIKE '%uji%' OR kunci ILIKE 'uji-%'

UNION ALL

SELECT 'C-aktif-mencurigakan', kunci, bagian, peran, aktif, diubah_pada
FROM public.bantuan
WHERE aktif
  AND (bagian ILIKE '%uji%'
       OR kunci ILIKE '%uji%'
       OR kunci ILIKE '%test%'
       OR judul ILIKE '%uji%'
       OR isi ~ '[<>]')

UNION ALL

SELECT 'D-pengganti', kunci, bagian, peran, aktif, diubah_pada
FROM public.bantuan
WHERE kunci IN ('penjaga-07', 'notif-06')

ORDER BY 1, 2;
