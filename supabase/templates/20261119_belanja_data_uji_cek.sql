-- supabase/templates/20261119_belanja_data_uji_cek.sql
-- LNC.01c langkah 1: mendata isi tabel belanja dan belanja_item sebelum dihapus.
-- HANYA SELECT. Tidak mengubah apa pun. Jalankan di SQL Editor (akun ketua),
-- satu blok per kali, lalu tempel hasilnya ke chat (samarkan bila ada nama asli).
-- Tanpa data nyata di berkas ini.

-- A. Jumlah baris per tabel
SELECT 'belanja' AS tabel, count(*) AS jumlah FROM public.belanja
UNION ALL
SELECT 'belanja_item', count(*) FROM public.belanja_item;

-- B. Per penginput: berapa catatan, berapa terkunci, berapa item, berapa item dibatalkan,
--    dan apakah akun stafnya aktif
SELECT
  b.nama_penginput,
  s.aktif AS staf_aktif,
  count(DISTINCT b.id) AS catatan,
  count(DISTINCT b.id) FILTER (WHERE b.dikunci_pada IS NOT NULL) AS terkunci,
  count(i.id) AS item,
  count(i.id) FILTER (WHERE i.dibatalkan) AS item_dibatalkan
FROM public.belanja b
JOIN public.staf s ON s.id = b.penginput
LEFT JOIN public.belanja_item i ON i.belanja_id = b.id
GROUP BY b.nama_penginput, s.aktif
ORDER BY b.nama_penginput;

-- C. Daftar catatan (judul dipotong 40 karakter), terlama dulu
SELECT
  b.id,
  left(b.judul, 40) AS judul,
  b.nama_penginput,
  b.dibuat_pada AT TIME ZONE 'Asia/Jakarta' AS dibuat_wib,
  (b.dikunci_pada IS NOT NULL) AS terkunci,
  count(i.id) AS item
FROM public.belanja b
LEFT JOIN public.belanja_item i ON i.belanja_id = b.id
GROUP BY b.id, b.judul, b.nama_penginput, b.dibuat_pada, b.dikunci_pada
ORDER BY b.dibuat_pada;

-- D. Rentang waktu data (untuk memastikan semuanya dibuat saat pengerjaan, 18 sampai 19 Nov 2026)
SELECT
  min(dibuat_pada) AT TIME ZONE 'Asia/Jakarta' AS paling_awal_wib,
  max(dibuat_pada) AT TIME ZONE 'Asia/Jakarta' AS paling_akhir_wib
FROM public.belanja;
