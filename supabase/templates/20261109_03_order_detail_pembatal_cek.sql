-- supabase/templates/20261109_03_order_detail_pembatal_cek.sql
-- Cek BACA-SAJA untuk migration 20261109_03_order_detail_pembatal.sql (ORD.17).
-- Jalankan di SQL Editor (akun ketua) SETELAH migration dijalankan. Tidak mengubah apa pun.
-- Hasilnya satu tabel: tiap baris dibandingkan kolom `hasil` dengan kolom `harapan`.
-- Tanpa data nyata (baris 9 sampai 11 hanya menghitung, tidak menampilkan isi).
--
-- Yang dicek:
--   1 sampai 6 : fungsi ada, SECURITY DEFINER, search_path kosong, hak EXECUTE (AGENTS.md bagian 7).
--   7          : isi fungsi memuat isian baru `dibatalkan_oleh_nama`.
--   8          : isi fungsi masih memuat `alasan_alih` (ORD.16 tidak hilang).
--   9          : order Dibatalkan yang tidak punya baris riwayat pembatalan (bila bukan 0, layar kosong untuk order itu).
--   10, 11     : jumlah order Dibatalkan menurut pembatalnya (hanya informasi).
-- Tabel dan data tidak disentuh migration ini, jadi tidak ada cek pagar tabel.

WITH pb AS (
  SELECT o.id,
         o.pemesan,
         (SELECT r.oleh
            FROM public.riwayat_status r
           WHERE r.order_id = o.id
             AND r.status_tujuan = 'Dibatalkan'
           ORDER BY r.id DESC
           LIMIT 1) AS oleh
    FROM public."order" o
   WHERE o.status = 'Dibatalkan'
)
SELECT '1. fungsi order_detail(uuid, uuid) ada' AS cek,
       (to_regprocedure('public.order_detail(uuid,uuid)') IS NOT NULL)::text AS hasil,
       'true' AS harapan
UNION ALL
SELECT '2. SECURITY DEFINER',
       p.prosecdef::text,
       'true'
  FROM pg_proc p
 WHERE p.oid = to_regprocedure('public.order_detail(uuid,uuid)')
UNION ALL
SELECT '3. search_path kosong',
       COALESCE(array_to_string(p.proconfig, ','), '(tidak ada)'),
       'search_path=""'
  FROM pg_proc p
 WHERE p.oid = to_regprocedure('public.order_detail(uuid,uuid)')
UNION ALL
SELECT '4. anon boleh EXECUTE',
       has_function_privilege('anon', to_regprocedure('public.order_detail(uuid,uuid)'), 'EXECUTE')::text,
       'false'
UNION ALL
SELECT '5. authenticated boleh EXECUTE',
       has_function_privilege('authenticated', to_regprocedure('public.order_detail(uuid,uuid)'), 'EXECUTE')::text,
       'false'
UNION ALL
SELECT '6. service_role boleh EXECUTE',
       has_function_privilege('service_role', to_regprocedure('public.order_detail(uuid,uuid)'), 'EXECUTE')::text,
       'true'
UNION ALL
SELECT '7. isi fungsi memuat dibatalkan_oleh_nama',
       (position('dibatalkan_oleh_nama' IN pg_get_functiondef(to_regprocedure('public.order_detail(uuid,uuid)'))) > 0)::text,
       'true'
UNION ALL
SELECT '8. isi fungsi masih memuat alasan_alih (ORD.16)',
       (position('alasan_alih' IN pg_get_functiondef(to_regprocedure('public.order_detail(uuid,uuid)'))) > 0)::text,
       'true'
UNION ALL
SELECT '9. order Dibatalkan tanpa baris riwayat pembatalan',
       count(*) FILTER (WHERE oleh IS NULL)::text,
       '0'
  FROM pb
UNION ALL
SELECT '10. order Dibatalkan oleh pemesan (informasi)',
       count(*) FILTER (WHERE oleh IS NOT NULL AND oleh = pemesan)::text,
       'angka berapa pun'
  FROM pb
UNION ALL
SELECT '11. order Dibatalkan oleh selain pemesan (informasi)',
       count(*) FILTER (WHERE oleh IS NOT NULL AND oleh IS DISTINCT FROM pemesan)::text,
       'angka berapa pun'
  FROM pb;
