-- supabase/templates/20261112_02_langganan_push_fungsi_cek.sql
-- Cek BACA-SAJA (hanya SELECT) setelah migration 20261112_02_langganan_push_fungsi.sql dijalankan.
-- Jalankan di SQL Editor (akun ketua), tempel semua hasilnya ke chat. Tanpa data nyata.

-- A. Kedua fungsi ada, SECURITY DEFINER = true, search_path kosong.
--    Harapan: 2 baris; prosecdef = true; proconfig memuat search_path="" .
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS argumen,
       p.prosecdef,
       p.proconfig
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('push_daftar', 'push_nonaktifkan')
 ORDER BY p.proname;

-- B. Hak EXECUTE per peran.
--    Harapan: service_role = true; anon = false; authenticated = false.
SELECT f.nama,
       r.peran,
       has_function_privilege(r.peran, f.oid, 'EXECUTE') AS boleh_execute
  FROM (VALUES
         ('push_daftar',      'public.push_daftar(uuid,text,text,text)'::regprocedure),
         ('push_nonaktifkan', 'public.push_nonaktifkan(uuid,text)'::regprocedure)
       ) AS f(nama, oid)
 CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(peran)
 ORDER BY f.nama, r.peran;

-- C. Daftar hak langsung pada fungsi (PUBLIC tidak boleh punya).
--    Harapan: acl hanya memuat service_role (dan pemilik); tanpa entri kosong sebelum "=" (itu PUBLIC).
SELECT p.proname,
       p.proacl::text AS acl
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('push_daftar', 'push_nonaktifkan')
 ORDER BY p.proname;

-- D. Hak tabel langganan_push TIDAK berubah.
--    Harapan: service_role hanya INSERT, SELECT, UPDATE; anon dan authenticated tidak muncul.
SELECT grantee, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND table_name = 'langganan_push'
   AND grantee IN ('anon', 'authenticated', 'service_role')
 ORDER BY grantee, privilege_type;

-- E. Pengaturan batas perangkat masih 5.
--    Harapan: 1 baris, nilai 5.
SELECT kunci, nilai
  FROM public.pengaturan
 WHERE kunci = 'push_maks_perangkat';
