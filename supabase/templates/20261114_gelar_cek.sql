-- supabase/templates/20261114_gelar_cek.sql
-- Cek GLR.01 (BACA-SAJA, hanya SELECT). Jalankan SETELAH 20261114_gelar.sql.
-- Jalankan satu per satu (blok A sampai G), tempel hasilnya ke chat sebagai bukti.
-- Tanpa data nyata.

-- A. RLS aktif?  Hasil benar: relrowsecurity = true
SELECT c.relname, c.relrowsecurity AS rls_aktif
FROM pg_class c
WHERE c.oid = 'public.gelar'::regclass;

-- B. Jumlah policy.  Hasil benar: 0
SELECT count(*) AS jumlah_policy
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'gelar';

-- C. Hak per peran.
--    Hasil benar: service_role hanya SELECT = true; semua lainnya false; anon dan authenticated false semua.
SELECT r.peran,
       has_table_privilege(r.peran, 'public.gelar', 'SELECT') AS can_select,
       has_table_privilege(r.peran, 'public.gelar', 'INSERT') AS can_insert,
       has_table_privilege(r.peran, 'public.gelar', 'UPDATE') AS can_update,
       has_table_privilege(r.peran, 'public.gelar', 'DELETE') AS can_delete
FROM (VALUES ('service_role'), ('anon'), ('authenticated')) AS r(peran);

-- D. Pagar bentuk data (CHECK, UNIQUE, FOREIGN KEY).
--    Hasil benar: gelar_kunci_cek, gelar_jenis_cek, gelar_ambang_cek, gelar_nama_cek,
--    gelar_deskripsi_cek, gelar_jenis_menu_cek, gelar_kunci_unik, FK ke menu, dan primary key.
SELECT conname, pg_get_constraintdef(oid) AS definisi
FROM pg_constraint
WHERE conrelid = 'public.gelar'::regclass
ORDER BY contype, conname;

-- E. Indeks.  Hasil benar: gelar_tingkat_ambang_aktif_uniq (UNIQUE, sebagian) dan gelar_menu_aktif_idx
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'gelar'
ORDER BY indexname;

-- F. Baris pengaturan apresiasi.  Hasil benar: satu baris, nilai = kalimat GL16
SELECT kunci, nilai, keterangan
FROM public.pengaturan
WHERE kunci = 'gelar_apresiasi';

-- G. Tabel masih kosong.  Hasil benar: 0
SELECT count(*) AS jumlah_baris FROM public.gelar;
