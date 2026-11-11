-- supabase/templates/20261111_foto_bukti_cek.sql
-- Query BACA-SAJA untuk bukti FTO.01 (SEC-03, SEC-04, SEC-17, SEC-20). Aman dijalankan berulang.
-- Tempel hasil tiap bagian ke chat sebagai bukti (tidak disimpan di repo/md).
-- Jalankan SETELAH 20261111_foto_bukti.sql berhasil. Jalankan satu bagian per kali bila editor
-- hanya menampilkan hasil bagian terakhir.

-- (1) RLS harus aktif di tabel foto_bukti. Harapan: 1 baris, rls_aktif = true.
SELECT c.relname AS tabel, c.relrowsecurity AS rls_aktif
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'foto_bukti';

-- (2) Policy di tabel foto_bukti. Harapan: 0 baris (tanpa policy untuk aplikasi).
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'foto_bukti';

-- (3) Hak tabel per peran. Harapan:
--   service_role = INSERT, SELECT, UPDATE
--   anon dan authenticated = (tidak ada); tidak ada DELETE di mana pun.
SELECT t.tabel, r.peran,
       coalesce(
         string_agg(p.hak, ', ' ORDER BY p.hak)
           FILTER (WHERE has_table_privilege(r.peran, format('public.%I', t.tabel), p.hak)),
         '(tidak ada)'
       ) AS hak
FROM (VALUES ('foto_bukti')) AS t(tabel)
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(peran)
CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
                   ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS p(hak)
GROUP BY t.tabel, r.peran
ORDER BY t.tabel, r.peran;

-- (4) Pengaturan baru. Harapan: 2 baris
--     foto_maks_kb = 150, foto_simpan_hari = 14.
SELECT kunci, nilai
FROM public.pengaturan
WHERE kunci IN ('foto_simpan_hari', 'foto_maks_kb')
ORDER BY kunci;

-- (5) Jumlah pagar tabel (p = primary key, f = foreign key, u = unik, c = pagar isian).
--     Harapan: foto_bukti : p=1, f=2, u=1, c=2
SELECT cl.relname AS tabel, k.contype AS jenis, count(*) AS jumlah
FROM pg_constraint k
JOIN pg_class cl ON cl.oid = k.conrelid
JOIN pg_namespace n ON n.oid = cl.relnamespace
WHERE n.nspname = 'public'
  AND cl.relname = 'foto_bukti'
  AND k.contype IN ('p', 'f', 'u', 'c')
GROUP BY cl.relname, k.contype
ORDER BY cl.relname, k.contype;

-- (6) Indeks. Harapan: 5 baris (foto_bukti_aktif_unik, foto_bukti_belum_bersih_idx,
--     foto_bukti_lokasi_unik, foto_bukti_order_idx, foto_bukti_pkey).
--     Definisi foto_bukti_aktif_unik harus berisi UNIQUE dan WHERE (diganti = false).
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'foto_bukti'
ORDER BY indexname;

-- (7) Semua bucket Storage. Harapan: 1 baris saja:
--     id = foto-bukti, public = false, file_size_limit = 262144,
--     allowed_mime_types = {image/jpeg,image/webp}.
--     Bila ada bucket lain, JANGAN lanjut: laporkan ke chat (bucket foto menu sudah dibatalkan).
SELECT id, public, file_size_limit, allowed_mime_types
FROM storage.buckets
ORDER BY id;

-- (8) Policy di storage.objects. Harapan: 0 baris (tanpa policy untuk aplikasi, FT5).
--     Bila ada baris, tempel ke chat untuk diperiksa sebelum lanjut.
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- (9) RLS di storage.objects. Harapan: 1 baris, rls_aktif = true.
SELECT c.relname AS tabel, c.relrowsecurity AS rls_aktif
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'storage'
  AND c.relname = 'objects';

-- (10) Tabel baru masih kosong. Harapan: jumlah = 0.
SELECT 'foto_bukti' AS tabel, count(*) AS jumlah FROM public.foto_bukti;
