-- supabase/templates/20261114_05_gelar_sec39_cek.sql
-- Bukti SEC-39 (GLR): hitungan order Selesai per akun. BACA-SAJA (hanya SELECT).
-- Jalankan di SQL Editor (akun ketua). Tidak mengubah data.
--
-- Cara baca hasil:
--   * Tiap baris = satu akun customer (kolom pemesan = id akun).
--   * Baris dengan pemesan KOSONG (NULL) = gabungan semua order wakil owner
--     (pelanggan tanpa akun). Baris ini tidak boleh dipakai menghitung gelar siapa pun.
--   * selesai        = jumlah order berstatus Selesai (dasar gelar tingkat).
--   * selesai_karage = order Selesai yang memuat menu gelar Karage (dihitung per order).
--   * selesai_katsu  = order Selesai yang memuat menu gelar Katsu (dihitung per order).
-- Cocokkan angka "selesai" dengan gelar tingkat dari balasan gelar_saya
-- (ambang demo: 1, 2, 3, 4, 5) dan kolom menu dengan ambang gelar menu (2).

SELECT
  o.pemesan,
  max(o.nama_pemesan) AS nama_dummy,
  count(DISTINCT o.id) FILTER (WHERE o.status = 'Selesai') AS selesai,
  count(DISTINCT o.id) FILTER (
    WHERE o.status = 'Selesai'
      AND i.menu_id = (SELECT g.menu_id FROM public.gelar g WHERE g.kunci = 'menu-karage')
  ) AS selesai_karage,
  count(DISTINCT o.id) FILTER (
    WHERE o.status = 'Selesai'
      AND i.menu_id = (SELECT g.menu_id FROM public.gelar g WHERE g.kunci = 'menu-katsu')
  ) AS selesai_katsu
FROM public."order" o
LEFT JOIN public.order_item i ON i.order_id = o.id
GROUP BY o.pemesan
ORDER BY selesai DESC;
