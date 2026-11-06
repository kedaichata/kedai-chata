-- supabase/templates/20261106_alamat_cek.sql
-- Query cek BACA-SAJA untuk AKN.07 (bukti SEC-04 untuk fungsi baru). Tanpa data pribadi.
-- Jalankan SETELAH 20261106_alamat.sql. Tempel hasilnya ke chat untuk diperiksa bersama.
-- Kolom isi_pengaturan hanya untuk dilihat (harus memuat search_path dengan nilai kosong).
-- Hasil yang benar: 2 baris; security_definer = true; search_path_kosong = true;
-- anon = false; authenticated = false; public_bisa = false; service_role = true.

SELECT
  p.proname                                         AS fungsi,
  p.prosecdef                                       AS security_definer,
  coalesce('search_path=""' = ANY (p.proconfig), false)      AS search_path_kosong,
  p.proconfig::text                                         AS isi_pengaturan,
  has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated,
  has_function_privilege('service_role', p.oid, 'EXECUTE')  AS service_role,
  EXISTS (
    SELECT 1 FROM aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    WHERE a.grantee = 0 AND a.privilege_type = 'EXECUTE'
  )                                                 AS public_bisa
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('alamat_simpan', 'alamat_nonaktif')
ORDER BY p.proname;
