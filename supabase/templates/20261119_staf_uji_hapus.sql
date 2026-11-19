-- supabase/templates/20261119_staf_uji_hapus.sql
-- LNC.01f lanjutan: MENGHAPUS tuntas tiga baris staf uji (Owner Uji, Bu Owner 2, Penjaga Uji).
-- BERISIKO, tidak bisa dikembalikan. Jalankan HANYA setelah "OK" ketua (19 Nov 2026).
-- Syarat: pemindahan pencatat sudah selesai (20261119_menu_pindah_pencatat.sql), sehingga tidak ada lagi
-- baris yang merujuk ke tiga staf ini. Alasan "nonaktif, bukan hapus" (jejak diubah_oleh) sudah tidak berlaku.
-- Dijalankan di SQL Editor (akun ketua), SATU KALI. Satu blok DO = satu transaksi:
-- bila ada pengaman yang gagal, SEMUANYA batal dan tidak ada yang berubah.
-- Pengecualian DELETE LNC.01 (security.md aturan 12): satu kali oleh ketua di SQL Editor.
--
-- URUTAN WAJIB: (1) blok DO di bawah, BARU (2) hapus tiga akun Auth lewat dashboard.
-- Menghapus akun Auth lebih dulu ditolak oleh staf_id_fkey.
--
-- Yang DIHAPUS: tiga baris staf (ID awal 2d2e1b15, fac68635, 0dc5b241), semuanya nonaktif.
-- Yang TIDAK disentuh: enam staf asli, menu, grup_pilihan, menu_grup, dan semua tabel lain.

DO $$
DECLARE
  n bigint;
  batas constant timestamptz := timestamptz '2026-11-19 00:00+07';
  uji uuid[];
BEGIN
  -- Pengaman: persis tiga staf sebelum 19 Nov, semuanya nonaktif, dan cocok dengan tiga ID awal
  SELECT count(*) INTO n FROM public.staf WHERE dibuat_pada < batas;
  IF n <> 3 THEN RAISE EXCEPTION 'Batal: staf sebelum 19 Nov = %, diharapkan 3', n; END IF;

  SELECT count(*) INTO n FROM public.staf
   WHERE dibuat_pada < batas AND NOT aktif
     AND left(id::text, 8) IN ('2d2e1b15', 'fac68635', '0dc5b241');
  IF n <> 3 THEN RAISE EXCEPTION 'Batal: staf uji nonaktif yang cocok = %, diharapkan 3', n; END IF;

  -- Pengaman: enam staf asli utuh dan aktif
  SELECT count(*) INTO n FROM public.staf WHERE dibuat_pada >= batas AND aktif;
  IF n <> 6 THEN RAISE EXCEPTION 'Batal: staf asli aktif = %, diharapkan 6', n; END IF;

  SELECT array_agg(id) INTO uji FROM public.staf
   WHERE dibuat_pada < batas AND NOT aktif
     AND left(id::text, 8) IN ('2d2e1b15', 'fac68635', '0dc5b241');

  -- Pengaman: tidak ada satu pun baris yang masih merujuk ke tiga staf ini
  SELECT (SELECT count(*) FROM public.menu            WHERE diubah_oleh   = ANY (uji))
       + (SELECT count(*) FROM public.grup_pilihan    WHERE diubah_oleh   = ANY (uji))
       + (SELECT count(*) FROM public.menu_grup       WHERE diubah_oleh   = ANY (uji))
       + (SELECT count(*) FROM public.belanja         WHERE penginput     = ANY (uji))
       + (SELECT count(*) FROM public.foto_bukti      WHERE diunggah_oleh = ANY (uji))
       + (SELECT count(*) FROM public.pelanggan_luar  WHERE dibuat_oleh   = ANY (uji))
       + (SELECT count(*) FROM public."order"         WHERE dibuat_oleh   = ANY (uji) OR pemutus = ANY (uji))
       + (SELECT count(*) FROM public.langganan_push  WHERE akun          = ANY (uji))
       + (SELECT count(*) FROM public.inbox           WHERE penerima      = ANY (uji))
       + (SELECT count(*) FROM public.riwayat_status  WHERE oleh          = ANY (uji))
       + (SELECT count(*) FROM public.catatan_order   WHERE penulis       = ANY (uji))
       + (SELECT count(*) FROM public.baca_catatan    WHERE akun          = ANY (uji))
    INTO n;
  IF n <> 0 THEN RAISE EXCEPTION 'Batal: masih ada % baris yang merujuk ke staf uji', n; END IF;

  -- Penghapusan
  DELETE FROM public.staf WHERE id = ANY (uji);
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 3 THEN RAISE EXCEPTION 'Batal: staf terhapus %, diharapkan 3', n; END IF;
END
$$;

-- ============================================================
-- LANGKAH BERIKUTNYA (manual, dashboard Supabase: Authentication, Users)
-- Hapus tiga akun Auth ini (cocokkan User UID, alamat mereka berakhiran +owner, +owner2, +staf):
--   fac68635, 0dc5b241, 2d2e1b15
-- JANGAN hapus enam akun asli: a7ce5ffc, 572f12bd, dbff6a24, ad59d2c3, 2ff9a6c8, 5e869a10.
-- ============================================================

-- CEK AKHIR (HANYA SELECT): jalankan setelah blok DO dan penghapusan akun Auth selesai.
-- Hasil yang benar: auth.users 6, non-staf 0, staf 6 (aktif 6, nonaktif 0), profil/alamat/push 0,
-- menu 38, grup_pilihan 7, menu_grup 20, dan satu akun asli memegang 38 / 7 / 20.
SELECT 'auth.users' AS objek, count(*) AS jumlah FROM auth.users
UNION ALL SELECT 'auth.users non-staf', count(*) FROM auth.users u
  WHERE NOT EXISTS (SELECT 1 FROM public.staf s WHERE s.id = u.id)
UNION ALL SELECT 'staf (total)',    count(*) FROM public.staf
UNION ALL SELECT 'staf (aktif)',    count(*) FROM public.staf WHERE aktif
UNION ALL SELECT 'staf (nonaktif)', count(*) FROM public.staf WHERE NOT aktif
UNION ALL SELECT 'profil',          count(*) FROM public.profil
UNION ALL SELECT 'alamat',          count(*) FROM public.alamat
UNION ALL SELECT 'langganan_push',  count(*) FROM public.langganan_push
UNION ALL SELECT 'menu',            count(*) FROM public.menu
UNION ALL SELECT 'grup_pilihan',    count(*) FROM public.grup_pilihan
UNION ALL SELECT 'menu_grup',       count(*) FROM public.menu_grup
UNION ALL SELECT 'menu dipegang satu akun asli', max(c) FROM (
  SELECT count(*) AS c FROM public.menu GROUP BY diubah_oleh) t;
