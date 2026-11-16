-- supabase/templates/20261116_sec03_rls_auto_enable_cek.sql
-- SEC-03: periksa fungsi public.rls_auto_enable (tipe kembalian, pemilik, pemakai, ACL).
-- Hanya SELECT (baca-saja). Tanpa data nyata. Jalankan di SQL Editor (akun ketua).

select
  p.proname as fungsi,
  pg_get_function_result(p.oid) as tipe_hasil,
  pg_get_userbyid(p.proowner) as pemilik,
  p.prosecdef as security_definer,
  (select string_agg(e.evtname || ' [' || e.evtevent || ', status=' || e.evtenabled::text || ']', ', ')
     from pg_event_trigger e
    where e.evtfoid = p.oid) as dipakai_event_trigger,
  coalesce(p.proacl::text, '(bawaan)') as acl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'rls_auto_enable';
