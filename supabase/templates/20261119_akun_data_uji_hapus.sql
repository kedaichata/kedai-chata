-- supabase/templates/20261119_akun_data_uji_hapus.sql
-- LNC.01f langkah 2: membersihkan data akun uji. BERISIKO, tidak bisa dikembalikan (LANGKAH 1).
-- Jalankan HANYA setelah "OK" ketua (19 Nov 2026) dan setelah hasil 20261119_akun_data_uji_cek.sql
-- (blok A sampai F) diperiksa bersama di chat. Dijalankan di SQL Editor (akun ketua).
-- LANGKAH 1 dan LANGKAH 2 dijalankan TERPISAH (satu blok DO per kali). Tiap blok DO = satu transaksi:
-- bila ada pengaman yang gagal atau jumlah baris tidak cocok, SEMUANYA batal dan tidak ada yang berubah.
-- Tanpa data nyata di berkas ini (hanya 8 karakter awal ID).
--
-- Jumlah yang diharapkan (hasil cek 19 Nov 2026):
--   auth.users 20; staf 9 (3 uji dibuat sebelum 19 Nov, 6 asli sejak 19 Nov, semua aktif);
--   profil 9; alamat 16; langganan_push 10 (semua aktif = false: 7 milik profil, 3 milik staf uji);
--   inbox, riwayat_status, catatan_order, baca_catatan, order, pelanggan_luar, foto_bukti, belanja = 0.
-- Bila angka berubah, skrip berhenti dengan galat. Jangan ubah angka sendiri: laporkan ke chat.
--
-- Yang DIHAPUS di LANGKAH 1 (urutan kunci asing): langganan_push, alamat, profil.
-- Yang DINONAKTIFKAN di LANGKAH 2 (BUKAN dihapus): tiga staf uji. Alasan: menu.diubah_oleh merujuk ke
--   staf (menu_diubah_oleh_fkey), dan 38 menu asli dikerjakan lewat dua akun uji itu (jejak dijaga).
-- Yang TIDAK disentuh: akun staf asli, menu, grup_pilihan, menu_grup, gelar, pengaturan, bantuan.
-- LANGKAH 3 (dashboard, manual): hapus 11 akun Auth non-staf. Daftar ID awal ada di bawah.
--
-- Prasyarat LANGKAH 2: keenam akun staf asli sudah bisa login (recovery sudah dikirim dan dipakai),
-- terutama akun yang akan dipakai ibu ketua untuk mengelola menu. Bila belum, tunda LANGKAH 2.

-- ============================================================
-- LANGKAH 1: hapus langganan_push, alamat, dan profil (semua dummy)
-- ============================================================
DO $$
DECLARE
  n bigint;
  batas constant timestamptz := timestamptz '2026-11-19 00:00+07';
BEGIN
  -- Pengaman: jumlah baris persis seperti hasil cek
  SELECT count(*) INTO n FROM public.profil;
  IF n <> 9 THEN RAISE EXCEPTION 'Batal: profil = %, diharapkan 9', n; END IF;

  SELECT count(*) INTO n FROM public.alamat;
  IF n <> 16 THEN RAISE EXCEPTION 'Batal: alamat = %, diharapkan 16', n; END IF;

  SELECT count(*) INTO n FROM public.langganan_push;
  IF n <> 10 THEN RAISE EXCEPTION 'Batal: langganan_push = %, diharapkan 10', n; END IF;

  -- Pengaman: tidak ada customer asli (semua profil dibuat sebelum 19 Nov, tidak ada yang juga staf)
  SELECT count(*) INTO n FROM public.profil WHERE dibuat_pada >= batas;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: ada % profil sejak 19 Nov', n; END IF;

  SELECT count(*) INTO n FROM public.alamat WHERE dibuat_pada >= batas;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: ada % alamat sejak 19 Nov', n; END IF;

  SELECT count(*) INTO n FROM public.profil p JOIN public.staf s ON s.id = p.id;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: % profil juga staf', n; END IF;

  -- Pengaman: langganan push tidak ada yang aktif dan tidak ada milik staf asli
  SELECT count(*) INTO n FROM public.langganan_push WHERE aktif;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: ada % langganan_push aktif', n; END IF;

  SELECT count(*) INTO n FROM public.langganan_push l
    JOIN public.staf s ON s.id = l.akun WHERE s.dibuat_pada >= batas;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: % langganan_push milik staf asli', n; END IF;

  -- Pengaman: tabel lain yang merujuk ke akun harus kosong
  SELECT (SELECT count(*) FROM public.inbox)
       + (SELECT count(*) FROM public.riwayat_status)
       + (SELECT count(*) FROM public.catatan_order)
       + (SELECT count(*) FROM public.baca_catatan)
       + (SELECT count(*) FROM public."order")
       + (SELECT count(*) FROM public.pelanggan_luar)
       + (SELECT count(*) FROM public.foto_bukti)
       + (SELECT count(*) FROM public.belanja)
    INTO n;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: tabel lain yang merujuk akun berisi % baris', n; END IF;

  -- Penghapusan (anak dulu, induk terakhir)
  DELETE FROM public.langganan_push
   WHERE akun IN (SELECT id FROM public.profil)
      OR akun IN (SELECT id FROM public.staf WHERE dibuat_pada < batas);
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 10 THEN RAISE EXCEPTION 'Batal: langganan_push terhapus %, diharapkan 10', n; END IF;

  DELETE FROM public.alamat;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 16 THEN RAISE EXCEPTION 'Batal: alamat terhapus %, diharapkan 16', n; END IF;

  DELETE FROM public.profil;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 9 THEN RAISE EXCEPTION 'Batal: profil terhapus %, diharapkan 9', n; END IF;
