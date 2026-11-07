-- supabase/templates/20261107_02_menu_fungsi_cek.sql
-- Cek baca-saja setelah menjalankan 20261107_02_menu_fungsi.sql (hanya SELECT, tanpa data nyata).
-- Jalankan di SQL Editor (akun ketua), lalu tempel hasil tiap bagian ke chat.

-- 1. Fungsi ada, SECURITY DEFINER, search_path kosong.
--    Benar: 4 baris; kolom "security_definer" = true; "config" memuat search_path=""
SELECT p.proname           AS fungsi,
       p.prosecdef         AS security_definer,
       p.proconfig         AS config,
       pg_get_function_identity_arguments(p.oid) AS argumen
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('menu_daftar', 'menu_simpan', 'menu_stok', 'menu_nonaktif')
 ORDER BY p.proname;

-- 2. Siapa yang boleh EXECUTE.
--    Benar: tiap fungsi hanya muncul untuk pemilik fungsi (postgres) dan service_role.
--    TIDAK boleh ada PUBLIC, anon, atau authenticated.
SELECT p.proname AS fungsi,
       CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE a.grantee::regrole::text END AS penerima,
       a.privilege_type AS hak
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
 WHERE n.nspname = 'public'
   AND p.proname IN ('menu_daftar', 'menu_simpan', 'menu_stok', 'menu_nonaktif')
 ORDER BY p.proname, penerima;

-- 3. Nilai peran di tabel staf (hanya hitungan, tanpa nama atau id).
--    Benar: ada peran yang persis bernama owner (fungsi mencocokkan 'owner').
SELECT peran, aktif, count(*) AS jumlah
  FROM public.staf
 GROUP BY peran, aktif
 ORDER BY peran, aktif;

-- 4. Batas harga masih ada. Benar: harga_maks_menu = 200000
SELECT kunci, nilai
  FROM public.pengaturan
 WHERE kunci = 'harga_maks_menu';

-- 5. Tabel menu tidak tersentuh. Benar: jumlah = 0
SELECT count(*) AS jumlah_menu FROM public.menu;
