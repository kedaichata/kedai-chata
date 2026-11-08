-- supabase/templates/20261108_order_cek.sql
-- Query BACA-SAJA untuk bukti ORD.01 (SEC-03, SEC-04, SEC-17). Aman dijalankan berulang.
-- Tempel hasil tiap bagian ke chat sebagai bukti (tidak disimpan di repo/md).
-- Tabel `order` ditulis dengan tanda kutip ganda di SQL; di hasil tampil biasa sebagai order.

-- (1) RLS harus aktif di keenam tabel. Harapan: rls_aktif = true semua (6 baris).
SELECT c.relname AS tabel, c.relrowsecurity AS rls_aktif
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('pelanggan_luar', 'order', 'order_item', 'riwayat_status',
                    'catatan_order', 'baca_catatan')
ORDER BY c.relname;

-- (2) Policy. Harapan: 0 baris (tanpa policy untuk aplikasi).
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('pelanggan_luar', 'order', 'order_item', 'riwayat_status',
                    'catatan_order', 'baca_catatan');

-- (3) Hak tabel per peran. Harapan:
--   order, baca_catatan, pelanggan_luar    : service_role = INSERT, SELECT, UPDATE
--   order_item, riwayat_status, catatan_order : service_role = INSERT, SELECT
--   anon dan authenticated di semua tabel = (tidak ada); tidak ada DELETE di mana pun.
SELECT t.tabel, r.peran,
       coalesce(
         string_agg(p.hak, ', ' ORDER BY p.hak)
           FILTER (WHERE has_table_privilege(r.peran, format('public.%I', t.tabel), p.hak)),
         '(tidak ada)'
       ) AS hak
FROM (VALUES ('order'), ('order_item'), ('riwayat_status'), ('catatan_order'),
             ('baca_catatan'), ('pelanggan_luar')) AS t(tabel)
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(peran)
CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
                   ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS p(hak)
GROUP BY t.tabel, r.peran
ORDER BY t.tabel, r.peran;

-- (4) Urutan nomor otomatis (nomor order, id riwayat, id catatan).
--     Harapan: semua kolom hak = false untuk anon, authenticated, dan service_role.
SELECT s.urutan, r.peran,
       has_sequence_privilege(r.peran, s.nama, 'USAGE')  AS hak_usage,
       has_sequence_privilege(r.peran, s.nama, 'SELECT') AS hak_select,
       has_sequence_privilege(r.peran, s.nama, 'UPDATE') AS hak_update
FROM (VALUES
       ('order.nomor',           pg_get_serial_sequence('public."order"', 'nomor')),
       ('riwayat_status.id',     pg_get_serial_sequence('public.riwayat_status', 'id')),
       ('catatan_order.id',      pg_get_serial_sequence('public.catatan_order', 'id'))
     ) AS s(urutan, nama)
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(peran)
ORDER BY s.urutan, r.peran;

-- (5) Pengaturan baru. Harapan: 4 baris
--     catatan_maks_karakter = 200, catatan_maks_per_order = 10,
--     item_maks_per_order = 10, jumlah_maks_per_item = 10.
SELECT kunci, nilai
FROM public.pengaturan
WHERE kunci IN ('item_maks_per_order', 'jumlah_maks_per_item',
                'catatan_maks_karakter', 'catatan_maks_per_order')
ORDER BY kunci;

-- (6) Jumlah pagar per tabel (primary key, foreign key, unik, pagar isian).
--     Harapan (p = primary key, f = foreign key, u = unik, c = pagar isian):
--       baca_catatan   : p=1, f=3
--       catatan_order  : p=1, f=2, c=3
--       order          : p=1, f=4, u=1, c=14
--       order_item     : p=1, f=2, c=5
--       pelanggan_luar : p=1, f=1, c=4
--       riwayat_status : p=1, f=2, c=3
SELECT cl.relname AS tabel, k.contype AS jenis, count(*) AS jumlah
FROM pg_constraint k
JOIN pg_class cl ON cl.oid = k.conrelid
JOIN pg_namespace n ON n.oid = cl.relnamespace
WHERE n.nspname = 'public'
  AND cl.relname IN ('pelanggan_luar', 'order', 'order_item', 'riwayat_status',
                     'catatan_order', 'baca_catatan')
  AND k.contype IN ('p', 'f', 'u', 'c')
GROUP BY cl.relname, k.contype
ORDER BY cl.relname, k.contype;

-- (7) Kolom pilihan di order_item. Harapan: 1 baris, tipe ARRAY, tidak boleh kosong (NO).
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'order_item' AND column_name = 'pilihan';

-- (8) Semua tabel baru masih kosong. Harapan: jumlah = 0 di keenam baris.
SELECT 'order' AS tabel, count(*) AS jumlah FROM public."order"
UNION ALL SELECT 'order_item',      count(*) FROM public.order_item
UNION ALL SELECT 'riwayat_status',  count(*) FROM public.riwayat_status
UNION ALL SELECT 'catatan_order',   count(*) FROM public.catatan_order
UNION ALL SELECT 'baca_catatan',    count(*) FROM public.baca_catatan
UNION ALL SELECT 'pelanggan_luar',  count(*) FROM public.pelanggan_luar;
