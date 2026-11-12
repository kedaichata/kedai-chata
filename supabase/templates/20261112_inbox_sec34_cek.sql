-- supabase/templates/20261112_inbox_sec34_cek.sql
-- Cek BACA-SAJA untuk bukti SEC-34 (INB.07): inbox tiap akun hanya miliknya.
-- Hanya SELECT. Tidak mengubah data. Tanpa ID akun nyata (penerima diganti nomor urut).
-- Jalankan di SQL Editor (akun ketua), tempel hasilnya ke chat, lalu logout.
--
-- Cara membaca hasil:
--   * Satu baris = satu penerima (nomor urut, bukan ID akun).
--   * jumlah_14_hari  = jumlah baris yang boleh tampil (sesuai pengaturan inbox_simpan_hari).
--   * id_14_hari      = daftar id baris itu, terurut naik.
--   * Customer dummy yang dites seharusnya punya 18 baris dengan id:
--     3, 5, 10, 12, 15, 16, 18, 21, 25, 30, 32, 33, 34, 35, 36, 37, 38, 39
--   * Id lain (misalnya 1, 2, 4, 6, ...) harus milik penerima lain (owner atau penjaga).

WITH batas AS (
  SELECT p.nilai::text::int AS hari
  FROM public.pengaturan p
  WHERE p.kunci = 'inbox_simpan_hari'
),
per_penerima AS (
  SELECT
    i.penerima,
    count(*)                         AS jumlah_semua,
    count(*) FILTER (
      WHERE i.waktu >= now() - make_interval(days => (SELECT hari FROM batas))
    )                                AS jumlah_14_hari,
    min(i.id)                        AS id_terkecil,
    max(i.id)                        AS id_terbesar,
    array_agg(i.id ORDER BY i.id) FILTER (
      WHERE i.waktu >= now() - make_interval(days => (SELECT hari FROM batas))
    )                                AS id_14_hari
  FROM public.inbox i
  GROUP BY i.penerima
)
SELECT
  row_number() OVER (ORDER BY id_terkecil) AS penerima_ke,
  jumlah_semua,
  jumlah_14_hari,
  id_terkecil,
  id_terbesar,
  id_14_hari
FROM per_penerima
ORDER BY penerima_ke;
