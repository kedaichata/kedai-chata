-- supabase/templates/20261111_05_inbox_cek.sql
-- Query BACA-SAJA untuk bukti INB.01 (SEC-03, SEC-04, SEC-17; SEC-35 bagian hak tabel). Aman dijalankan berulang.
-- Tempel hasil tiap bagian ke chat sebagai bukti (tidak disimpan di repo/md).
-- Jalankan SETELAH 20261111_05_inbox.sql berhasil. Jalankan satu bagian per kali bila editor
-- hanya menampilkan hasil bagian terakhir.

-- (1) RLS harus aktif di tabel inbox. Harapan: 1 baris, rls_aktif = true.
SELECT c.relname AS tabel, c.relrowsecurity AS rls_aktif
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'inbox';

-- (2) Policy di tabel inbox. Harapan: 0 baris (tanpa policy untuk aplikasi).
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'inbox';

-- (3) Hak tabel per peran. Harapan:
--   service_role = INSERT, SELECT (tanpa UPDATE dan tanpa DELETE)
--   anon dan authenticated = (tidak ada)
SELECT t.tabel, r.peran,
       coalesce(
         string_agg(p.hak, ', ' ORDER BY p.hak)
           FILTER (WHERE has_table_privilege(r.peran, format('public.%I', t.tabel), p.hak)),
         '(tidak ada)'
       ) AS hak
FROM (VALUES ('inbox')) AS t(tabel)
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(peran)
CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
                   ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS p(hak)
GROUP BY t.tabel, r.peran
ORDER BY t.tabel, r.peran;

-- (4) Hak pada urutan nomor otomatis `inbox.id`. Harapan: 9 baris, semua punya = false.
SELECT r.peran, p.hak,
       has_sequence_privilege(r.peran, pg_get_serial_sequence('public.inbox', 'id'), p.hak) AS punya
FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(peran)
CROSS JOIN (VALUES ('USAGE'), ('SELECT'), ('UPDATE')) AS p(hak)
ORDER BY r.peran, p.hak;

-- (5) Pengaturan baru. Harapan: 2 baris
--     inbox_maks_tampil = 30, inbox_simpan_hari = 14.
SELECT kunci, nilai
FROM public.pengaturan
WHERE kunci IN ('inbox_simpan_hari', 'inbox_maks_tampil')
ORDER BY kunci;

-- (6) Jumlah pagar tabel (p = primary key, f = foreign key, u = unik, c = pagar isian).
--     Harapan: inbox : c=1, f=2, p=1
SELECT cl.relname AS tabel, k.contype AS jenis, count(*) AS jumlah
FROM pg_constraint k
JOIN pg_class cl ON cl.oid = k.conrelid
JOIN pg_namespace n ON n.oid = cl.relnamespace
WHERE n.nspname = 'public'
  AND cl.relname = 'inbox'
  AND k.contype IN ('p', 'f', 'u', 'c')
GROUP BY cl.relname, k.contype
ORDER BY cl.relname, k.contype;

-- (7) Indeks. Harapan: 2 baris (inbox_penerima_idx, inbox_pkey).
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'inbox'
ORDER BY indexname;

-- (8) Kolom tabel inbox. Harapan: 5 baris (id, penerima, teks, nomor_order, waktu);
--     nomor_order = boleh kosong (YES), lainnya NO.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'inbox'
ORDER BY ordinal_position;

-- (9) Tabel baru masih kosong. Harapan: jumlah = 0.
SELECT 'inbox' AS tabel, count(*) AS jumlah FROM public.inbox;
