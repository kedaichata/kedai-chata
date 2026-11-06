-- supabase/migrations/20261106_alamat.sql
-- AKN.07: fungsi SQL atomik untuk buku alamat (akun.md AK9).
-- Dijalankan MANUAL di SQL Editor (akun ketua). Pembatalan: 20261106_alamat_batal.sql
-- Hanya menambah DUA FUNGSI BARU. Tidak ada tabel, hak tabel, atau data yang diubah.
-- Hak UPDATE dan INSERT di tabel alamat untuk service_role sudah ada (AKN.03).
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai` ke pesan aman:
--   id_kosong, alias_tidak_valid, alamat_tidak_valid, pengaturan_rusak,
--   profil_tidak_ada, alamat_penuh, alamat_tidak_ditemukan, alamat_terakhir
-- Catatan: p_pemilik HARUS diambil `kedai` dari token login, bukan dari aplikasi.

BEGIN;

-- ============================================================
-- 1. alamat_simpan: tambah (p_id kosong) atau ubah (p_id diisi)
-- ============================================================
CREATE FUNCTION public.alamat_simpan(
  p_pemilik uuid,
  p_id      uuid,
  p_alias   text,
  p_isi     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_alias text := btrim(p_alias);
  v_isi   text := btrim(p_isi);
  v_maks  integer;
  v_aktif integer;
BEGIN
  IF p_pemilik IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Alias 3-30 dan isi alamat 10-200 (AK9)
  IF coalesce(char_length(v_alias), 0) NOT BETWEEN 3 AND 30 THEN
    RAISE EXCEPTION 'alias_tidak_valid';
  END IF;
  IF coalesce(char_length(v_isi), 0) NOT BETWEEN 10 AND 200 THEN
    RAISE EXCEPTION 'alamat_tidak_valid';
  END IF;

  -- Kunci baris profil pemilik: dua permintaan bersamaan antre di sini,
  -- jadi batas alamat_maks tidak bisa ditembus. Tanpa profil (termasuk staf) ditolak.
  PERFORM 1 FROM public.profil WHERE id = p_pemilik FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profil_tidak_ada';
  END IF;

  IF p_id IS NULL THEN
    -- Tambah: cek batas dari pengaturan, tidak ditulis mati (AGENTS.md bagian 1)
    SELECT nilai::integer INTO v_maks
    FROM public.pengaturan
    WHERE kunci = 'alamat_maks';
    IF v_maks IS NULL OR v_maks < 1 THEN
      RAISE EXCEPTION 'pengaturan_rusak';
    END IF;

    SELECT count(*) INTO v_aktif
    FROM public.alamat
    WHERE pemilik = p_pemilik AND aktif;
    IF v_aktif >= v_maks THEN
      RAISE EXCEPTION 'alamat_penuh';
    END IF;

    INSERT INTO public.alamat (pemilik, alias, isi)
    VALUES (p_pemilik, v_alias, v_isi);
  ELSE
    -- Ubah: hanya alamat AKTIF milik sendiri. Milik orang lain, nonaktif, atau
    -- tidak ada: satu kode yang sama (tidak membocorkan ada tidaknya alamat itu).
    UPDATE public.alamat
    SET alias = v_alias, isi = v_isi
    WHERE id = p_id AND pemilik = p_pemilik AND aktif;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'alamat_tidak_ditemukan';
    END IF;
  END IF;
END;
$$;

-- ============================================================
-- 2. alamat_nonaktif: nonaktifkan (tanpa hapus), minimal 1 tetap aktif
-- ============================================================
CREATE FUNCTION public.alamat_nonaktif(
  p_pemilik uuid,
  p_id      uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_aktif integer;
BEGIN
  IF p_pemilik IS NULL OR p_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Kunci baris profil pemilik (alasan sama dengan alamat_simpan)
  PERFORM 1 FROM public.profil WHERE id = p_pemilik FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profil_tidak_ada';
  END IF;

  -- Harus alamat aktif milik sendiri
  PERFORM 1 FROM public.alamat
  WHERE id = p_id AND pemilik = p_pemilik AND aktif;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'alamat_tidak_ditemukan';
  END IF;

  -- Minimal 1 alamat aktif (AK9)
  SELECT count(*) INTO v_aktif
  FROM public.alamat
  WHERE pemilik = p_pemilik AND aktif;
  IF v_aktif <= 1 THEN
    RAISE EXCEPTION 'alamat_terakhir';
  END IF;

  UPDATE public.alamat
  SET aktif = false
  WHERE id = p_id AND pemilik = p_pemilik;
END;
$$;

-- EXECUTE hanya untuk service_role (AGENTS.md bagian 7)
REVOKE ALL ON FUNCTION public.alamat_simpan(uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.alamat_simpan(uuid, uuid, text, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.alamat_nonaktif(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.alamat_nonaktif(uuid, uuid)
  TO service_role;

COMMIT;
