-- supabase/templates/20261110_06_order_wakil_fungsi_cek.sql
-- Cek BACA-SAJA (hanya SELECT) untuk ORD.12 giliran 1: fungsi `public.order_buat_wakil`.
-- Jalankan di SQL Editor (akun ketua) SESUDAH migration 20261110_06_order_wakil_fungsi.sql, satu cek per giliran
-- atau semuanya sekaligus, lalu tempel hasilnya ke chat (bukti tidak disimpan di repo). Tanpa data nyata.
-- Cek 5 diulang sesudah tes ORD.12 selesai.

-- ------------------------------------------------------------
-- Cek 1: fungsi ada, SECURITY DEFINER, search_path kosong.
-- Benar: tepat 1 baris; aman_definer = true; search_path_kosong = true.
-- ------------------------------------------------------------
SELECT
  p.oid::regprocedure                                   AS fungsi,
  p.prosecdef                                           AS aman_definer,
  COALESCE(p.proconfig, ARRAY[]::text[]) @> ARRAY['search_path=""'] AS search_path_kosong
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'order_buat_wakil';

-- ------------------------------------------------------------
-- Cek 2: hak EXECUTE. Benar: anon = false, authenticated = false, service_role = true.
-- ------------------------------------------------------------
SELECT
  has_function_privilege('anon',
    'public.order_buat_wakil(uuid, uuid, text, text, text, text, jsonb, text)', 'EXECUTE')          AS anon,
  has_function_privilege('authenticated',
    'public.order_buat_wakil(uuid, uuid, text, text, text, text, jsonb, text)', 'EXECUTE')          AS authenticated,
  has_function_privilege('service_role',
    'public.order_buat_wakil(uuid, uuid, text, text, text, text, jsonb, text)', 'EXECUTE')          AS service_role;

-- ------------------------------------------------------------
-- Cek 3: daftar hak EXECUTE apa adanya (tidak boleh ada PUBLIC, anon, atau authenticated).
-- Benar: hanya pemilik fungsi dan service_role di daftar.
-- ------------------------------------------------------------
SELECT p.oid::regprocedure AS fungsi, p.proacl AS daftar_hak
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'order_buat_wakil';

-- ------------------------------------------------------------
-- Cek 4: hak tabel `service_role` tidak berubah dan tanpa DELETE.
-- Benar: tidak ada baris dengan privilege_type = 'DELETE'. Hak yang terlihat tetap sesuai database.md bagian 3
-- (order, pelanggan_luar: SELECT, INSERT, UPDATE; order_item, riwayat_status: SELECT, INSERT).
-- ------------------------------------------------------------
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'service_role'
  AND table_schema = 'public'
  AND table_name IN ('order', 'order_item', 'riwayat_status', 'pelanggan_luar')
ORDER BY table_name, privilege_type;

-- ------------------------------------------------------------
-- Cek 5: order wakil yang ada. Sebelum tes: 0 baris. Sesudah tes: tiap baris punya pemesan akun kosong,
-- pelanggan tanpa akun terisi, status Disetujui ke atas, metode bayar terisi, pemutus = pembuat.
-- (Hanya nomor dan status; tanpa nama, WA, atau alamat.)
-- ------------------------------------------------------------
SELECT
  o.nomor,
  o.status,
  o.tipe,
  o.metode_bayar,
  (o.pemesan IS NULL)                  AS tanpa_akun,
  (o.pemutus = o.dibuat_oleh)          AS pemutus_sama_pembuat,
  (o.isi_alamat IS NOT NULL)           AS beralamat
FROM public."order" o
WHERE o.pelanggan_luar_id IS NOT NULL
ORDER BY o.nomor;
