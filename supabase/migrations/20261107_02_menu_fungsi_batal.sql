-- supabase/migrations/20261107_02_menu_fungsi_batal.sql
-- Pembatalan MNU.02 (giliran 1): menghapus empat fungsi SQL menu.
-- Hanya fungsi yang dihapus. Tabel `menu` dan data di dalamnya TIDAK disentuh.
-- Jalankan manual di SQL Editor (akun ketua) hanya bila migration 20261107_02_menu_fungsi.sql
-- perlu dibatalkan. Bila aksi menu di `kedai` sudah di-deploy (giliran 2), deploy ulang
-- `kedai` versi lama dulu, baru jalankan berkas ini.

BEGIN;

DROP FUNCTION IF EXISTS public.menu_daftar(boolean);
DROP FUNCTION IF EXISTS public.menu_simpan(uuid, uuid, text, integer, text, boolean);
DROP FUNCTION IF EXISTS public.menu_stok(uuid, uuid, boolean);
DROP FUNCTION IF EXISTS public.menu_nonaktif(uuid, uuid);

COMMIT;
