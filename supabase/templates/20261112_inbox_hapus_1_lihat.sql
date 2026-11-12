-- supabase/templates/20261112_inbox_hapus_1_lihat.sql
-- INB.06, TAHAP 1 dari 2: LIHAT dulu inbox lama yang akan terhapus. Hanya SELECT, tidak mengubah apa pun.
-- Dijalankan MANUAL oleh ketua di SQL Editor (akun ketua, profil browser terpisah).
-- Tahap 2 (yang menghapus): supabase/templates/20261112_inbox_hapus_2_hapus.sql
-- Tanpa isian, tanpa data nyata. Boleh dijalankan berulang.
--
-- Aturan:
--   - Hanya menyentuh tabel public.inbox (IB7).
--   - Batas hari dibaca dari pengaturan `inbox_simpan_hari` (IB6), tidak ditulis mati.
--   - Hitungan waktu dari jam server (now()).
--   - Kondisi "baris lama" di sini PERSIS SAMA dengan kondisi di tahap 2.
--   - Bila baris pengaturan tidak ada atau nilainya di luar 1 sampai 365, hasilnya nol baris
--     (tahap 2 juga begitu: tidak menghapus apa pun).
--
-- Cara baca hasil:
--   - Hasil 1 = ringkasan. Cek "akan_terhapus" masuk akal dibanding "tersisa".
--   - Hasil 2 = contoh sampai 10 baris tertua yang akan terhapus (tanpa akun penerima).
--   - Baru bila sudah yakin, jalankan tahap 2.

-- ============================================================
-- Hasil 1: ringkasan
-- ============================================================
WITH batas AS (
  SELECT nilai::int AS hari
  FROM public.pengaturan
  WHERE kunci = 'inbox_simpan_hari'
)
SELECT
  (SELECT hari FROM batas)                                  AS batas_hari,
  now()                                                     AS waktu_server,
  count(*) FILTER (WHERE lama)                              AS akan_terhapus,
  count(*) FILTER (WHERE NOT lama)                          AS tersisa,
  min(id) FILTER (WHERE lama)                               AS id_terkecil_terhapus,
  max(id) FILTER (WHERE lama)                               AS id_terbesar_terhapus,
  min(waktu) FILTER (WHERE lama)                            AS waktu_tertua,
  max(waktu) FILTER (WHERE lama)                            AS waktu_terbaru_terhapus
FROM (
  SELECT
    i.id,
    i.waktu,
    EXISTS (
      SELECT 1 FROM batas b
      WHERE b.hari BETWEEN 1 AND 365
        AND i.waktu < now() - make_interval(days => b.hari)
    ) AS lama
  FROM public.inbox i
) x;

-- ============================================================
-- Hasil 2: contoh sampai 10 baris tertua yang akan terhapus
-- ============================================================
WITH batas AS (
  SELECT nilai::int AS hari
  FROM public.pengaturan
  WHERE kunci = 'inbox_simpan_hari'
)
SELECT i.id, i.nomor_order, i.teks, i.waktu
FROM public.inbox i
JOIN batas b ON b.hari BETWEEN 1 AND 365
WHERE i.waktu < now() - make_interval(days => b.hari)
ORDER BY i.id
LIMIT 10;
