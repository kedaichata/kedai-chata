-- supabase/templates/20261112_inbox_hapus_2_hapus.sql
-- INB.06, TAHAP 2 dari 2: HAPUS inbox lama. ⚠️ TIDAK BISA DIBATALKAN.
-- Jalankan HANYA setelah tahap 1 (20261112_inbox_hapus_1_lihat.sql) dijalankan dan hasilnya dibaca.
-- Dijalankan MANUAL oleh ketua di SQL Editor (akun ketua, profil browser terpisah).
-- Tanpa isian, tanpa data nyata.
--
-- Aturan:
--   - Hanya menyentuh tabel public.inbox. Order, catatan, dan tabel lain tidak tersentuh.
--   - Ini DELETE manual oleh ketua di SQL Editor; service_role tetap tanpa hak DELETE (IB7).
--     Tidak ada pengecualian DELETE baru untuk aplikasi.
--   - Batas hari dari pengaturan `inbox_simpan_hari` (IB6); waktu dari jam server.
--   - Kondisi PERSIS SAMA dengan tahap 1. Bila pengaturan tidak ada atau di luar 1 sampai 365,
--     tidak ada baris yang terhapus. Bila nilai pengaturan bukan angka, perintah gagal dan
--     tidak ada yang terhapus.
--   - Satu perintah = atomik: terhapus semua atau tidak sama sekali.
--   - Penanda "dibaca" di HP aman: nomor `id` tidak dipakai ulang, jadi item baru selalu
--     bernomor lebih besar dari penanda lama.
--
-- Hasil: jumlah baris yang terhapus. Cocokkan dengan "akan_terhapus" di tahap 1.

WITH batas AS (
  SELECT nilai::int AS hari
  FROM public.pengaturan
  WHERE kunci = 'inbox_simpan_hari'
),
dihapus AS (
  DELETE FROM public.inbox i
  USING batas b
  WHERE b.hari BETWEEN 1 AND 365
    AND i.waktu < now() - make_interval(days => b.hari)
  RETURNING i.id, i.waktu
)
SELECT
  count(*)      AS jumlah_terhapus,
  min(id)       AS id_terkecil,
  max(id)       AS id_terbesar,
  min(waktu)    AS waktu_tertua,
  max(waktu)    AS waktu_terbaru
FROM dihapus;
