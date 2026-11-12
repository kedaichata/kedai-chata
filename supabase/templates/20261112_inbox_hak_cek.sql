-- supabase/templates/20261112_inbox_hak_cek.sql
-- Cek BACA-SAJA hak akses tabel dan fungsi inbox (bukti SEC-35 bagian hak tabel;
-- sekaligus bukti tambahan SEC-17 dan SEC-04 untuk tabel inbox).
-- Hanya SELECT. Tidak mengubah data atau hak. Tanpa data nyata.
-- Jalankan di SQL Editor (akun ketua), tempel hasilnya ke chat, lalu logout.
--
-- Hasil yang benar:
--   1 hak tabel       : anon = (tidak ada); authenticated = (tidak ada);
--                       service_role = INSERT, SELECT (tanpa DELETE, UPDATE, TRUNCATE).
--   2 RLS             : RLS aktif: true, jumlah policy: 0.
--   3 urutan nomor    : semua peran = (tidak ada).
--   4 fungsi inbox    : EXECUTE = ya hanya untuk service_role; anon dan authenticated = tidak.

WITH peran AS (
  SELECT unnest(ARRAY['anon', 'authenticated', 'service_role']) AS nama
),
hak AS (
  SELECT unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) AS jenis
),
hasil AS (
  -- 1. Hak tabel public.inbox per peran
  SELECT
    '1 hak tabel'::text AS bagian,
    p.nama::text        AS objek,
    coalesce(
      string_agg(h.jenis, ', ' ORDER BY h.jenis)
        FILTER (WHERE has_table_privilege(p.nama, 'public.inbox', h.jenis)),
      '(tidak ada)'
    )::text             AS hasil
  FROM peran p
  CROSS JOIN hak h
  GROUP BY p.nama

  UNION ALL

  -- 2. RLS aktif dan jumlah policy
  SELECT
    '2 RLS'::text,
    'public.inbox'::text,
    ('RLS aktif: ' || c.relrowsecurity::text
      || ', jumlah policy: '
      || (SELECT count(*) FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'inbox')::text)::text
  FROM pg_class c
  WHERE c.oid = 'public.inbox'::regclass

  UNION ALL

  -- 3. Hak pada urutan nomor otomatis kolom id
  SELECT
    '3 urutan nomor'::text,
    p.nama::text,
    coalesce(
      (SELECT string_agg(j.jenis, ', ' ORDER BY j.jenis)
       FROM (VALUES ('USAGE'), ('SELECT'), ('UPDATE')) AS j(jenis)
       WHERE pg_get_serial_sequence('public.inbox', 'id') IS NOT NULL
         AND has_sequence_privilege(p.nama, pg_get_serial_sequence('public.inbox', 'id'), j.jenis)),
      '(tidak ada)'
    )::text
  FROM peran p

  UNION ALL

  -- 4. Hak EXECUTE pada fungsi inbox per peran
  SELECT
    '4 fungsi inbox'::text,
    (f.proname || ' / ' || p.nama)::text,
    ('EXECUTE: ' || CASE WHEN has_function_privilege(p.nama, f.oid, 'EXECUTE') THEN 'ya' ELSE 'tidak' END)::text
  FROM pg_proc f
  JOIN pg_namespace n ON n.oid = f.pronamespace AND n.nspname = 'public'
  CROSS JOIN peran p
  WHERE f.proname IN ('inbox_tulis', 'inbox_daftar', 'inbox_terbaru')
)
SELECT bagian, objek, hasil
FROM hasil
ORDER BY bagian, objek;
