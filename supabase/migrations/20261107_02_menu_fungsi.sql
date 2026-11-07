-- supabase/migrations/20261107_02_menu_fungsi.sql
-- MNU.02 (giliran 1): empat fungsi SQL menu. Aksi `kedai` (index.ts) dibuat di giliran 2.
-- Dijalankan MANUAL di SQL Editor (akun ketua). Pembatalan: 20261107_02_menu_fungsi_batal.sql
-- Cek hasil: supabase/templates/20261107_02_menu_fungsi_cek.sql
-- Semua objek di sini BARU (hanya fungsi). Tabel, data, dan pengaturan lama tidak disentuh.
-- Tanpa data nyata.
--
-- Keputusan yang berlaku (menu.md bagian 9, 7 Nov 2026, dan handoff MNU.01):
--   - Foto di public/img: yang disimpan dan dikembalikan hanya NAMA BERKAS.
--   - Nama kembar ditolak di antara menu aktif (lower(nama)); dijaga indeks menu_nama_aktif_uniq.
--   - Batas harga atas diambil dari pengaturan `harga_maks_menu`, bukan ditulis mati di sini.
--   - `diubah_pada` dan `diubah_oleh` diisi fungsi (tidak ada trigger).
--   - Urutan daftar menu: nama A sampai Z.
--
-- Kode galat (RAISE EXCEPTION dengan pesan = kodenya saja; dipetakan `kedai` ke pesan aman):
--   id_kosong, bukan_owner, nama_tidak_valid, harga_tidak_valid, foto_tidak_valid,
--   nama_kembar, menu_tidak_ditemukan, menu_tidak_aktif, stok_tidak_valid, pengaturan_rusak
--
-- Pola fungsi (AGENTS.md bagian 7): SECURITY DEFINER, search_path kosong, public. eksplisit,
-- EXECUTE hanya untuk service_role. Peran owner dicek `kedai` DAN dicek lagi di sini
-- (lapis kedua). Nilai peran yang dicocokkan: 'owner' (database.md bagian 4).

BEGIN;

-- ============================================================
-- 1. menu_daftar: semua peran (peran disaring `kedai`)
--    p_semua = true  -> semua menu (aktif dan nonaktif), khusus owner
--    p_semua = false -> hanya menu aktif (customer dan penjaga)
-- ============================================================
CREATE FUNCTION public.menu_daftar(p_semua boolean)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',       m.id,
          'nama',     m.nama,
          'harga',    m.harga,
          'tersedia', m.tersedia,
          'aktif',    m.aktif,
          'foto',     m.foto
        )
        ORDER BY lower(m.nama), m.id
      )
      FROM public.menu m
      WHERE m.aktif OR COALESCE(p_semua, false)
    ),
    '[]'::jsonb
  );
END;
$$;

-- ============================================================
-- 2. menu_simpan: owner. Tambah (p_id kosong) atau ubah (p_id terisi).
--    Menu baru otomatis aktif dan Tersedia.
--    p_aktifkan = true pada menu nonaktif = mengaktifkan kembali (MN3).
--    Mengembalikan id menu.
-- ============================================================
CREATE FUNCTION public.menu_simpan(
  p_oleh     uuid,
  p_id       uuid,
  p_nama     text,
  p_harga    integer,
  p_foto     text,
  p_aktifkan boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_nama text;
  v_foto text;
  v_maks bigint;
  v_id   uuid;
BEGIN
  IF p_oleh IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.staf s
    WHERE s.id = p_oleh AND s.aktif AND s.peran = 'owner'
  ) THEN
    RAISE EXCEPTION 'bukan_owner';
  END IF;

  -- Rapikan nama: buang spasi di awal dan akhir, spasi ganda jadi satu (tabel menolaknya)
  v_nama := regexp_replace(
              regexp_replace(COALESCE(p_nama, ''), '^\s+|\s+$', '', 'g'),
              '\s+', ' ', 'g'
            );
  IF char_length(v_nama) < 3 OR char_length(v_nama) > 40 THEN
    RAISE EXCEPTION 'nama_tidak_valid';
  END IF;

  -- Harga: lebih dari 0 dan tidak melebihi harga_maks_menu (database.md bagian 4)
  SELECT CASE WHEN s.nilai::text ~ '^[0-9]{1,9}$' THEN s.nilai::text::bigint END
    INTO v_maks
    FROM public.pengaturan s
   WHERE s.kunci = 'harga_maks_menu';
  IF v_maks IS NULL THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;
  IF p_harga IS NULL OR p_harga <= 0 OR p_harga > v_maks THEN
    RAISE EXCEPTION 'harga_tidak_valid';
  END IF;

  -- Foto: kosong = tanpa foto; selain itu nama berkas saja (huruf kecil, angka, strip)
  v_foto := NULLIF(COALESCE(p_foto, ''), '');
  IF v_foto IS NOT NULL AND (
       char_length(v_foto) > 60
       OR v_foto !~ '^[a-z0-9]+(-[a-z0-9]+)*\.(jpg|webp)$'
     ) THEN
    RAISE EXCEPTION 'foto_tidak_valid';
  END IF;

  IF p_id IS NULL THEN
    -- Tambah menu baru
    BEGIN
      INSERT INTO public.menu (nama, harga, foto, diubah_pada, diubah_oleh)
      VALUES (v_nama, p_harga, v_foto, now(), p_oleh)
      RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'nama_kembar';
    END;
    RETURN v_id;
  END IF;

  -- Ubah menu yang ada (dikunci supaya dua owner tidak bertabrakan)
  PERFORM 1 FROM public.menu m WHERE m.id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'menu_tidak_ditemukan';
  END IF;

  BEGIN
    UPDATE public.menu
       SET nama        = v_nama,
           harga       = p_harga,
           foto        = v_foto,
           aktif       = CASE WHEN COALESCE(p_aktifkan, false) THEN true ELSE aktif END,
           diubah_pada = now(),
           diubah_oleh = p_oleh
     WHERE id = p_id;
  EXCEPTION WHEN unique_violation THEN
    -- Termasuk saat mengaktifkan kembali menu yang namanya sudah dipakai menu aktif
    RAISE EXCEPTION 'nama_kembar';
  END;

  RETURN p_id;
