-- supabase/templates/20261114_03_gelar_impor_cek.sql
-- GLR.04: cek SEBELUM impor set demo gelar. Hanya SELECT, tidak mengubah apa pun.
-- Dijalankan di SQL Editor (akun ketua).
-- Hasil yang benar:
--   baris 'gelar_terisi'      : hasil 0 (tabel gelar masih kosong)
--   baris 'menu_aktif_cocok'  : tepat dua baris, 'ayam karage' dan 'Ayam Katsu', masing-masing aktif = true
-- Bila ada menu yang tidak muncul, atau muncul dua kali, JANGAN lanjut impor: laporkan dulu.

select 'gelar_terisi' as cek, count(*)::text as hasil
from public.gelar
union all
select 'menu_aktif_cocok', nama || ' (aktif = ' || aktif::text || ')'
from public.menu
where lower(nama) in ('ayam karage', 'ayam katsu')
order by 1, 2;
