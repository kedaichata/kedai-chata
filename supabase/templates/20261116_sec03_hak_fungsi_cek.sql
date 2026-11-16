-- supabase/templates/20261116_sec03_hak_fungsi_cek.sql
-- SEC-03: cek hak EXECUTE fungsi di skema public, dan pengaturan keamanan fungsi.
-- Hanya SELECT (baca-saja). Tanpa data nyata. Jalankan di SQL Editor (akun ketua).
-- has_function_privilege sudah memperhitungkan hak lewat PUBLIC.

select
  p.proname as fungsi,
  pg_get_function_identity_arguments(p.oid) as argumen,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_bisa,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_bisa,
  has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_bisa,
  p.prosecdef as security_definer,
  coalesce(array_to_string(p.proconfig, ', '), '(kosong)') as konfigurasi
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and not exists (
    select 1 from pg_depend d
    where d.objid = p.oid and d.deptype = 'e'
  )
order by p.proname, argumen;
