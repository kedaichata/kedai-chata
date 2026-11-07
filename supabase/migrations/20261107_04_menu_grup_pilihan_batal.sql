-- supabase/migrations/20261107_04_menu_grup_pilihan_batal.sql
-- Pembatalan MNU.09 giliran 1 (20261107_04_menu_grup_pilihan.sql).
-- Dijalankan MANUAL di SQL Editor (akun ketua), hanya bila migration itu perlu ditarik.
--
-- PERINGATAN: membuang tabel `grup_pilihan`, `opsi_pilihan`, dan `menu_grup` MENGHAPUS semua grup, opsi,
-- dan pemasangan yang sudah dibuat owner. Setelah itu tidak bisa dipulihkan (paket gratis tanpa backup otomatis).
-- Bila `kedai` giliran 2 sudah dideploy, pasang kembali `kedai` yang lama dulu, atau aksi grup akan galat.
-- Bila ORD.01 sudah memanggil `opsi_periksa`, jangan jalankan berkas ini tanpa membereskan pemanggilnya.
--
-- Urutan: kembalikan menu_daftar ke versi MNU.07 (tanpa field `grup`), buang fungsi baru,
-- buang tabel (yang bergantung dulu), lalu hapus dua baris pengaturan.
-- Yang TIDAK disentuh: kolom `menu.deskripsi`, `menu_simpan`, dan semua yang dibuat sebelum berkas ini.

BEGIN;

-- 1. menu_daftar kembali ke versi MNU.07 (20261107_03_menu_deskripsi.sql); hak EXECUTE tetap
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
          'id',        m.id,
          'nama',      m.nama,
          'harga',     m.harga,
          'tersedia',  m.tersedia,
          'aktif',     m.aktif,
          'foto',      m.foto,
          'deskripsi', m.deskripsi
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

-- 2. Buang fungsi baru
DROP FUNCTION IF EXISTS public.opsi_periksa(uuid, uuid[]);
DROP FUNCTION IF EXISTS public.menu_grup_atur(uuid, uuid, uuid[]);
DROP FUNCTION IF EXISTS public.grup_daftar(boolean);
DROP FUNCTION IF EXISTS public.grup_nonaktif(uuid, uuid);
DROP FUNCTION IF EXISTS public.grup_simpan(uuid, uuid, text, jsonb, boolean);

-- 3. Buang tabel (yang bergantung pada tabel lain dulu)
DROP TABLE IF EXISTS public.menu_grup;
DROP TABLE IF EXISTS public.opsi_pilihan;
DROP TABLE IF EXISTS public.grup_pilihan;

-- 4. Hapus dua baris pengaturan
DELETE FROM public.pengaturan
 WHERE kunci IN ('grup_maks_per_menu', 'opsi_maks_per_grup');

COMMIT;
