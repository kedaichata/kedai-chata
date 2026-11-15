-- supabase/templates/20261115_staf_nomor_wa_cek.sql
-- Cek WAG.01 (migration 20261115_staf_nomor_wa.sql). HANYA SELECT, aman dijalankan berulang.
-- Jalankan di SQL Editor (akun ketua), lalu tempel hasil tiap bagian ke chat sebagai bukti.
-- Tanpa data nyata. Query ini tidak menampilkan isi nomor, hanya jumlahnya.
--
-- Hasil yang benar:
--   A. enam kolom; nomor_wa bertipe text, is_nullable = YES, tanpa nilai bawaan.
--   B. constraint staf_wa_cek dengan definisi: nomor_wa IS NULL OR nomor_wa ~ '^628[0-9]{8,11}$'
--      (plus constraint lama: primary key, foreign key id, staf_nama_cek, staf_peran_cek).
--   C. service_role hanya SELECT. Tidak ada baris PUBLIC, anon, atau authenticated.
--      (Baris pemilik tabel, yaitu postgres, memang muncul dan tidak masalah.)
--   D. ketiga kolom bernilai false/false/false (anon tidak punya hak apa pun, authenticated tidak punya
--      hak apa pun, service_role tidak punya INSERT/UPDATE/DELETE).
--   E. rls_aktif = true dan jumlah_policy = 0 (tidak berubah dari AKN.03).
--   F. staf_total sama dengan jumlah staf sebelumnya; staf_nomor_terisi = 0 sebelum WAG.06.
--   G. tidak ada hak tingkat kolom di nomor_wa untuk anon atau authenticated (hasil kosong).

-- A. Kolom
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'staf'
 ORDER BY ordinal_position;

-- B. Constraint
SELECT conname AS nama, pg_get_constraintdef(oid) AS definisi
  FROM pg_constraint
 WHERE conrelid = 'public.staf'::regclass
 ORDER BY conname;

-- C. Hak tabel per penerima
SELECT CASE WHEN x.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END AS penerima,
       string_agg(x.privilege_type, ', ' ORDER BY x.privilege_type)               AS hak
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace,
       LATERAL aclexplode(c.relacl) x
 WHERE n.nspname = 'public'
   AND c.relname = 'staf'
 GROUP BY 1
 ORDER BY 1;

-- D. Pemeriksaan langsung (harus false, false, false)
SELECT has_table_privilege('anon', t, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')          AS anon_punya_hak,
       has_table_privilege('authenticated', t, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS authenticated_punya_hak,
       has_table_privilege('service_role', t, 'INSERT,UPDATE,DELETE')                                      AS service_role_punya_tulis
  FROM (SELECT 'public.staf'::regclass AS t) x;

-- E. RLS dan policy
SELECT c.relname AS tabel, c.relrowsecurity AS rls_aktif,
       (SELECT count(*) FROM pg_policies p
         WHERE p.schemaname = 'public' AND p.tablename = 'staf') AS jumlah_policy
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND c.relname = 'staf';

-- F. Jumlah baris (tanpa menampilkan nomor)
SELECT count(*)                                  AS staf_total,
       count(*) FILTER (WHERE nomor_wa IS NOT NULL) AS staf_nomor_terisi
  FROM public.staf;

-- G. Hak tingkat kolom pada nomor_wa (harus kosong)
SELECT grantee, privilege_type
  FROM information_schema.column_privileges
 WHERE table_schema = 'public'
   AND table_name = 'staf'
   AND column_name = 'nomor_wa'
   AND grantee IN ('anon', 'authenticated');
