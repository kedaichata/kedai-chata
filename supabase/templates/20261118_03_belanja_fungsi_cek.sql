-- supabase/templates/20261118_03_belanja_fungsi_cek.sql
-- Cek BLJ.02 (hanya SELECT, baca-saja, tanpa data nyata).
-- Jalankan satu per satu di SQL Editor (akun ketua), tempel hasilnya ke chat.
-- Bukti diperiksa bersama di chat lalu tidak disimpan (AGENTS.md bagian 10 butir 2).

-- ============================================================
-- A. Sepuluh fungsi ada, SECURITY DEFINER, dan search_path kosong
--    Benar: 10 baris; security_definer = true semua; konfigurasi memuat search_path kosong.
-- ============================================================
SELECT p.proname                                  AS fungsi,
       pg_get_function_identity_arguments(p.oid)  AS argumen,
       p.prosecdef                                AS security_definer,
       p.proconfig                                AS konfigurasi
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname LIKE 'belanja\_%'
 ORDER BY p.proname;

-- ============================================================
-- B. Siapa yang boleh EXECUTE tiap fungsi
--    Benar: hanya `postgres` (pemilik) dan `service_role`. Tidak ada PUBLIC, anon, atau authenticated.
-- ============================================================
SELECT p.proname AS fungsi,
       string_agg(
         CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE a.grantee::regrole::text END,
         ', ' ORDER BY CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE a.grantee::regrole::text END
       ) AS boleh_execute
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
 WHERE n.nspname = 'public'
   AND p.proname LIKE 'belanja\_%'
   AND a.privilege_type = 'EXECUTE'
 GROUP BY p.proname
 ORDER BY p.proname;

-- ============================================================
-- C. Lima pengaturan Belanja masih utuh
--    Benar: 5 baris: belanja_harga_maks 5000000, belanja_item_maks 50, belanja_judul_maks 60,
--    belanja_nama_maks 60, belanja_terkunci_tampil 10.
-- ============================================================
SELECT kunci, nilai
  FROM public.pengaturan
 WHERE kunci LIKE 'belanja\_%'
 ORDER BY kunci;

-- ============================================================
-- D. Hak tabel tidak berubah (berkas ini tidak menyentuh tabel)
--    Benar: untuk belanja dan belanja_item, service_role hanya INSERT, SELECT, UPDATE;
--    tidak ada baris untuk anon dan authenticated.
-- ============================================================
SELECT table_name  AS tabel,
       grantee     AS peran,
       string_agg(privilege_type, ', ' ORDER BY privilege_type) AS hak
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND table_name IN ('belanja', 'belanja_item')
   AND grantee IN ('anon', 'authenticated', 'service_role')
 GROUP BY table_name, grantee
 ORDER BY table_name, grantee;

-- ============================================================
-- E. Jumlah baris tabel (sebelum uji dummy)
--    Benar: 0 dan 0 bila belum ada uji; data lama tidak berubah oleh berkas ini.
-- ============================================================
SELECT (SELECT count(*) FROM public.belanja)      AS jumlah_catatan,
       (SELECT count(*) FROM public.belanja_item) AS jumlah_item;
