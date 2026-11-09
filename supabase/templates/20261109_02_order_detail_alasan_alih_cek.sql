-- supabase/templates/20261109_02_order_detail_alasan_alih_cek.sql
-- Cek BACA-SAJA untuk migration 20261109_02_order_detail_alasan_alih.sql (ORD.16).
-- Jalankan di SQL Editor (akun ketua) SETELAH migration dijalankan. Tidak mengubah apa pun.
-- Hasilnya satu tabel: tiap baris dibandingkan kolom `hasil` dengan kolom `harapan`.
-- Tanpa data nyata (baris 9 hanya menghitung, tidak menampilkan isi riwayat).
--
-- Yang dicek:
--   1 sampai 6 : fungsi ada, SECURITY DEFINER, search_path kosong, hak EXECUTE (AGENTS.md bagian 7).
--   7          : isi fungsi sudah memuat isian baru `alasan_alih`.
--   8          : semua keterangan "Alih hari ..." berformat yang dibaca fungsi (bila 0, format aman).
--   9          : jumlah baris riwayat alih hari yang terbaca (hanya informasi).
-- Tabel dan data tidak disentuh migration ini, jadi tidak ada cek pagar tabel.

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
SELECT '7. isi fungsi memuat alasan_alih',
       (position('alasan_alih' IN pg_get_functiondef(to_regprocedure('public.order_detail(uuid,uuid)'))) > 0)::text,
       'true'
UNION ALL
SELECT '8. keterangan "Alih hari" yang formatnya tidak terbaca',
       count(*)::text,
       '0'
  FROM public.riwayat_status r
 WHERE r.keterangan LIKE 'Alih hari%'
   AND r.keterangan !~ '^Alih hari [0-9]{4}-[0-9]{2}-[0-9]{2} ke '
UNION ALL
SELECT '9. baris riwayat alih hari yang terbaca (informasi)',
       count(*)::text,
       'angka berapa pun'
  FROM public.riwayat_status r
 WHERE r.keterangan ~ '^Alih hari [0-9]{4}-[0-9]{2}-[0-9]{2} ke ';
