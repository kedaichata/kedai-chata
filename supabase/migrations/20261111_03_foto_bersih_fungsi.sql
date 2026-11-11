-- supabase/migrations/20261111_03_foto_bersih_fungsi.sql
-- FTO.05 (langkah 2): tiga fungsi SQL pembantu untuk Edge Function `bersihkan`:
--   `foto_bersih_pilih`, `foto_bersih_tandai`, `foto_bersih_tanpa_baris`.
-- Edge Function `bersihkan` dan penjadwal `pg_cron` dikerjakan di langkah berikutnya (BUKAN di berkas ini).
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo dan SETELAH "OK" ketua.
-- Pembatalan: supabase/migrations/20261111_03_foto_bersih_fungsi_batal.sql
-- Cek hasil: supabase/templates/20261111_03_foto_bersih_fungsi_cek.sql
-- Tanpa data nyata.
--
-- Yang BARU:
--   - fungsi `public.foto_bersih_pilih()`
--   - fungsi `public.foto_bersih_tandai(uuid[])`
--   - fungsi `public.foto_bersih_tanpa_baris(text[])`
-- Yang SENGAJA TIDAK DISENTUH: semua tabel dan pagarnya (termasuk `foto_bukti`, hak tabelnya, dan bucket),
--   data order dan foto, semua fungsi lama, dan baris `pengaturan`. Tidak ada hak tabel baru; TIDAK ADA hak DELETE.
-- Semua fungsi BARU (CREATE FUNCTION, bukan OR REPLACE), jadi tidak mungkin menimpa fungsi lama.
-- Tidak ada data yang berubah sampai `foto_bersih_tandai` dipanggil (dua fungsi lainnya hanya membaca).
--
-- Pola keamanan (AGENTS.md bagian 7, security.md aturan 4): SECURITY DEFINER, search_path kosong,
-- `public.` eksplisit, nama tabel order tidak dipakai di sini, EXECUTE hanya untuk service_role.
-- Fungsi SQL TIDAK menghapus apa pun. Penghapusan BERKAS dikerjakan `bersihkan` lewat jalur resmi Storage
-- (FT7, FT8); fungsi di sini hanya memilih berkas yang layak dihapus dan mencatat bahwa berkas sudah dihapus.
-- Baris `foto_bukti` tidak pernah dihapus (FT10); hanya kolom `dibersihkan_pada` yang diisi.
--
-- Keputusan yang berlaku (foto-bukti.md FT6 sampai FT8, database.md bagian 5 dan 8):
--   - Layak dihapus: foto yang belum dibersihkan DAN (sudah ditandai `diganti`, tanpa menunggu 14 hari,
--     ATAU diunggah lebih tua dari `foto_simpan_hari` hari, nilainya dari tabel pengaturan, bukan ditulis mati).
--   - Berkas tanpa baris (sisa unggahan yang tidak sempat dicatat) disapu `bersihkan` hanya bila lebih tua dari
--     batas yang sama. Umur berkas dibaca `bersihkan` dari Storage; fungsi SQL ini hanya memastikan ada atau
--     tidaknya baris untuk tiap lokasi.
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   1. `foto_bersih_tandai` hanya menandai baris yang MEMANG layak dihapus (syarat yang sama dengan
--      `foto_bersih_pilih`). Maksudnya pagar kedua: bila ada kesalahan di `bersihkan`, foto yang masih baru
--      tidak akan keliru tercatat "sudah dibersihkan". Hasilnya jumlah baris yang benar-benar ditandai.
--   2. `foto_simpan_hari` harus bilangan bulat 1 sampai 3650; di luar itu galat `pengaturan_rusak`
--      (galat umum, tidak dipetakan). Batas atas 3650 adalah pilihan penulis.
--   3. Daftar kiriman dibatasi paling banyak 1000 elemen (galat `daftar_terlalu_besar`) sebagai pagar kasar.
--      Perkiraan beban: sekitar 30 foto per hari, sekitar 200 foto per putaran mingguan, jauh di bawah batas.
--   4. `foto_bersih_pilih` tanpa batas jumlah baris. Bila kelak ratusan berkas menumpuk, `bersihkan` bisa
--      memproses bertahap; belum dibutuhkan.
--   5. Penghapusan berkas lalu penandaan baris tidak atomik (Storage di luar database). Aman diulang:
--      bila berkas sudah terhapus tetapi penandaan gagal, putaran berikutnya memilih baris yang sama,
--      menghapus berkas (sudah tidak ada, tidak masalah), lalu menandainya.
--
-- Kode galat (RAISE EXCEPTION), hanya dibaca `bersihkan` untuk log (bukan untuk pengguna):
--   id_kosong, daftar_terlalu_besar, pengaturan_rusak

BEGIN;

