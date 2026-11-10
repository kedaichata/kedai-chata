-- supabase/templates/20261110_07_bantuan_cek.sql
-- Query BACA-SAJA untuk bukti BTN.01 (SEC-03, SEC-04, SEC-31 bagian hak tabel). Aman dijalankan berulang.
-- Tempel hasil tiap bagian ke chat sebagai bukti (tidak disimpan di repo/md).

-- (1) RLS harus aktif. Harapan: rls_aktif = true.
SELECT c.relname AS tabel, c.relrowsecurity AS rls_aktif
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'bantuan';

-- (2) Policy. Harapan: 0 baris (tanpa policy untuk aplikasi).
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'bantuan';

-- (3) Hak tabel per peran. Harapan:
--   service_role = SELECT
--   anon dan authenticated = (tidak ada); tidak ada INSERT, UPDATE, atau DELETE di mana pun.
SELECT t.tabel, r.peran,
       coalesce(
         string_agg(p.hak, ', ' ORDER BY p.hak)
           FILTER (WHERE has_table_privilege(r.peran, format('public.%I', t.tabel), p.hak)),
         '(tidak ada)'
       ) AS hak
FROM (VALUES ('bantuan')) AS t(tabel)
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(peran)
CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
                   ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS p(hak)
GROUP BY t.tabel, r.peran
ORDER BY t.tabel, r.peran;

-- (4) Kolom. Harapan: id, kunci, bagian, urutan, peran, judul, isi, aktif, diubah_pada; semua NOT NULL.
SELECT column_name AS kolom, data_type AS tipe, is_nullable AS boleh_kosong, column_default AS bawaan
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bantuan'
ORDER BY ordinal_position;

-- (5) Pagar (konstrain). Harapan: bantuan_pkey, bantuan_kunci_unik, dan lima konstrain cek
--     (kunci, bagian, urutan, peran, judul, isi) sesuai berkas migration.
SELECT conname AS konstrain, pg_get_constraintdef(oid) AS aturan
FROM pg_constraint
WHERE conrelid = 'public.bantuan'::regclass
ORDER BY conname;

-- (6) Isi tabel. Harapan sebelum impor pertama: 0.
SELECT count(*) AS jumlah_baris FROM public.bantuan;
