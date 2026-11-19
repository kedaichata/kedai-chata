-- supabase/templates/20261119_inbox_foto_data_uji_hapus.sql
-- LNC.01d: hapus SEMUA data uji inbox dan foto_bukti (satu kali, oleh ketua, di SQL Editor).
-- Pengecualian tanpa-DELETE yang tercatat: security.md aturan 12 (pembersihan data uji LNC.01).
-- "OK" ketua: 19 Nov 2026 (ketua mengonfirmasi semua akun owner, penjaga, dan customer di data ini
-- adalah akun uji; belum ada customer sungguhan). Data yang dihapus: 255 baris inbox dan 9 baris foto_bukti.
-- TIDAK BISA DIPULIHKAN (paket gratis tanpa backup; ekspor CSV dilewati karena data uji,
-- sesuai AGENTS.md blok 19 Nov 2026).
-- Yang TIDAK disentuh: tabel order dan turunannya, akun, staf, menu, pengaturan, fungsi, hak tabel,
-- bucket Storage, dan nomor urut inbox (tidak direset). Tabel lain tidak merujuk ke dua tabel ini.
-- Berkas foto di Storage dihapus TERPISAH lewat dashboard (lihat catatan di bawah).
--
-- Pengaman: seluruh blok berjalan dalam satu transaksi dan BATAL OTOMATIS (tidak ada yang terhapus) bila:
--   - jumlah baris tidak tepat 255 (inbox) dan 9 (foto_bukti);
--   - ada baris inbox bertanggal 19 Nov 2026 (WIB) atau sesudahnya (waktu akun asli dibuat);
--   - ada penerima inbox atau pengunggah foto berupa staf yang dibuat 19 Nov 2026 atau sesudahnya (akun asli);
--   - jumlah penerima inbox berbeda berjumlah selain 5, atau pengunggah foto selain 1;
--   - jumlah yang terhapus tidak sama dengan yang dihitung.
-- Tanpa ID akun dan tanpa data nyata di berkas ini.
-- Urutan: tidak ada kunci asing antar kedua tabel ini, jadi urutannya bebas.
--
-- Catatan Storage (setelah SQL ini berhasil): buka dashboard > Storage > bucket foto-bukti,
-- pilih semua berkas (5 berkas) lalu hapus. Bucket-nya JANGAN dihapus. Cek hasilnya dengan
-- blok A di 20261119_inbox_foto_data_uji_cek.sql: berkas di bucket harus 0.

BEGIN;

DO $$
DECLARE
  batas     constant timestamptz := timestamptz '2026-11-19 00:00+07';
  n_inbox   integer;
  n_foto    integer;
  n_hapus   integer;
BEGIN
  SELECT count(*) INTO n_inbox FROM public.inbox;
  SELECT count(*) INTO n_foto  FROM public.foto_bukti;

  IF n_inbox <> 255 OR n_foto <> 9 THEN
    RAISE EXCEPTION 'Jumlah tidak cocok (inbox %, foto_bukti %). Dibatalkan, tidak ada yang dihapus.',
      n_inbox, n_foto;
  END IF;

  IF EXISTS (SELECT 1 FROM public.inbox WHERE waktu >= batas) THEN
    RAISE EXCEPTION 'Ada baris inbox sejak 19 Nov 2026. Dibatalkan, tidak ada yang dihapus.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.foto_bukti WHERE diunggah_pada >= batas) THEN
    RAISE EXCEPTION 'Ada foto_bukti sejak 19 Nov 2026. Dibatalkan, tidak ada yang dihapus.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.inbox i
    JOIN public.staf s ON s.id = i.penerima
    WHERE s.dibuat_pada >= batas
  ) THEN
    RAISE EXCEPTION 'Ada penerima inbox berupa staf asli (dibuat sejak 19 Nov). Dibatalkan, tidak ada yang dihapus.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.foto_bukti f
    JOIN public.staf s ON s.id = f.diunggah_oleh
    WHERE s.dibuat_pada >= batas
  ) THEN
    RAISE EXCEPTION 'Ada pengunggah foto berupa staf asli (dibuat sejak 19 Nov). Dibatalkan, tidak ada yang dihapus.';
  END IF;

  IF (SELECT count(DISTINCT penerima) FROM public.inbox) <> 5
     OR (SELECT count(DISTINCT diunggah_oleh) FROM public.foto_bukti) <> 1 THEN
    RAISE EXCEPTION 'Jumlah akun berbeda dari yang didata (5 penerima inbox, 1 pengunggah foto). Dibatalkan, tidak ada yang dihapus.';
  END IF;

  DELETE FROM public.inbox WHERE true;
  GET DIAGNOSTICS n_hapus = ROW_COUNT;
  IF n_hapus <> 255 THEN
    RAISE EXCEPTION 'Inbox terhapus % (seharusnya 255). Dibatalkan.', n_hapus;
  END IF;

  DELETE FROM public.foto_bukti WHERE true;
  GET DIAGNOSTICS n_hapus = ROW_COUNT;
  IF n_hapus <> 9 THEN
    RAISE EXCEPTION 'foto_bukti terhapus % (seharusnya 9). Dibatalkan.', n_hapus;
  END IF;
END $$;

COMMIT;

-- Cek sesudahnya (hanya SELECT): keduanya harus 0
SELECT 'inbox' AS tabel, count(*) AS jumlah FROM public.inbox
UNION ALL
SELECT 'foto_bukti', count(*) FROM public.foto_bukti;