-- ============================================================
-- 1. foto_bersih_pilih: daftar foto yang layak dihapus berkasnya, dan batas waktu yang dipakai.
--    Hanya membaca. Mengembalikan {batas_waktu, foto: [{id, lokasi}, ...]}.
--    `batas_waktu` = sekarang dikurangi `foto_simpan_hari` hari; dipakai `bersihkan` juga untuk
--    menyapu berkas tanpa baris (umur berkas dibandingkan dengan batas ini).
-- ============================================================
CREATE FUNCTION public.foto_bersih_pilih()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_txt   text;
  v_hari  integer;
  v_batas timestamptz;
  v_foto  jsonb;
BEGIN
  SELECT nullif(btrim(g.nilai::text), '')
    INTO v_txt
    FROM public.pengaturan g
   WHERE g.kunci = 'foto_simpan_hari';
  IF v_txt IS NULL OR v_txt !~ '^[0-9]{1,4}$' THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;
  v_hari := v_txt::integer;
  IF v_hari < 1 OR v_hari > 3650 THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;

  v_batas := now() - make_interval(days => v_hari);

  SELECT coalesce(
           jsonb_agg(
             jsonb_build_object('id', f.id, 'lokasi', f.lokasi_berkas)
             ORDER BY f.diunggah_pada
           ),
           '[]'::jsonb
         )
    INTO v_foto
    FROM public.foto_bukti f
   WHERE f.dibersihkan_pada IS NULL
     AND (f.diganti = true OR f.diunggah_pada < v_batas);

  RETURN jsonb_build_object('batas_waktu', v_batas, 'foto', v_foto);
END;
$$;

-- ============================================================
-- 2. foto_bersih_tandai: mencatat bahwa berkas foto sudah dihapus dari Storage (mengisi `dibersihkan_pada`).
--    Hanya baris yang belum dibersihkan DAN memang layak dihapus yang ditandai (pagar kedua).
--    Mengembalikan jumlah baris yang ditandai. Baris tidak pernah dihapus.
-- ============================================================
CREATE FUNCTION public.foto_bersih_tandai(p_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_txt   text;
  v_hari  integer;
  v_batas timestamptz;
  v_n     integer;
BEGIN
  IF p_ids IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;
  IF cardinality(p_ids) > 1000 THEN
    RAISE EXCEPTION 'daftar_terlalu_besar';
  END IF;

  SELECT nullif(btrim(g.nilai::text), '')
    INTO v_txt
    FROM public.pengaturan g
   WHERE g.kunci = 'foto_simpan_hari';
  IF v_txt IS NULL OR v_txt !~ '^[0-9]{1,4}$' THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;
  v_hari := v_txt::integer;
  IF v_hari < 1 OR v_hari > 3650 THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;

  v_batas := now() - make_interval(days => v_hari);

  UPDATE public.foto_bukti
     SET dibersihkan_pada = now()
   WHERE id = ANY (p_ids)
     AND dibersihkan_pada IS NULL
     AND (diganti = true OR diunggah_pada < v_batas);

  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;

-- ============================================================
-- 3. foto_bersih_tanpa_baris: dari daftar lokasi berkas yang ada di Storage (dikirim `bersihkan`),
--    mana yang TIDAK punya baris di `foto_bukti`. Hanya membaca. Mengembalikan daftar lokasi (jsonb).
--    Umur berkas tidak dicek di sini; `bersihkan` yang membandingkannya dengan `batas_waktu`.
-- ============================================================
CREATE FUNCTION public.foto_bersih_tanpa_baris(p_lokasi text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_hasil jsonb;
BEGIN
  IF p_lokasi IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;
  IF cardinality(p_lokasi) > 1000 THEN
    RAISE EXCEPTION 'daftar_terlalu_besar';
  END IF;

  SELECT coalesce(jsonb_agg(t.lokasi ORDER BY t.lokasi), '[]'::jsonb)
    INTO v_hasil
    FROM (
      SELECT DISTINCT x AS lokasi
        FROM unnest(p_lokasi) AS x
       WHERE x IS NOT NULL
         AND NOT EXISTS (
           SELECT 1
             FROM public.foto_bukti f
            WHERE f.lokasi_berkas = x
         )
    ) t;

  RETURN v_hasil;
END;
$$;

-- ============================================================
-- 4. Hak EXECUTE: cabut semua dulu, lalu beri hanya ke service_role (AGENTS.md bagian 7).
-- ============================================================
REVOKE ALL ON FUNCTION public.foto_bersih_pilih()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.foto_bersih_tandai(uuid[])
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.foto_bersih_tanpa_baris(text[])
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.foto_bersih_pilih()                TO service_role;
GRANT EXECUTE ON FUNCTION public.foto_bersih_tandai(uuid[])         TO service_role;
GRANT EXECUTE ON FUNCTION public.foto_bersih_tanpa_baris(text[])    TO service_role;

COMMIT;
