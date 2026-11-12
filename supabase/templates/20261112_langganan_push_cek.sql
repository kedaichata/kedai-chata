-- supabase/templates/20261112_langganan_push_cek.sql
-- Cek NTF.02 (migration 20261112_langganan_push.sql). HANYA SELECT, aman dijalankan berulang.
-- Jalankan di SQL Editor (akun ketua), lalu tempel hasil tiap bagian ke chat sebagai bukti.
-- Tanpa data nyata. Tabelnya baru dan masih kosong sampai NTF.03.
--
-- Hasil yang benar:
--   A. relrowsecurity = true.
--   B. jumlah policy = 0.
--   C. service_role hanya INSERT, SELECT, UPDATE. Tidak ada baris PUBLIC, anon, atau authenticated.
--      (Baris pemilik tabel, yaitu postgres, memang muncul dan tidak masalah.)
--   D. ketiga kolom bernilai false (anon tidak punya hak, authenticated tidak punya hak,
--      service_role tidak punya DELETE).
--   E. satu baris: push_maks_perangkat = 5.
--   F. delapan kolom sesuai migration.
--   G. constraint: primary key, unique endpoint, foreign key akun, tiga check.
--   H. indeks: pkey, unik endpoint, dan langganan_push_akun_aktif_idx.

-- A. RLS aktif
SELECT c.relname AS tabel, c.relrowsecurity AS rls_aktif
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND c.relname = 'langganan_push';

-- B. Jumlah policy (harus 0)
SELECT count(*) AS jumlah_policy
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename = 'langganan_push';

-- C. Hak tabel per penerima
SELECT CASE WHEN x.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END AS penerima,
       string_agg(x.privilege_type, ', ' ORDER BY x.privilege_type)               AS hak
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace,
       LATERAL aclexplode(c.relacl) x
 WHERE n.nspname = 'public'
   AND c.relname = 'langganan_push'
 GROUP BY 1
 ORDER BY 1;

-- D. Pemeriksaan langsung (harus false, false, false)
SELECT has_table_privilege('anon', t, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')          AS anon_punya_hak,
       has_table_privilege('authenticated', t, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS authenticated_punya_hak,
       has_table_privilege('service_role', t, 'DELETE')                                                    AS service_role_punya_delete
  FROM (SELECT 'public.langganan_push'::regclass AS t) x;

-- E. Pengaturan
SELECT kunci, nilai, keterangan
  FROM public.pengaturan
 WHERE kunci = 'push_maks_perangkat';

-- F. Kolom
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'langganan_push'
 ORDER BY ordinal_position;

-- G. Constraint
SELECT conname AS nama, pg_get_constraintdef(oid) AS definisi
  FROM pg_constraint
 WHERE conrelid = 'public.langganan_push'::regclass
 ORDER BY conname;

-- H. Indeks
SELECT indexname, indexdef
  FROM pg_indexes
 WHERE schemaname = 'public'
   AND tablename = 'langganan_push'
 ORDER BY indexname;
