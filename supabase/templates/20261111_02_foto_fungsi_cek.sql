-- supabase/templates/20261111_02_foto_fungsi_cek.sql
-- Cek baca-saja untuk migration 20261111_02_foto_fungsi.sql (FTO.02). Hanya SELECT, tanpa data nyata.
-- Jalankan di SQL Editor (akun ketua), jalankan satu per satu, tempel hasilnya ke chat.

-- 1. Tiga fungsi ada, SECURITY DEFINER = true, search_path kosong.
--    Harapan: 3 baris, aman = true, search_path_kosong = true.
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS argumen,
       p.prosecdef AS aman,
       (p.proconfig IS NOT NULL AND 'search_path=""' = ANY (p.proconfig)) AS search_path_kosong
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('foto_cek_unggah', 'foto_catat', 'foto_lihat_cek')
 ORDER BY p.proname;

-- 2. Hak EXECUTE. Harapan: hanya service_role = true; anon, authenticated, dan PUBLIC false.
SELECT p.proname,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated,
       has_function_privilege('service_role', p.oid, 'EXECUTE')  AS service_role,
       (SELECT bool_or(a.grantee = 0)
          FROM aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a) AS public_dapat
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('foto_cek_unggah', 'foto_catat', 'foto_lihat_cek')
 ORDER BY p.proname;

-- 3. Pengaturan foto. Harapan: foto_tautan_detik = 300; foto_maks_kb = 150; foto_simpan_hari = 14.
SELECT *
  FROM public.pengaturan
 WHERE kunci IN ('foto_tautan_detik', 'foto_maks_kb', 'foto_simpan_hari')
 ORDER BY kunci;

-- 4. Hak tabel foto_bukti tidak berubah. Harapan: service_role hanya INSERT, SELECT, UPDATE; anon dan
--    authenticated tidak muncul.
SELECT grantee, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND table_name = 'foto_bukti'
 ORDER BY grantee, privilege_type;

-- 5. Belum ada foto tercatat sebelum aksi diuji. Harapan: 0 sebelum uji pertama.
SELECT count(*) AS jumlah_baris_foto FROM public.foto_bukti;
