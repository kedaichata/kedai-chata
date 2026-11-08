-- supabase/templates/20261108_04_order_batal_pesan_cek.sql
-- Cek hasil 20261108_04_order_batal_pesan.sql. HANYA MEMBACA, tidak mengubah apa pun.
-- Jalankan di SQL Editor (akun ketua), satu bagian per giliran, lalu tempel hasilnya ke chat.
-- Tanpa data nyata.

-- ============================================================
-- Bagian 1: fungsi ada, SECURITY DEFINER, search_path kosong.
-- Harapan: 1 baris; aman_definer = true; pengaturan = {search_path=""}
-- ============================================================
SELECT p.proname,
       p.prosecdef AS aman_definer,
       p.proconfig AS pengaturan
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname = 'order_batal';

-- ============================================================
-- Bagian 2: hak EXECUTE.
-- Harapan: anon = false, authenticated = false, service_role = true
-- ============================================================
SELECT has_function_privilege('anon',         'public.order_batal(uuid, uuid, text)', 'EXECUTE') AS anon,
       has_function_privilege('authenticated', 'public.order_batal(uuid, uuid, text)', 'EXECUTE') AS authenticated,
       has_function_privilege('service_role',  'public.order_batal(uuid, uuid, text)', 'EXECUTE') AS service_role;

-- ============================================================
-- Bagian 3: isi fungsi memuat kode baru, kode lama, dan penguncian baris.
-- Harapan: semuanya true
-- ============================================================
SELECT pg_get_functiondef('public.order_batal(uuid, uuid, text)'::regprocedure) LIKE '%sudah_dibatalkan%'        AS kode_baru_dibatalkan,
       pg_get_functiondef('public.order_batal(uuid, uuid, text)'::regprocedure) LIKE '%sudah_ditolak%'           AS kode_baru_ditolak,
       pg_get_functiondef('public.order_batal(uuid, uuid, text)'::regprocedure) LIKE '%sudah_diproses%'          AS kode_lama_diproses,
       pg_get_functiondef('public.order_batal(uuid, uuid, text)'::regprocedure) LIKE '%tidak_bisa_dibatalkan%'   AS kode_lama_owner,
       pg_get_functiondef('public.order_batal(uuid, uuid, text)'::regprocedure) LIKE '%FOR UPDATE%'              AS kunci_baris;

-- ============================================================
-- Bagian 4: jumlah order per status (hanya angka, tidak ada data pelanggan).
-- Harapan: sama dengan sebelum migration (migration ini tidak menyentuh data).
-- ============================================================
SELECT status, count(*) AS jumlah
  FROM public."order"
 GROUP BY status
 ORDER BY status;
