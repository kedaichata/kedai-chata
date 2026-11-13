-- supabase/templates/20261113_02_ringkasan_7hari_cek.sql
-- Cek BACA-SAJA untuk 20261113_02_ringkasan_7hari.sql (RKS.01).
-- Hanya SELECT. Jalankan SATU PER SATU di SQL Editor (akun ketua), lalu tempel hasilnya ke chat.
-- Bukti diperiksa bersama di chat dan tidak disimpan (AGENTS.md bagian 10 butir 2).
-- CEK E dan F butuh ID akun dummy: ISI DI DASHBOARD SAJA, jangan disimpan di repo atau ditempel ke chat sebagai ID nyata.

-- ------------------------------------------------------------
-- CEK A: fungsi ada, tepat satu, SECURITY DEFINER, STABLE, search_path kosong, kembalian jsonb.
-- Yang benar: 1 baris;
--   argumen (p_akun uuid), kembalian jsonb, security_definer = true, volatilitas = 's' (stable),
--   config memuat search_path="" (atau search_path=""), tanpa nilai lain.
-- ------------------------------------------------------------
SELECT p.proname                            AS fungsi,
       pg_get_function_arguments(p.oid)     AS argumen,
       pg_get_function_result(p.oid)        AS kembalian,
       p.prosecdef                          AS security_definer,
       p.provolatile                        AS volatilitas,
       p.proconfig                          AS config
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname = 'ringkasan_7hari';

-- ------------------------------------------------------------
-- CEK B: hak EXECUTE. Yang benar: satu baris, service_role = true, anon = false, authenticated = false.
-- ------------------------------------------------------------
SELECT p.proname                                           AS fungsi,
       has_function_privilege('service_role',   p.oid, 'EXECUTE') AS service_role,
       has_function_privilege('anon',           p.oid, 'EXECUTE') AS anon,
       has_function_privilege('authenticated',  p.oid, 'EXECUTE') AS authenticated
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname = 'ringkasan_7hari';

-- ------------------------------------------------------------
-- CEK C: EXECUTE tidak terbuka untuk PUBLIC. Yang benar: satu baris, acl memuat HANYA entri service_role
-- (bentuk "service_role=X/..."), tanpa entri kosong di depan tanda "=" (itu PUBLIC).
-- ------------------------------------------------------------
SELECT p.proname AS fungsi,
       p.proacl  AS acl
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname = 'ringkasan_7hari';

-- ------------------------------------------------------------
-- CEK D: hak tabel order TIDAK berubah. Yang benar: hanya service_role dengan INSERT, SELECT, UPDATE
-- (tiga baris, tanpa DELETE), tanpa baris untuk anon atau authenticated.
-- ------------------------------------------------------------
SELECT grantee, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND table_name   = 'order'
 ORDER BY grantee, privilege_type;

-- ------------------------------------------------------------
-- CEK E (isi ID owner DUMMY di dashboard): panggil fungsi sebagai owner.
-- Yang benar: satu baris jsonb; `per_hari` berisi tepat 7 elemen (terlama ke hari ini, elemen terakhir = hari ini WIB),
-- `hari_ini` = tanggal hari ini WIB, hanya angka dan tanggal (tanpa nama, WA, alamat).
-- ------------------------------------------------------------
SELECT public.ringkasan_7hari('ISI_ID_OWNER_DUMMY'::uuid) AS hasil;

-- ------------------------------------------------------------
-- CEK F (isi ID penjaga DUMMY atau customer DUMMY di dashboard): panggil fungsi sebagai BUKAN owner.
-- Yang benar: GAGAL dengan galat `bukan_owner`. Bila yang diisi akun staf nonaktif: galat `akun_nonaktif`.
-- (Galat di SQL Editor itu hasil yang diharapkan.)
-- ------------------------------------------------------------
SELECT public.ringkasan_7hari('ISI_ID_BUKAN_OWNER_DUMMY'::uuid) AS hasil;

-- ------------------------------------------------------------
-- CEK G (info untuk tes nanti, bukan lulus/gagal): hitung langsung dari tabel order untuk 7 hari yang sama,
-- tanpa Ditolak dan Dibatalkan, menurut hari_target. Bandingkan dengan `per_hari` di CEK E:
-- hari yang tidak muncul di sini = hari kosong (di CEK E tampil jumlah 0 dan nilai 0). Hanya angka dan tanggal.
-- ------------------------------------------------------------
SELECT o.hari_target     AS tanggal,
       count(*)          AS jumlah,
       sum(o.total)      AS nilai
  FROM public."order" o
 WHERE o.hari_target BETWEEN (now() AT TIME ZONE 'Asia/Jakarta')::date - 6
                         AND (now() AT TIME ZONE 'Asia/Jakarta')::date
   AND o.status NOT IN ('Ditolak', 'Dibatalkan')
 GROUP BY o.hari_target
 ORDER BY o.hari_target;
