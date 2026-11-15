-- supabase/templates/20261115_02_profil_staf_skema_cek.sql
-- Cek kondisi TERBARU tabel profil dan staf sebelum menulis WAG.02 (fungsi wa_nomor_ambil).
-- HANYA SELECT, aman dijalankan berulang. Tanpa data nyata: query ini tidak menampilkan isi nomor, hanya jumlahnya.
-- Jalankan SATU PER SATU di SQL Editor (akun ketua), lalu tempel hasil tiap bagian ke chat.
-- Bukti diperiksa bersama di chat dan tidak disimpan (AGENTS.md bagian 10 butir 2).
--
-- Hasil yang diharapkan (dari 20261105_akun.sql dan 20261115_staf_nomor_wa.sql):
--   A. profil: id (uuid), nama_tampilan (text), nomor_wa (text, NOT NULL), dibuat_pada (timestamptz). Empat kolom.
--   B. profil: primary key, foreign key id ke auth.users, profil_nama_cek, profil_wa_cek (^628[0-9]{8,11}$).
--   C. staf: id, nama_tampilan, peran, aktif, dibuat_pada, nomor_wa (text, boleh kosong, tanpa nilai bawaan). Enam kolom.
--   D. staf: primary key, foreign key id, staf_nama_cek, staf_peran_cek, staf_wa_cek.
--   E. service_role: profil = INSERT, SELECT, UPDATE; staf = SELECT saja. Tanpa baris PUBLIC, anon, authenticated.
--   F. rls_aktif = true dan jumlah_policy = 0 untuk kedua tabel.
--   G. profil_nomor_tidak_sesuai = 0; staf_nomor_tidak_sesuai = 0.
--   H. Nol baris (fungsi wa_nomor_ambil belum ada, jadi tidak bentrok nama).
--   I. Tiga baris pola (inbox_tulis, push_langganan_ambil, push_hasil_catat): security_definer = true, config memuat search_path kosong.

-- A. Kolom profil
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'profil'
 ORDER BY ordinal_position;

-- B. Constraint profil
SELECT conname AS nama, pg_get_constraintdef(oid) AS definisi
  FROM pg_constraint
 WHERE conrelid = 'public.profil'::regclass
 ORDER BY conname;

-- C. Kolom staf
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'staf'
 ORDER BY ordinal_position;

-- D. Constraint staf
SELECT conname AS nama, pg_get_constraintdef(oid) AS definisi
  FROM pg_constraint
 WHERE conrelid = 'public.staf'::regclass
 ORDER BY conname;

-- E. Hak tabel per penerima (profil dan staf)
SELECT c.relname AS tabel,
       CASE WHEN x.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END AS penerima,
       string_agg(x.privilege_type, ', ' ORDER BY x.privilege_type)               AS hak
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace,
       LATERAL aclexplode(c.relacl) x
 WHERE n.nspname = 'public'
   AND c.relname IN ('profil', 'staf')
 GROUP BY 1, 2
 ORDER BY 1, 2;

-- F. RLS dan policy
SELECT c.relname AS tabel, c.relrowsecurity AS rls_aktif,
       (SELECT count(*) FROM pg_policies p
         WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS jumlah_policy
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND c.relname IN ('profil', 'staf')
 ORDER BY c.relname;

-- G. Jumlah baris dan kesesuaian bentuk nomor (hanya angka, tanpa menampilkan nomor)
SELECT 'profil' AS tabel,
       count(*) AS total,
       count(*) FILTER (WHERE nomor_wa !~ '^628[0-9]{8,11}$') AS nomor_tidak_sesuai,
       NULL::bigint AS aktif,
       NULL::bigint AS nomor_terisi
  FROM public.profil
UNION ALL
SELECT 'staf',
       count(*),
       count(*) FILTER (WHERE nomor_wa IS NOT NULL AND nomor_wa !~ '^628[0-9]{8,11}$'),
       count(*) FILTER (WHERE aktif),
       count(*) FILTER (WHERE nomor_wa IS NOT NULL)
  FROM public.staf;

-- H. Pastikan nama wa_nomor_ambil belum dipakai (harus nol baris)
SELECT p.proname AS fungsi, pg_get_function_arguments(p.oid) AS argumen
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname = 'wa_nomor_ambil';

-- I. Pola fungsi yang dijadikan contoh (tiga baris)
SELECT p.proname                        AS fungsi,
       pg_get_function_arguments(p.oid) AS argumen,
       pg_get_function_result(p.oid)    AS kembalian,
       p.prosecdef                      AS security_definer,
       p.proconfig                      AS config
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('inbox_tulis', 'push_langganan_ambil', 'push_hasil_catat')
 ORDER BY p.proname;
