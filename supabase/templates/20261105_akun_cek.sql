-- supabase/templates/20261105_akun_cek.sql
-- Query BACA-SAJA untuk bukti AKN.03 (SEC-03, SEC-04). Aman dijalankan berulang.
-- Tempel hasil tiap bagian ke chat sebagai bukti (tidak disimpan di repo/md).

-- (1) RLS harus aktif di keempat tabel. Harapan: rls_aktif = true semua.
SELECT c.relname AS tabel, c.relrowsecurity AS rls_aktif
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('pengaturan', 'profil', 'alamat', 'staf')
ORDER BY c.relname;

-- (2) Policy. Harapan: 0 baris (tanpa policy untuk aplikasi).
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('pengaturan', 'profil', 'alamat', 'staf');

-- (3) Hak tabel per peran. Harapan:
--   pengaturan : service_role = SELECT
--   staf       : service_role = SELECT
--   profil     : service_role = INSERT, SELECT, UPDATE
--   alamat     : service_role = INSERT, SELECT, UPDATE
--   anon dan authenticated di semua tabel = (tidak ada); tidak ada DELETE di mana pun.
SELECT t.tabel, r.peran,
       coalesce(
         string_agg(p.hak, ', ' ORDER BY p.hak)
           FILTER (WHERE has_table_privilege(r.peran, format('public.%I', t.tabel), p.hak)),
         '(tidak ada)'
       ) AS hak
FROM (VALUES ('pengaturan'), ('profil'), ('alamat'), ('staf')) AS t(tabel)
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(peran)
CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
                   ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS p(hak)
GROUP BY t.tabel, r.peran
ORDER BY t.tabel, r.peran;

-- (4) Fungsi buat_profil. Harapan: aman_definer = true, search_path kosong,
--     anon = false, authenticated = false, service_role = true.
SELECT p.proname,
       p.prosecdef AS aman_definer,
       p.proconfig AS pengaturan_fungsi,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated,
       has_function_privilege('service_role', p.oid, 'EXECUTE')  AS service_role
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'buat_profil';

-- (5) Baris awal pengaturan. Harapan: alamat_maks = 5.
SELECT kunci, nilai FROM public.pengaturan ORDER BY kunci;
