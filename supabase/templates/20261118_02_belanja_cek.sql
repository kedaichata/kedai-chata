-- supabase/templates/20261118_02_belanja_cek.sql
-- Query CEK baca-saja untuk BLJ.01. Hanya SELECT. Jalankan di SQL Editor (akun ketua),
-- tempel hasilnya ke chat sebagai bukti. Tanpa data nyata.

-- A. Kedua tabel ada dan RLS aktif (harapan: dua baris, rls_aktif = true)
SELECT c.relname AS tabel, c.relrowsecurity AS rls_aktif
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relname IN ('belanja', 'belanja_item')
 ORDER BY c.relname;

-- B. Tidak ada policy (harapan: 0 baris)
SELECT schemaname, tablename, policyname
  FROM pg_policies
 WHERE schemaname = 'public' AND tablename IN ('belanja', 'belanja_item');

-- C. Hak per peran (harapan: service_role hanya INSERT, SELECT, UPDATE; anon dan authenticated tidak muncul)
SELECT table_name AS tabel, grantee AS peran, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS hak
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND table_name IN ('belanja', 'belanja_item')
   AND grantee IN ('anon', 'authenticated', 'service_role', 'PUBLIC')
 GROUP BY table_name, grantee
 ORDER BY table_name, grantee;

-- D. Pagar tabel (harapan: constraint belanja_judul_cek, belanja_nama_penginput_cek, belanja_kunci_cek,
--    belanja_item_nama_cek, belanja_item_harga_cek)
SELECT conrelid::regclass AS tabel, conname AS pagar, pg_get_constraintdef(oid) AS isi
  FROM pg_constraint
 WHERE conrelid IN ('public.belanja'::regclass, 'public.belanja_item'::regclass)
   AND contype = 'c'
 ORDER BY conrelid::regclass::text, conname;

-- E. Kunci asing (harapan: belanja.penginput -> staf, belanja_item.belanja_id -> belanja)
SELECT conrelid::regclass AS tabel, conname AS nama, pg_get_constraintdef(oid) AS isi
  FROM pg_constraint
 WHERE conrelid IN ('public.belanja'::regclass, 'public.belanja_item'::regclass)
   AND contype = 'f'
 ORDER BY conrelid::regclass::text, conname;

-- F. Lima pengaturan baru (harapan: lima baris, nilai 5000000, 60, 60, 50, 10)
SELECT kunci, nilai
  FROM public.pengaturan
 WHERE kunci LIKE 'belanja\_%'
 ORDER BY kunci;

-- G. Kedua tabel masih kosong sesudah dipasang (harapan: 0 dan 0)
SELECT (SELECT count(*) FROM public.belanja) AS jumlah_belanja,
       (SELECT count(*) FROM public.belanja_item) AS jumlah_item;
