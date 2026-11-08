-- supabase/templates/20261108_05_order_setuju_tolak_cek.sql
-- Cek hasil migration 20261108_05_order_setuju_tolak.sql. Hanya membaca, tidak mengubah apa pun.
-- Jalankan di SQL Editor (akun ketua), satu bagian per giliran, lalu tempel hasilnya ke chat.
-- Tanpa data nyata.

-- BAGIAN 1. Dua fungsi ada, SECURITY DEFINER, search_path kosong. Harapan: 2 baris, kolom aman = true.
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS argumen,
       p.prosecdef                               AS security_definer,
       p.proconfig                               AS pengaturan_fungsi,
       (p.proconfig @> ARRAY['search_path=""']) AS search_path_kosong
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('order_setuju', 'order_tolak')
 ORDER BY p.proname;

-- BAGIAN 2. Hak EXECUTE. Harapan: tiap fungsi hanya service_role = true; anon dan authenticated = false.
SELECT p.proname,
       has_function_privilege('service_role',  p.oid, 'EXECUTE') AS service_role,
       has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('order_setuju', 'order_tolak')
 ORDER BY p.proname;

-- BAGIAN 3. Tidak ada fungsi kembar. Harapan: tiap nama jumlahnya 1.
SELECT p.proname, count(*) AS jumlah
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('order_setuju', 'order_tolak')
 GROUP BY p.proname
 ORDER BY p.proname;

-- BAGIAN 4. Isi fungsi memuat penguncian baris. Harapan: kedua baris mengunci_baris = true.
SELECT p.proname,
       (pg_get_functiondef(p.oid) ILIKE '%FOR UPDATE%') AS mengunci_baris
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('order_setuju', 'order_tolak')
 ORDER BY p.proname;

-- BAGIAN 5. Data order tidak tersentuh. Harapan: sama dengan sebelum migration (belum ada Disetujui/Ditolak
-- dari fungsi baru; order uji lama tetap Menunggu atau Dibatalkan).
SELECT status, count(*) AS jumlah
  FROM public."order"
 GROUP BY status
 ORDER BY status;
