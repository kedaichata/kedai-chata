-- supabase/templates/20261108_03_order_batal_fungsi_cek.sql
-- Cek hasil 20261108_03_order_batal_fungsi.sql. Hanya membaca, aman dijalankan kapan saja.
-- Tempel hasil tiap bagian ke chat. Tanpa data pelanggan.

-- 1. Fungsi ada, tepat satu, SECURITY DEFINER, search_path kosong.
--    Harapan: 1 baris; prosecdef = true; proconfig memuat search_path="".
SELECT proname, pg_get_function_identity_arguments(oid) AS isian, prosecdef, proconfig
  FROM pg_proc
 WHERE pronamespace = 'public'::regnamespace AND proname = 'order_batal';

-- 2. Hak EXECUTE. Harapan: service_role EXECUTE; anon dan authenticated TIDAK ada
--    (pemilik fungsi, misalnya postgres, boleh tampil).
SELECT grantee, privilege_type
  FROM information_schema.routine_privileges
 WHERE routine_schema = 'public' AND routine_name = 'order_batal'
 ORDER BY grantee;

-- 3. Tiga pagar baru terpasang. Harapan: 3 baris, isinya sesuai bagian 1 berkas migration.
SELECT conname, pg_get_constraintdef(oid) AS aturan
  FROM pg_constraint
 WHERE conrelid = 'public."order"'::regclass
   AND conname IN ('order_metode_status_cek', 'order_pemutus_cek', 'order_alasan_cek')
 ORDER BY conname;

-- 4. Data order tidak berubah. Harapan: jumlah per status sama dengan sebelum migration
--    (saat ini order uji, semuanya Menunggu).
SELECT status, count(*) AS jumlah FROM public."order" GROUP BY status ORDER BY status;
