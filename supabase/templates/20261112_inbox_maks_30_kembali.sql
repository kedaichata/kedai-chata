-- supabase/templates/20261112_inbox_maks_30_kembali.sql
-- PEMBATAL untuk 20261112_inbox_maks_10.sql: kembalikan inbox_maks_tampil dari 10 ke 30 (nilai resmi).
-- Jalankan SEGERA setelah tes batas tampil selesai.
-- Hanya mengubah SATU baris di tabel pengaturan. Tidak menyentuh fungsi atau data kabar.
-- Hanya jalan bila nilai sekarang 10 (kalau bukan 10, hasilnya kosong dan tidak ada yang berubah).
-- Jalankan di SQL Editor (akun ketua). Hasil yang benar: satu baris, kunci inbox_maks_tampil, nilai 30.

UPDATE public.pengaturan
SET nilai = '30'
WHERE kunci = 'inbox_maks_tampil'
  AND nilai::text = '10'
RETURNING kunci, nilai;