END
$$;

-- ============================================================
-- LANGKAH 2: nonaktifkan tiga staf uji (UPDATE aktif = false, TANPA DELETE)
-- Jalankan terpisah, setelah prasyarat di kepala berkas terpenuhi.
-- ============================================================
DO $$
DECLARE
  n bigint;
  batas constant timestamptz := timestamptz '2026-11-19 00:00+07';
BEGIN
  -- Pengaman: staf sebelum 19 Nov persis tiga, dan persis tiga ID awal ini
  SELECT count(*) INTO n FROM public.staf WHERE dibuat_pada < batas;
  IF n <> 3 THEN RAISE EXCEPTION 'Batal: staf sebelum 19 Nov = %, diharapkan 3', n; END IF;

  SELECT count(*) INTO n FROM public.staf
   WHERE dibuat_pada < batas AND aktif
     AND left(id::text, 8) IN ('2d2e1b15', 'fac68635', '0dc5b241');
  IF n <> 3 THEN RAISE EXCEPTION 'Batal: cocok dengan tiga ID uji = %, diharapkan 3', n; END IF;

  -- Pengaman: enam staf asli utuh dan aktif, tidak ada yang cocok dengan daftar uji
  SELECT count(*) INTO n FROM public.staf WHERE dibuat_pada >= batas AND aktif;
  IF n <> 6 THEN RAISE EXCEPTION 'Batal: staf asli aktif = %, diharapkan 6', n; END IF;

  SELECT count(*) INTO n FROM public.staf
   WHERE dibuat_pada >= batas AND left(id::text, 8) IN ('2d2e1b15', 'fac68635', '0dc5b241');
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: % staf asli ada di daftar uji', n; END IF;

  UPDATE public.staf SET aktif = false
   WHERE dibuat_pada < batas AND aktif
     AND left(id::text, 8) IN ('2d2e1b15', 'fac68635', '0dc5b241');
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 3 THEN RAISE EXCEPTION 'Batal: staf dinonaktifkan %, diharapkan 3', n; END IF;
END
$$;

-- ============================================================
-- LANGKAH 3 (manual, dashboard Supabase: Authentication, Users)
-- Hapus 11 akun ini (ID awal; cocokkan dengan kolom User UID). JANGAN hapus sembilan akun staf.
--   profil dummy example.com : 4900f1ae, 6b672df8, 64abd235, d71ee455, aa8de79c, 187ae4b4
--   profil dummy gmail       : 43a7bc74, b6c93ce9, 1ceeec50
--   tanpa baris              : a3f89974, 84eaa8ad
-- Ketua memastikan lebih dulu bahwa 4 akun gmail di atas adalah kotak uji milik tim, bukan orang lain.
-- Akun yang MASIH ADA sesudahnya (staf, jangan disentuh): 2d2e1b15, fac68635, 0dc5b241 (uji, nonaktif),
--   a7ce5ffc, 572f12bd, dbff6a24, ad59d2c3, 2ff9a6c8, 5e869a10 (asli).
-- ============================================================

-- ============================================================
-- CEK AKHIR (HANYA SELECT): jalankan setelah LANGKAH 1 sampai 3 selesai
-- Hasil yang benar: auth.users 9, staf 9 (aktif 6), profil 0, alamat 0, langganan_push 0,
-- akun Auth non-staf 0, tabel lain 0; menu 38, grup_pilihan 7, menu_grup 20 (tidak berubah).
-- ============================================================
SELECT 'auth.users' AS objek, count(*) AS jumlah FROM auth.users
UNION ALL SELECT 'auth.users non-staf', count(*) FROM auth.users u
  WHERE NOT EXISTS (SELECT 1 FROM public.staf s WHERE s.id = u.id)
UNION ALL SELECT 'staf (total)',    count(*) FROM public.staf
UNION ALL SELECT 'staf (aktif)',    count(*) FROM public.staf WHERE aktif
UNION ALL SELECT 'staf (nonaktif)', count(*) FROM public.staf WHERE NOT aktif
UNION ALL SELECT 'profil',          count(*) FROM public.profil
UNION ALL SELECT 'alamat',          count(*) FROM public.alamat
UNION ALL SELECT 'langganan_push',  count(*) FROM public.langganan_push
UNION ALL SELECT 'order',           count(*) FROM public."order"
UNION ALL SELECT 'inbox',           count(*) FROM public.inbox
UNION ALL SELECT 'belanja',         count(*) FROM public.belanja
UNION ALL SELECT 'menu',            count(*) FROM public.menu
UNION ALL SELECT 'grup_pilihan',    count(*) FROM public.grup_pilihan
UNION ALL SELECT 'menu_grup',       count(*) FROM public.menu_grup;
