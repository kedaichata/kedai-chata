-- supabase/templates/20261119_menu_pindah_pencatat.sql
-- LNC.01f tambahan: memindahkan "diubah_oleh" dari dua akun owner uji (Owner Uji dan Bu Owner 2)
-- ke SATU akun owner asli (akun ibu ketua). Menyentuh tabel menu, grup_pilihan, dan menu_grup.
-- Alasan: pekerjaan input menu memang dilakukan ibu ketua, hanya lewat akun uji.
-- Yang berubah: HANYA kolom diubah_oleh. diubah_pada dan semua isi menu TIDAK disentuh (tanpa trigger).
-- Tidak bisa dikembalikan otomatis; pembatalannya UPDATE balik manual (jumlah: menu 38, grup_pilihan 7, menu_grup 20).
-- Butuh "OK" ketua (tabel yang sudah berisi data). Dijalankan di SQL Editor (akun ketua).
--
-- ID akun asli TIDAK ditulis di repo: ganti GANTI_8_KARAKTER_AWAL di LANGKAH 2 HANYA di SQL Editor,
-- jangan simpan versi yang sudah terisi ke repo. Bila belum diganti, skrip berhenti dengan galat.
--
-- Jumlah yang diharapkan (hasil cek 19 Nov 2026):
--   menu 38 (11 + 27), grup_pilihan 7 (3 + 4), menu_grup 20 (4 + 16), semuanya dari dua ID uji
--   fac68635 dan 0dc5b241. Bila angka berubah, skrip berhenti. Jangan ubah angka sendiri: laporkan ke chat.

-- ============================================================
-- LANGKAH 1 (HANYA SELECT): cari ID awal akun asli ibu ketua
-- Urut dari yang paling baru login. Cocokkan ID awal di dashboard (Authentication, Users).
-- ============================================================
SELECT
  left(s.id::text, 8)                          AS id_awal,
  s.peran,
  s.aktif,
  u.last_sign_in_at AT TIME ZONE 'Asia/Jakarta' AS login_terakhir_wib
FROM public.staf s
JOIN auth.users u ON u.id = s.id
WHERE s.dibuat_pada >= timestamptz '2026-11-19 00:00+07'
ORDER BY u.last_sign_in_at DESC NULLS LAST;

-- ============================================================
-- LANGKAH 2 (UPDATE): pindahkan pencatat. Ganti GANTI_8_KARAKTER_AWAL di SQL Editor saja.
-- Satu blok DO = satu transaksi; bila ada pengaman gagal, tidak ada yang berubah.
-- ============================================================
DO $$
DECLARE
  n bigint;
  v_awal constant text := 'GANTI_8_KARAKTER_AWAL';
  batas  constant timestamptz := timestamptz '2026-11-19 00:00+07';
  v_tujuan uuid;
BEGIN
  -- Pengaman: isian harus sudah diganti dan cocok dengan tepat satu owner asli aktif
  IF v_awal !~ '^[0-9a-f]{8}$' THEN
    RAISE EXCEPTION 'Batal: isian ID awal belum diganti atau bentuknya salah';
  END IF;

  SELECT count(*) INTO n FROM public.staf
   WHERE left(id::text, 8) = v_awal AND peran = 'owner' AND aktif AND dibuat_pada >= batas;
  IF n <> 1 THEN RAISE EXCEPTION 'Batal: owner asli aktif dengan ID awal itu = %, diharapkan 1', n; END IF;

  SELECT id INTO v_tujuan FROM public.staf
   WHERE left(id::text, 8) = v_awal AND peran = 'owner' AND aktif AND dibuat_pada >= batas;

  -- Pengaman: dua akun uji ada dan nonaktif (Langkah 2 LNC.01f sudah jalan)
  SELECT count(*) INTO n FROM public.staf
   WHERE dibuat_pada < batas AND NOT aktif AND left(id::text, 8) IN ('fac68635', '0dc5b241');
  IF n <> 2 THEN RAISE EXCEPTION 'Batal: akun owner uji nonaktif = %, diharapkan 2', n; END IF;

  -- Pengaman: semua baris di tiga tabel memang berasal dari dua akun uji itu
  SELECT count(*) INTO n FROM public.menu
   WHERE diubah_oleh IS NULL
      OR diubah_oleh NOT IN (SELECT id FROM public.staf
          WHERE dibuat_pada < batas AND left(id::text, 8) IN ('fac68635', '0dc5b241'));
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: % baris menu berasal dari akun lain', n; END IF;

  SELECT count(*) INTO n FROM public.grup_pilihan
   WHERE diubah_oleh IS NULL
      OR diubah_oleh NOT IN (SELECT id FROM public.staf
          WHERE dibuat_pada < batas AND left(id::text, 8) IN ('fac68635', '0dc5b241'));
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: % baris grup_pilihan berasal dari akun lain', n; END IF;

  SELECT count(*) INTO n FROM public.menu_grup
   WHERE diubah_oleh IS NULL
      OR diubah_oleh NOT IN (SELECT id FROM public.staf
          WHERE dibuat_pada < batas AND left(id::text, 8) IN ('fac68635', '0dc5b241'));
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: % baris menu_grup berasal dari akun lain', n; END IF;

  -- Pengaman: jumlah baris persis seperti hasil cek
  SELECT count(*) INTO n FROM public.menu;
  IF n <> 38 THEN RAISE EXCEPTION 'Batal: menu = %, diharapkan 38', n; END IF;
  SELECT count(*) INTO n FROM public.grup_pilihan;
  IF n <> 7 THEN RAISE EXCEPTION 'Batal: grup_pilihan = %, diharapkan 7', n; END IF;
  SELECT count(*) INTO n FROM public.menu_grup;
  IF n <> 20 THEN RAISE EXCEPTION 'Batal: menu_grup = %, diharapkan 20', n; END IF;

  -- Pemindahan (hanya kolom diubah_oleh)
  UPDATE public.menu SET diubah_oleh = v_tujuan;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 38 THEN RAISE EXCEPTION 'Batal: menu diubah %, diharapkan 38', n; END IF;

  UPDATE public.grup_pilihan SET diubah_oleh = v_tujuan;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 7 THEN RAISE EXCEPTION 'Batal: grup_pilihan diubah %, diharapkan 7', n; END IF;

  UPDATE public.menu_grup SET diubah_oleh = v_tujuan;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 20 THEN RAISE EXCEPTION 'Batal: menu_grup diubah %, diharapkan 20', n; END IF;
END
$$;

-- ============================================================
-- CEK SESUDAH (HANYA SELECT)
-- Hasil yang benar: baris owner uji (fac68635, 0dc5b241, dan 2d2e1b15) semua 0, dan SATU akun asli
-- memegang menu 38, grup 7, menu_grup 20.
-- ============================================================
SELECT
  left(s.id::text, 8)                                                         AS id_awal,
  s.peran,
  s.aktif,
  (s.dibuat_pada >= timestamptz '2026-11-19 00:00+07')                        AS akun_asli,
  (SELECT count(*) FROM public.menu m         WHERE m.diubah_oleh  = s.id)    AS menu,
  (SELECT count(*) FROM public.grup_pilihan g WHERE g.diubah_oleh  = s.id)    AS grup,
  (SELECT count(*) FROM public.menu_grup mg   WHERE mg.diubah_oleh = s.id)    AS menu_grup
FROM public.staf s
ORDER BY s.dibuat_pada;
