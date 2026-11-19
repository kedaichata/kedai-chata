-- supabase/templates/20261119_order_reset_nomor.sql
-- LNC.01e langkah 3: mengembalikan penghitung nomor order (order_nomor_seq) ke awal,
-- supaya order sungguhan pertama bernomor #1. BERISIKO RENDAH tetapi dilakukan SATU KALI saja.
-- "OK reset" ketua: 19 Nov 2026 (blok 8 Nov 2026: reset oleh ketua di SQL Editor setelah tabel order bersih).
-- Dijalankan di SQL Editor (akun ketua), SATU KALI, SESUDAH 20261119_order_data_uji_hapus.sql
-- berhasil dan sebelum ada orang memesan lewat aplikasi.
--
-- Pengaman: blok DO berhenti dengan galat bila tabel "order" atau inbox tidak kosong.
-- Yang diubah hanya order_nomor_seq. Tidak menyentuh data, nomor urut catatan_order,
-- riwayat_status, atau inbox.
-- Nomor dilihat tanpa memakai nextval (supaya nomor #1 tidak terpakai oleh pengecekan).

DO $$
DECLARE
  n bigint;
BEGIN
  SELECT count(*) INTO n FROM public."order";
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: tabel order berisi % baris, diharapkan 0', n; END IF;

  SELECT count(*) INTO n FROM public.inbox;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: inbox berisi % baris, diharapkan 0', n; END IF;

  ALTER SEQUENCE public.order_nomor_seq RESTART WITH 1;
END
$$;

-- Cek sesudah reset (jalankan SETELAH blok DO di atas selesai tanpa galat).
-- Hasil yang benar: last_value = 1 dan is_called = false
-- (artinya nomor berikutnya yang keluar adalah 1).
SELECT last_value, is_called FROM public.order_nomor_seq;
