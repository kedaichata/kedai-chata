-- supabase/templates/20261114_02_gelar_saya_cek.sql
-- Cek GLR.02 (BACA-SAJA, hanya SELECT). Jalankan SETELAH 20261114_02_gelar_saya.sql.
-- Jalankan satu per satu (blok A sampai C), tempel hasilnya ke chat sebagai bukti.
-- Tanpa data nyata.

-- A. Fungsi ada, SECURITY DEFINER, search_path kosong, baca-saja (STABLE).
--    Hasil benar: satu baris; security_definer = true; volatilitas = s (stable);
--    konfigurasi memuat search_path="" ; kembalian = jsonb
SELECT p.proname,
       p.prosecdef                      AS security_definer,
       p.provolatile                    AS volatilitas,
       p.proconfig                      AS konfigurasi,
       pg_get_function_result(p.oid)    AS kembalian
FROM pg_proc p
WHERE p.oid = 'public.gelar_saya(uuid)'::regprocedure;

-- B. Hak EXECUTE per peran.
--    Hasil benar: service_role = true; anon, authenticated, dan PUBLIC (public) = false
SELECT r.peran,
       has_function_privilege(r.peran, 'public.gelar_saya(uuid)', 'EXECUTE') AS bisa_execute
FROM (VALUES ('service_role'), ('anon'), ('authenticated'), ('public')) AS r(peran);

-- C. Hanya satu fungsi bernama gelar_saya.  Hasil benar: 1
SELECT count(*) AS jumlah_fungsi
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'gelar_saya';
