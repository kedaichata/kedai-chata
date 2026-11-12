-- supabase/templates/20261112_inbox_maks_10.sql
-- SEMENTARA untuk tes INB.07 (batas jumlah kabar tampil): turunkan inbox_maks_tampil dari 30 ke 10.
-- HARUS dikembalikan ke 30 dengan 20261112_inbox_maks_30_kembali.sql setelah tes.
-- Hanya mengubah SATU baris di tabel pengaturan. Tidak menyentuh fungsi atau data kabar.
-- Hanya jalan bila nilai sekarang 30 (kalau bukan 30, hasilnya kosong dan tidak ada yang berubah).
-- Jalankan di SQL Editor (akun ketua). Hasil yang benar: satu baris, kunci inbox_maks_tampil, nilai 10.

UPDATE public.pengaturan
SET nilai = '10'
WHERE kunci = 'inbox_maks_tampil'
  AND nilai::text = '30'
RETURNING kunci, nilai;
