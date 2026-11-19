-- supabase/templates/20261119_order_data_uji_hapus.sql
-- LNC.01e langkah 2: MENGHAPUS data uji order dan turunannya, serta pelanggan_luar uji.
-- BERISIKO, tidak bisa dikembalikan. Jalankan HANYA setelah "OK" ketua (19 Nov 2026) dan
-- setelah hasil 20261119_order_data_uji_cek.sql (blok A sampai H) diperiksa bersama di chat.
-- Dijalankan di SQL Editor (akun ketua), SATU KALI. Satu blok DO = satu transaksi:
-- bila ada pengaman yang gagal atau jumlah baris yang terhapus tidak cocok, SEMUANYA batal
-- dan tidak ada baris yang berubah.
--
-- Yang DIHAPUS (urutan mengikuti kunci asing, blok B): baca_catatan, catatan_order,
-- riwayat_status, order_item, order, pelanggan_luar.
-- Yang TIDAK disentuh: inbox dan foto_bukti (sudah 0), menu, gelar, pengaturan, staf, profil,
-- alamat, belanja, bantuan, akun Auth.
-- Nomor order TIDAK direset di sini; reset adalah langkah terpisah dengan "OK" tersendiri.
--
-- Jumlah yang diharapkan (hasil blok A, 19 Nov 2026):
--   order 138, order_item 166, riwayat_status 360, catatan_order 61, baca_catatan 42,
--   pelanggan_luar 11, inbox 0, foto_bukti 0.
-- Bila angka berubah (misalnya ada order masuk sesudah blok A), skrip ini berhenti dengan galat.
-- Jangan ubah angka sendiri: laporkan ke chat.

DO $$
DECLARE
  n bigint;
  batas constant timestamptz := timestamptz '2026-11-19 00:00+07';
