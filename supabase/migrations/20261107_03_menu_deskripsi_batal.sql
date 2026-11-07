-- supabase/migrations/20261107_03_menu_deskripsi_batal.sql
-- Pembatalan MNU.07 giliran 1 (20261107_03_menu_deskripsi.sql).
-- Dijalankan MANUAL di SQL Editor (akun ketua), HANYA bila migration tadi perlu dibatalkan.
--
-- ⚠️ PERINGATAN: membatalkan ikut MENGHAPUS isi kolom `deskripsi` semua menu (kolomnya dibuang).
--    Bila sudah ada deskripsi yang terisi dan masih dibutuhkan, salin dulu isinya (SQL Editor, SELECT nama, deskripsi).
--
-- Urutan penting: fungsi dikembalikan dulu, baru kolom dibuang (menu_daftar baru membaca kolom itu).
-- Bila `kedai` giliran 2 sudah dideploy, kembalikan juga `kedai` ke versi MNU.02 SEBELUM atau SEGERA SETELAH
-- ini, karena `kedai` baru memanggil menu_simpan 7 argumen yang dibuang di sini.
-- Pengaturan harga_maks_menu dan semua fungsi lain tidak disentuh.

BEGIN;

-- 1. menu_daftar dikembalikan ke versi MNU.02 (tanpa field deskripsi)
CREATE OR REPLACE FUNCTION public.menu_daftar(p_semua boolean)
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

REVOKE ALL ON FUNCTION public.menu_daftar(boolean)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.menu_daftar(boolean) TO service_role;

-- 2. menu_simpan versi 7 argumen dibuang (versi 6 argumen MNU.02 masih ada dan tidak disentuh)
DROP FUNCTION public.menu_simpan(uuid, uuid, text, integer, text, text, boolean);

-- 3. Kolom deskripsi dibuang (beserta pagar menu_deskripsi_cek)
ALTER TABLE public.menu DROP COLUMN deskripsi;

-- 4. Pengaturan baru dibuang
DELETE FROM public.pengaturan WHERE kunci = 'deskripsi_menu_maks';

COMMIT;
