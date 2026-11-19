-- supabase/templates/20261119_belanja_data_uji_hapus.sql
-- LNC.01c: hapus SEMUA data uji Belanja (satu kali, oleh ketua, di SQL Editor).
-- Pengecualian tanpa-DELETE yang tercatat: security.md aturan 12 (pembersihan data uji LNC.01).
-- "OK" ketua: 19 Nov 2026. Data yang dihapus: 10 catatan dan 69 item, semua milik dua akun uji.
-- TIDAK BISA DIPULIHKAN (paket gratis tanpa backup; ekspor CSV dilewati karena data dummy).
-- Tabel, hak, pengaturan, dan fungsi Belanja TIDAK disentuh. Tabel lain tidak merujuk ke dua tabel ini.
--
-- Pengaman: seluruh blok berjalan dalam satu transaksi dan BATAL OTOMATIS (tidak ada yang terhapus)
-- bila jumlah baris tidak tepat 10 dan 69, bila ada penginput selain dua akun uji,
-- atau bila jumlah yang terhapus tidak sama dengan yang dihitung.
-- Urutan: belanja_item dulu (anak), baru belanja (induk).
-- Tanpa data nyata di berkas ini.

BEGIN;

DO $$
DECLARE
  n_catatan integer;
  n_item    integer;
  n_hapus   integer;
BEGIN
  SELECT count(*) INTO n_catatan FROM public.belanja;
  SELECT count(*) INTO n_item    FROM public.belanja_item;

  IF n_catatan <> 10 OR n_item <> 69 THEN
    RAISE EXCEPTION 'Jumlah tidak cocok (catatan %, item %). Dibatalkan, tidak ada yang dihapus.',
      n_catatan, n_item;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.belanja
    WHERE nama_penginput NOT IN ('Bu Owner 2', 'Owner Uji')
  ) THEN
    RAISE EXCEPTION 'Ada penginput selain akun uji. Dibatalkan, tidak ada yang dihapus.';
  END IF;

  DELETE FROM public.belanja_item WHERE true;
  GET DIAGNOSTICS n_hapus = ROW_COUNT;
  IF n_hapus <> 69 THEN
    RAISE EXCEPTION 'Item terhapus % (seharusnya 69). Dibatalkan.', n_hapus;
  END IF;

  DELETE FROM public.belanja WHERE true;
  GET DIAGNOSTICS n_hapus = ROW_COUNT;
  IF n_hapus <> 10 THEN
    RAISE EXCEPTION 'Catatan terhapus % (seharusnya 10). Dibatalkan.', n_hapus;
  END IF;
END $$;

COMMIT;

-- Cek sesudahnya (hanya SELECT): keduanya harus 0
SELECT 'belanja' AS tabel, count(*) AS jumlah FROM public.belanja
UNION ALL
SELECT 'belanja_item', count(*) FROM public.belanja_item;