BEGIN
  -- ===== PENGAMAN (sebelum menghapus apa pun) =====

  -- 1. Jumlah baris harus persis seperti hasil blok A
  SELECT count(*) INTO n FROM public."order";
  IF n <> 138 THEN RAISE EXCEPTION 'Batal: order = %, diharapkan 138', n; END IF;

  SELECT count(*) INTO n FROM public.order_item;
  IF n <> 166 THEN RAISE EXCEPTION 'Batal: order_item = %, diharapkan 166', n; END IF;

  SELECT count(*) INTO n FROM public.riwayat_status;
  IF n <> 360 THEN RAISE EXCEPTION 'Batal: riwayat_status = %, diharapkan 360', n; END IF;

  SELECT count(*) INTO n FROM public.catatan_order;
  IF n <> 61 THEN RAISE EXCEPTION 'Batal: catatan_order = %, diharapkan 61', n; END IF;

  SELECT count(*) INTO n FROM public.baca_catatan;
  IF n <> 42 THEN RAISE EXCEPTION 'Batal: baca_catatan = %, diharapkan 42', n; END IF;

  SELECT count(*) INTO n FROM public.pelanggan_luar;
  IF n <> 11 THEN RAISE EXCEPTION 'Batal: pelanggan_luar = %, diharapkan 11', n; END IF;

  -- 2. inbox dan foto_bukti harus sudah kosong (kalau tidak, kunci asing menolak hapus order)
  SELECT count(*) INTO n FROM public.inbox;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: inbox = %, diharapkan 0', n; END IF;

  SELECT count(*) INTO n FROM public.foto_bukti;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: foto_bukti = %, diharapkan 0', n; END IF;

  -- 3. Tidak ada jejak sejak 19 Nov 2026 (waktu akun asli dibuat)
  SELECT count(*) INTO n FROM public."order"
   WHERE dibuat_pada >= batas OR diubah_pada >= batas;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: ada % order bertanggal sejak 19 Nov', n; END IF;

  SELECT count(*) INTO n FROM public.riwayat_status WHERE waktu >= batas;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: ada % riwayat_status sejak 19 Nov', n; END IF;

  SELECT count(*) INTO n FROM public.catatan_order WHERE waktu >= batas;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: ada % catatan_order sejak 19 Nov', n; END IF;

  SELECT count(*) INTO n FROM public.baca_catatan WHERE waktu >= batas;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: ada % baca_catatan sejak 19 Nov', n; END IF;

  SELECT count(*) INTO n FROM public.pelanggan_luar WHERE dibuat_pada >= batas;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: ada % pelanggan_luar sejak 19 Nov', n; END IF;

  -- 4. Tidak ada staf asli (dibuat sejak 19 Nov) yang terkait order, riwayat, catatan, atau pelanggan_luar
  SELECT count(*) INTO n FROM public."order" o
    JOIN public.staf s ON s.id IN (o.dibuat_oleh, o.pemutus, o.pemesan)
   WHERE s.dibuat_pada >= batas;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: % order terkait staf asli', n; END IF;

  SELECT count(*) INTO n FROM public.riwayat_status r
    JOIN public.staf s ON s.id = r.oleh WHERE s.dibuat_pada >= batas;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: % riwayat_status oleh staf asli', n; END IF;

  SELECT count(*) INTO n FROM public.catatan_order c
    JOIN public.staf s ON s.id = c.penulis WHERE s.dibuat_pada >= batas;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: % catatan_order oleh staf asli', n; END IF;

  SELECT count(*) INTO n FROM public.baca_catatan b
    JOIN public.staf s ON s.id = b.akun WHERE s.dibuat_pada >= batas;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: % baca_catatan oleh staf asli', n; END IF;

  SELECT count(*) INTO n FROM public.pelanggan_luar pl
    JOIN public.staf s ON s.id = pl.dibuat_oleh WHERE s.dibuat_pada >= batas;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: % pelanggan_luar oleh staf asli', n; END IF;

  -- 5. Jumlah akun pemesan berbeda harus 5 (lima akun customer dummy, blok D)
  SELECT count(DISTINCT pemesan) INTO n FROM public."order";
  IF n <> 5 THEN RAISE EXCEPTION 'Batal: akun pemesan berbeda = %, diharapkan 5', n; END IF;

  -- ===== PENGHAPUSAN (tabel anak dulu, induk terakhir) =====

  DELETE FROM public.baca_catatan;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 42 THEN RAISE EXCEPTION 'Batal: baca_catatan terhapus %, diharapkan 42', n; END IF;

  DELETE FROM public.catatan_order;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 61 THEN RAISE EXCEPTION 'Batal: catatan_order terhapus %, diharapkan 61', n; END IF;

  DELETE FROM public.riwayat_status;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 360 THEN RAISE EXCEPTION 'Batal: riwayat_status terhapus %, diharapkan 360', n; END IF;

  DELETE FROM public.order_item;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 166 THEN RAISE EXCEPTION 'Batal: order_item terhapus %, diharapkan 166', n; END IF;

  DELETE FROM public."order";
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 138 THEN RAISE EXCEPTION 'Batal: order terhapus %, diharapkan 138', n; END IF;

  DELETE FROM public.pelanggan_luar;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 11 THEN RAISE EXCEPTION 'Batal: pelanggan_luar terhapus %, diharapkan 11', n; END IF;
END
$$;

-- Cek sesudah hapus (jalankan SETELAH blok DO di atas selesai tanpa galat).
-- Hasil yang benar: semua jumlah 0. Tidak ada reset nomor di sini.
SELECT 'order' AS objek, count(*) AS jumlah FROM public."order"
UNION ALL SELECT 'order_item',     count(*) FROM public.order_item
UNION ALL SELECT 'riwayat_status', count(*) FROM public.riwayat_status
UNION ALL SELECT 'catatan_order',  count(*) FROM public.catatan_order
UNION ALL SELECT 'baca_catatan',   count(*) FROM public.baca_catatan
UNION ALL SELECT 'pelanggan_luar', count(*) FROM public.pelanggan_luar
UNION ALL SELECT 'inbox',          count(*) FROM public.inbox
UNION ALL SELECT 'foto_bukti',     count(*) FROM public.foto_bukti;
