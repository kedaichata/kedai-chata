-- supabase/templates/20261107_menu_cek.sql
-- Cek BACA-SAJA setelah 20261107_menu.sql dijalankan (MNU.01). Tanpa data nyata.
-- Jalankan satu per satu di SQL Editor, tempel hasilnya ke chat sebagai bukti.
-- Tidak ada perintah yang mengubah data.

-- 1. RLS aktif. Harapan: rls_aktif = true
SELECT relname AS tabel, relrowsecurity AS rls_aktif
FROM pg_class
WHERE oid = 'public.menu'::regclass;

-- 2. Tanpa policy untuk aplikasi. Harapan: jumlah_policy = 0
SELECT count(*) AS jumlah_policy
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'menu';

-- 3. Hak per peran. Harapan:
--    service_role: SELECT, INSERT, UPDATE = true; DELETE, TRUNCATE, REFERENCES, TRIGGER = false
--    anon dan authenticated: semuanya false
SELECT r.peran, p.hak, has_table_privilege(r.peran, 'public.menu', p.hak) AS punya
FROM unnest(ARRAY['anon', 'authenticated', 'service_role']) AS r(peran)
CROSS JOIN unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) AS p(hak)
ORDER BY r.peran, p.hak;

-- 4. Kolom. Harapan: id, nama, harga, tersedia, aktif, foto, dibuat_pada, diubah_pada, diubah_oleh
--    (foto boleh kosong; kolom lain tidak boleh kosong)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'menu'
ORDER BY ordinal_position;

-- 5. Aturan di tabel. Harapan: menu_foto_cek, menu_harga_cek, menu_nama_cek,
--    kunci utama, dan kunci asing ke staf
SELECT conname, pg_get_constraintdef(oid) AS aturan
FROM pg_constraint
WHERE conrelid = 'public.menu'::regclass
ORDER BY conname;

-- 6. Indeks. Harapan: kunci utama dan menu_nama_aktif_uniq (unik, hanya menu aktif)
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'menu'
ORDER BY indexname;

-- 7. Pengaturan. Harapan: harga_maks_menu = 200000
SELECT kunci, nilai, keterangan
FROM public.pengaturan
WHERE kunci = 'harga_maks_menu';

-- 8. Tabel masih kosong. Harapan: jumlah_menu = 0
SELECT count(*) AS jumlah_menu FROM public.menu;
