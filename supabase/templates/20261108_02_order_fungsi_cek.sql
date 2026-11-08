-- supabase/templates/20261108_02_order_fungsi_cek.sql
-- Query cek BACA-SAJA untuk ORD.02 (giliran 1). Jalankan di SQL Editor setelah 20261108_02_order_fungsi.sql.
-- Tempel hasil tiap bagian ke chat sebagai bukti. Tanpa data nyata; tidak mengubah apa pun.

-- 1. Tiga fungsi ada, SECURITY DEFINER, dan search_path kosong.
--    Harapan: 3 baris; security_definer = true; konfigurasi memuat search_path="" .
SELECT p.proname AS fungsi,
       pg_get_function_identity_arguments(p.oid) AS argumen,
       p.prosecdef AS security_definer,
       p.proconfig AS konfigurasi
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('order_buat', 'order_daftar', 'order_detail')
 ORDER BY p.proname;

-- 2. Hak EXECUTE per peran.
--    Harapan: 9 baris; anon = false, authenticated = false, service_role = true untuk ketiga fungsi.
SELECT p.proname AS fungsi,
       r.rolname AS peran,
       has_function_privilege(r.rolname, p.oid, 'EXECUTE') AS boleh_jalan
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(rolname)
 WHERE n.nspname = 'public'
   AND p.proname IN ('order_buat', 'order_daftar', 'order_detail')
 ORDER BY p.proname, r.rolname;

-- 3. Tidak ada fungsi order kembar (satu nama, satu bentuk).
--    Harapan: 3 baris, masing-masing jumlah = 1.
SELECT p.proname AS fungsi, count(*) AS jumlah
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('order_buat', 'order_daftar', 'order_detail')
 GROUP BY p.proname
 ORDER BY p.proname;

-- 4. Migration ini tidak mengisi data. Harapan sebelum tes order: semuanya 0.
SELECT (SELECT count(*) FROM public."order")         AS jml_order,
       (SELECT count(*) FROM public.order_item)      AS jml_item,
       (SELECT count(*) FROM public.riwayat_status)  AS jml_riwayat,
       (SELECT count(*) FROM public.catatan_order)   AS jml_catatan;