END;
$$;

-- ============================================================
-- 3. menu_stok: owner. Tombol Tersedia/Habis. Hanya untuk menu aktif.
-- ============================================================
CREATE FUNCTION public.menu_stok(
  p_oleh     uuid,
  p_id       uuid,
  p_tersedia boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_aktif boolean;
BEGIN
  IF p_oleh IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.staf s
    WHERE s.id = p_oleh AND s.aktif AND s.peran = 'owner'
  ) THEN
    RAISE EXCEPTION 'bukan_owner';
  END IF;

  IF p_id IS NULL OR p_tersedia IS NULL THEN
    RAISE EXCEPTION 'stok_tidak_valid';
  END IF;

  SELECT m.aktif INTO v_aktif
    FROM public.menu m
   WHERE m.id = p_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'menu_tidak_ditemukan';
  END IF;
  IF NOT v_aktif THEN
    RAISE EXCEPTION 'menu_tidak_aktif';
  END IF;

  UPDATE public.menu
     SET tersedia    = p_tersedia,
         diubah_pada = now(),
         diubah_oleh = p_oleh
   WHERE id = p_id;
END;
$$;

-- ============================================================
-- 4. menu_nonaktif: owner. Pengganti hapus (MN3). Menu yang sudah
--    nonaktif dianggap berhasil (tidak ada yang berubah).
-- ============================================================
CREATE FUNCTION public.menu_nonaktif(
  p_oleh uuid,
  p_id   uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_aktif boolean;
BEGIN
  IF p_oleh IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.staf s
    WHERE s.id = p_oleh AND s.aktif AND s.peran = 'owner'
  ) THEN
    RAISE EXCEPTION 'bukan_owner';
  END IF;

  IF p_id IS NULL THEN
    RAISE EXCEPTION 'menu_tidak_ditemukan';
  END IF;

  SELECT m.aktif INTO v_aktif
    FROM public.menu m
   WHERE m.id = p_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'menu_tidak_ditemukan';
  END IF;
  IF NOT v_aktif THEN
    RETURN;
  END IF;

  UPDATE public.menu
     SET aktif       = false,
         diubah_pada = now(),
         diubah_oleh = p_oleh
   WHERE id = p_id;
END;
$$;

-- ============================================================
-- 5. Hak EXECUTE: cabut semua dulu (termasuk bawaan Supabase),
--    lalu beri hanya ke service_role. anon/authenticated nol.
-- ============================================================
REVOKE ALL ON FUNCTION public.menu_daftar(boolean)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.menu_simpan(uuid, uuid, text, integer, text, boolean)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.menu_stok(uuid, uuid, boolean)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.menu_nonaktif(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.menu_daftar(boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.menu_simpan(uuid, uuid, text, integer, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.menu_stok(uuid, uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.menu_nonaktif(uuid, uuid) TO service_role;

COMMIT;
