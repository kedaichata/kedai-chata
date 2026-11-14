-- supabase/migrations/20261114_02_gelar_saya.sql
-- GLR.02: fungsi SQL baca-saja gelar_saya (gelar tingkat dan gelar menu untuk satu akun customer).
-- Dijalankan MANUAL di SQL Editor (akun ketua). Pembatalan: 20261114_02_gelar_saya_batal.sql
-- Cek hasil: supabase/templates/20261114_02_gelar_saya_cek.sql
-- Uji hitung (data dummy, dibatalkan otomatis): supabase/templates/20261114_02_gelar_saya_uji.sql
-- Hanya menambah SATU fungsi. Tabel gelar, order, order_item, menu, dan hak tabel tidak diubah.
-- Tidak ada tulis-database (GL8, GL23). Aksi `kedai` untuk fungsi ini dikerjakan di GLR.03.
--
-- Keputusan yang berlaku (gelar.md):
--   - Yang dihitung hanya order berstatus Selesai (GL2).
--   - Gelar menu dihitung PER ORDER: satu order yang memuat menu itu dihitung satu kali,
--     berapa pun jumlah porsi atau baris pilihannya (GL3).
--   - Hanya order milik akun sendiri. Order wakil dan pelanggan tanpa akun tidak punya
--     `pemesan`, jadi otomatis tidak ikut (GL6).
--   - Gelar tingkat: satu saja, yaitu aktif dengan ambang tertinggi yang terpenuhi (GL1, GL10).
--     Gelar menu: semua aktif yang terpenuhi (GL1, GL21).
--   - Balasan tanpa angka (jumlah order dan ambang tidak dikirim, GL15) dan tanpa data pribadi
--     (nama tampilan tidak ikut; GL23). Hanya nama gelar, deskripsi gelar tingkat, nama gelar menu,
--     dan kalimat apresiasi.
--   - Pagar peran utama ada di `kedai` (GL7, SEC-38); penolakan staf di fungsi ini adalah pagar kedua.
--
-- Bentuk balasan (jsonb):
--   { "tingkat": {"nama": "...", "deskripsi": "..."} atau null,
--     "menu": [ {"nama": "..."}, ... ],      -- urut ambang tertinggi dulu, lalu nama
--     "apresiasi": "..." }
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai` di GLR.03:
--   id_kosong, peran_tidak_boleh, profil_tidak_ada, pengaturan_rusak
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   bentuk balasan di atas; daftar menu hanya nama; kode galat profil_tidak_ada;
--   baris staf (aktif atau tidak) selalu ditolak; gelar menu tidak mensyaratkan menunya masih aktif.

BEGIN;

CREATE FUNCTION public.gelar_saya(p_akun uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total     integer;
  v_tingkat   jsonb;
  v_menu      jsonb;
  v_apresiasi text;
BEGIN
  IF p_akun IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Hanya customer: ada baris di staf berarti bukan customer (pagar kedua; GL7)
  IF EXISTS (SELECT 1 FROM public.staf WHERE id = p_akun) THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;

  -- Customer harus punya profil
  IF NOT EXISTS (SELECT 1 FROM public.profil WHERE id = p_akun) THEN
    RAISE EXCEPTION 'profil_tidak_ada';
  END IF;

  -- Kalimat apresiasi dari pengaturan (GL16)
  SELECT nilai INTO v_apresiasi
  FROM public.pengaturan
  WHERE kunci = 'gelar_apresiasi';
  IF v_apresiasi IS NULL OR btrim(v_apresiasi) = '' THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;

  -- Total order Selesai milik akun ini (GL2, GL6)
  SELECT count(*) INTO v_total
  FROM public."order" o
  WHERE o.pemesan = p_akun
    AND o.status = 'Selesai';

  -- Gelar tingkat: aktif dengan ambang tertinggi yang terpenuhi (GL1, GL10). Kosong bila belum ada.
  SELECT jsonb_build_object('nama', g.nama, 'deskripsi', g.deskripsi)
  INTO v_tingkat
  FROM public.gelar g
  WHERE g.jenis = 'tingkat'
    AND g.aktif
    AND g.ambang <= v_total
  ORDER BY g.ambang DESC
  LIMIT 1;

  -- Gelar menu: per ORDER unik yang memuat menu itu, bukan per baris atau porsi (GL3)
  SELECT coalesce(
           jsonb_agg(jsonb_build_object('nama', t.nama) ORDER BY t.ambang DESC, t.nama),
           '[]'::jsonb
         )
  INTO v_menu
  FROM (
    SELECT g.nama, g.ambang
    FROM public.gelar g
    WHERE g.jenis = 'menu'
      AND g.aktif
      AND g.ambang <= (
        SELECT count(DISTINCT o.id)
        FROM public."order" o
        JOIN public.order_item oi ON oi.order_id = o.id
        WHERE o.pemesan = p_akun
          AND o.status = 'Selesai'
          AND oi.menu_id = g.menu_id
      )
  ) t;

  RETURN jsonb_build_object(
    'tingkat',   v_tingkat,
    'menu',      v_menu,
    'apresiasi', v_apresiasi
  );
END;
$$;

-- EXECUTE hanya untuk service_role (AGENTS.md bagian 7)
REVOKE ALL ON FUNCTION public.gelar_saya(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gelar_saya(uuid) TO service_role;

COMMIT;
