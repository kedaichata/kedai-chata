-- supabase/templates/20261116_sec04_hak_tabel_cek.sql
-- SEC-04 dan SEC-03: cek RLS, policy, dan hak tiap tabel di skema public.
-- Hanya SELECT (baca-saja). Tanpa data nyata. Jalankan di SQL Editor (akun ketua).

select
  c.relname as tabel,
  c.relrowsecurity as rls_aktif,
  (select count(*)
     from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as jumlah_policy,
  coalesce((select string_agg(g.privilege_type, ', ' order by g.privilege_type)
              from information_schema.role_table_grants g
             where g.table_schema = 'public'
               and g.table_name = c.relname
               and g.grantee = 'service_role'), '(tidak ada)') as hak_service_role,
  coalesce((select string_agg(distinct g.grantee || ':' || g.privilege_type, ', ')
              from information_schema.role_table_grants g
             where g.table_schema = 'public'
               and g.table_name = c.relname
               and g.grantee in ('anon', 'authenticated')), '(tidak ada)') as hak_anon_authenticated
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;
