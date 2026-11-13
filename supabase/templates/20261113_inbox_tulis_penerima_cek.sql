-- supabase/templates/20261113_inbox_tulis_penerima_cek.sql
-- Cek BACA-SAJA untuk 20261113_inbox_tulis_penerima.sql (NTF.06, langkah SQL).
-- Hanya SELECT. Tanpa data nyata. Jalankan SATU PER SATU di SQL Editor (akun ketua), lalu tempel hasilnya ke chat.
-- Bukti diperiksa bersama di chat dan tidak disimpan (AGENTS.md bagian 10 butir 2).

-- ------------------------------------------------------------
-- CEK A: tiga fungsi ada, tepat satu per nama, SECURITY DEFINER, search_path kosong, tipe kembalian benar.
-- Yang benar: 3 baris;
--   inbox_tulis          -> argumen (p_pelaku uuid, p_kejadian text, p_order_id uuid), kembalian jsonb
--   push_langganan_ambil -> argumen (p_akun uuid[]),                                kembalian jsonb
--   push_hasil_catat     -> argumen (p_berhasil uuid[], p_mati uuid[]),             kembalian jsonb
-- security_definer = true; config memuat search_path="" (atau search_path=""), tanpa nilai lain.
-- ------------------------------------------------------------
SELECT p.proname                            AS fungsi,
       pg_get_function_arguments(p.oid)     AS argumen,
       pg_get_function_result(p.oid)        AS kembalian,
       p.prosecdef                          AS security_definer,
       p.proconfig                          AS config
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('inbox_tulis', 'push_langganan_ambil', 'push_hasil_catat')
 ORDER BY p.proname;

-- ------------------------------------------------------------
-- CEK B: hak EXECUTE. Yang benar: tiga baris, kolom service_role = true, kolom lainnya = false.
-- ------------------------------------------------------------
SELECT p.proname                                           AS fungsi,
       has_function_privilege('service_role',   p.oid, 'EXECUTE') AS service_role,
       has_function_privilege('anon',           p.oid, 'EXECUTE') AS anon,
       has_function_privilege('authenticated',  p.oid, 'EXECUTE') AS authenticated
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('inbox_tulis', 'push_langganan_ambil', 'push_hasil_catat')
 ORDER BY p.proname;

-- ------------------------------------------------------------
-- CEK C: EXECUTE tidak terbuka untuk PUBLIC. Yang benar: tiga baris, tiap baris acl memuat HANYA entri
-- service_role (bentuk "service_role=X/..."), tanpa entri kosong di depan tanda "=" (itu PUBLIC).
-- ------------------------------------------------------------
SELECT p.proname AS fungsi,
       p.proacl  AS acl
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('inbox_tulis', 'push_langganan_ambil', 'push_hasil_catat')
 ORDER BY p.proname;

-- ------------------------------------------------------------
-- CEK D: hak tabel langganan_push TIDAK berubah. Yang benar: hanya service_role dengan INSERT, SELECT, UPDATE
-- (tiga baris, tanpa DELETE), tanpa baris untuk anon atau authenticated.
-- ------------------------------------------------------------
SELECT grantee, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND table_name   = 'langganan_push'
 ORDER BY grantee, privilege_type;

-- ------------------------------------------------------------
-- CEK E: hak tabel inbox TIDAK berubah. Yang benar: hanya service_role dengan INSERT dan SELECT
-- (dua baris, tanpa UPDATE dan tanpa DELETE).
-- ------------------------------------------------------------
SELECT grantee, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND table_name   = 'inbox'
 ORDER BY grantee, privilege_type;

-- ------------------------------------------------------------
-- CEK F (info untuk tes nanti, bukan lulus/gagal): jumlah langganan push aktif dan jumlah akun yang punya langganan aktif.
-- Untuk tes order_baru dibutuhkan minimal satu owner dummy dengan langganan aktif. Hanya angka, tanpa data pribadi.
-- ------------------------------------------------------------
SELECT count(*) FILTER (WHERE aktif)        AS langganan_aktif,
       count(DISTINCT akun) FILTER (WHERE aktif) AS akun_dengan_langganan_aktif,
       count(*)                              AS semua_baris
  FROM public.langganan_push;
