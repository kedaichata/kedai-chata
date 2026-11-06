-- supabase/migrations/20261106_ganti_profil.sql
-- AKN.08a: fungsi SQL atomik untuk ganti nama tampilan dan ganti nomor WA (akun.md AK7, AK8).
-- Dijalankan MANUAL di SQL Editor (akun ketua). Pembatalan: 20261106_ganti_profil_batal.sql
-- Hanya menambah DUA FUNGSI BARU. Tidak ada tabel, hak tabel, atau data yang diubah.
-- Hak UPDATE di tabel profil untuk service_role sudah ada (AKN.03).
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai` ke pesan aman:
--   id_kosong, nama_tidak_valid, wa_tidak_valid, profil_tidak_ada
-- Catatan: p_pemilik HARUS diambil `kedai` dari token login, bukan dari aplikasi.
-- Akun staf tidak punya baris profil, jadi otomatis ditolak (profil_tidak_ada).

BEGIN;

-- ============================================================
-- 1. ganti_nama: ubah nama tampilan milik sendiri (AK7)
-- ============================================================
CREATE FUNCTION public.ganti_nama(
  p_pemilik uuid,
  p_nama    text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_nama text := btrim(p_nama);
BEGIN
  IF p_pemilik IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Nama tampilan: 3-20, huruf/angka/spasi/garis bawah (AK7)
  IF coalesce(char_length(v_nama), 0) NOT BETWEEN 3 AND 20
     OR coalesce(v_nama, '') !~ '^[A-Za-z0-9_ ]+$' THEN
    RAISE EXCEPTION 'nama_tidak_valid';
  END IF;

  -- Hanya baris profil milik sendiri. Tanpa profil (termasuk staf) ditolak.
  UPDATE public.profil
  SET nama_tampilan = v_nama
  WHERE id = p_pemilik;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profil_tidak_ada';
  END IF;
END;
$$;

-- ============================================================
-- 2. ganti_wa: ubah nomor WA milik sendiri (AK8), disimpan seragam 62...
-- ============================================================
CREATE FUNCTION public.ganti_wa(
  p_pemilik uuid,
  p_wa      text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_wa text := btrim(p_wa);
BEGIN
  IF p_pemilik IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Nomor WA: boleh diawali +62, 62, atau 08; disimpan sebagai 62... (sama dengan buat_profil)
  IF coalesce(v_wa, '') !~ '^(\+62|62|0)8[0-9]{8,11}$' THEN
    RAISE EXCEPTION 'wa_tidak_valid';
  END IF;
  v_wa := '62' || regexp_replace(v_wa, '^(\+62|62|0)', '');

  -- Hanya baris profil milik sendiri. Tanpa profil (termasuk staf) ditolak.
  UPDATE public.profil
  SET nomor_wa = v_wa
  WHERE id = p_pemilik;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profil_tidak_ada';
  END IF;
END;
$$;

-- EXECUTE hanya untuk service_role (AGENTS.md bagian 7)
REVOKE ALL ON FUNCTION public.ganti_nama(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ganti_nama(uuid, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.ganti_wa(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ganti_wa(uuid, text)
  TO service_role;

COMMIT;
