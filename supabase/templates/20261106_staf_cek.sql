-- supabase/templates/20261106_staf_cek.sql
-- Query BACA-SAJA untuk bukti AKN.10 (SEC-26). Aman dijalankan berulang, tanpa isian.
-- Tempel hasil tiap bagian ke chat sebagai bukti (tidak disimpan di repo/md).
-- Nama dan email staf SENGAJA tidak ditampilkan, dan ID hanya 8 karakter pertama,
-- supaya hasilnya aman ditempel ke chat.

-- (1) Daftar staf. Harapan: tiap akun yang baru ditambah muncul dengan peran benar;
--     yang baru dinonaktifkan muncul dengan aktif = false (baris tidak hilang).
SELECT left(id::text, 8) AS id_pendek, peran, aktif, dibuat_pada
FROM public.staf
ORDER BY dibuat_pada, peran;

-- (2) Ringkasan per peran. Harapan: sesuai jumlah staf yang sengaja dibuat
--     (akun uji: 1 owner dan 1 penjaga aktif).
SELECT peran,
       count(*) FILTER (WHERE aktif)     AS aktif,
       count(*) FILTER (WHERE NOT aktif) AS nonaktif
FROM public.staf
GROUP BY peran
ORDER BY peran;

-- (3) Staf yang juga punya profil customer (melanggar AK4). Harapan: 0 baris.
SELECT left(s.id::text, 8) AS id_pendek, s.peran
FROM public.staf s
JOIN public.profil p ON p.id = s.id;

-- (4) RLS dan policy tabel staf. Harapan: rls_aktif = true, jumlah_policy = 0.
SELECT c.relname AS tabel,
       c.relrowsecurity AS rls_aktif,
       (SELECT count(*) FROM pg_policies
         WHERE schemaname = 'public' AND tablename = 'staf') AS jumlah_policy
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'staf';

-- (5) Hak tabel staf per peran. Harapan:
--   service_role = SELECT
--   anon dan authenticated = (tidak ada); tidak ada DELETE di mana pun.
SELECT r.peran,
       coalesce(
         string_agg(p.hak, ', ' ORDER BY p.hak)
           FILTER (WHERE has_table_privilege(r.peran, 'public.staf', p.hak)),
         '(tidak ada)'
       ) AS hak
FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(peran)
CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
                   ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS p(hak)
GROUP BY r.peran
ORDER BY r.peran;
