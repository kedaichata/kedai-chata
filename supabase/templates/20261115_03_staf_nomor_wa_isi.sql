-- supabase/templates/20261115_03_staf_nomor_wa_isi.sql
-- WAG.06: isi kolom nomor_wa di tabel staf.
--
-- CARA PAKAI:
-- 1. Salin SELURUH isi berkas ini ke SQL Editor Supabase (akun ketua).
-- 2. Ganti 628XXXXXXXXXX dengan nomor asli DI SQL EDITOR SAJA.
--    Bentuk: 628 diikuti 8 sampai 11 angka, tanpa +, spasi, atau strip.
-- 3. Staf yang nomornya tidak diganti (tetap 628XXXXXXXXXX) DILEWATI,
--    nomornya tetap kosong. Jadi aman bila baru sebagian staf yang diisi.
-- 4. Klik Run. Hasil yang benar: tabel cek di bawah, kolom bernomor
--    true untuk staf yang diisi.
-- 5. JANGAN simpan balik berkas ini dengan nomor asli. Jangan tempel
--    nomor atau galat yang memuat nomor ke chat (AGENTS.md aturan 11).
--
-- PENGAMAN: bila nama tampilan tidak cocok tepat 1 staf aktif, seluruh
-- perubahan dibatalkan otomatis (satu blok DO = satu kesatuan).
-- Dipakai ulang saat peluncuran: isi nomor benar, Run lagi, nomor lama tertimpa.
-- Tidak mengubah hak akses, skema, atau tabel lain.

DO $$
DECLARE
  r record;
  n integer;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('Bu Owner 2',  '628XXXXXXXXXX'),
      ('Owner Uji',   '628XXXXXXXXXX'),
      ('Penjaga Uji', '628XXXXXXXXXX')
    ) AS t(nama, nomor)
  LOOP
    -- Placeholder belum diganti: lewati.
    IF r.nomor = '628XXXXXXXXXX' THEN
      CONTINUE;
    END IF;

    UPDATE public.staf
       SET nomor_wa = r.nomor
     WHERE nama_tampilan = r.nama
       AND aktif;

    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 1 THEN
      RAISE EXCEPTION 'staf_tidak_tepat_satu: % (cocok % baris)', r.nama, n;
    END IF;
  END LOOP;
END $$;

-- Cek (tanpa menampilkan nomor): bernomor = true bila nomor_wa terisi.
SELECT nama_tampilan, peran, aktif, (nomor_wa IS NOT NULL) AS bernomor
FROM public.staf
ORDER BY peran, nama_tampilan;
