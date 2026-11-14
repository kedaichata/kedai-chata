-- supabase/templates/20261114_04_gelar_impor_hasil_cek.sql
-- GLR.04: cek SETELAH impor set demo gelar. Hanya SELECT, tidak mengubah apa pun.
-- Dijalankan di SQL Editor (akun ketua).
-- Hasil yang benar: tepat 7 baris, semua aktif = true.
--   5 baris jenis 'tingkat' dengan ambang 1, 2, 3, 4, 5 dan menu_terhubung kosong.
--   'menu-karage'  : jenis 'menu', ambang 2, menu_terhubung 'ayam karage'.
--   'menu-katsu'   : jenis 'menu', ambang 2, menu_terhubung 'Ayam Katsu'.
-- Bila menu_terhubung kosong pada baris jenis 'menu', atau jumlah baris bukan 7: laporkan dulu.

select g.kunci, g.jenis, g.ambang, g.nama, g.aktif, m.nama as menu_terhubung
from public.gelar g
left join public.menu m on m.id = g.menu_id
order by g.jenis desc, g.ambang, g.kunci;
