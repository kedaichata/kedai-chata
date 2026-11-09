-- supabase/templates/20261109_01_order_status_alih_hari_cek.sql
-- Cek hasil ORD.07 (giliran 1): tiga fungsi order_status, order_metode_koreksi, order_alih_hari.
-- HANYA SELECT (baca-saja). Dijalankan di SQL Editor (akun ketua); tempel hasilnya ke chat.
-- Tanpa data nyata. Bukti diperiksa bersama di chat lalu tidak disimpan (AGENTS.md bagian 10 butir 2).

-- ============================================================
-- 1. Fungsi ada, SECURITY DEFINER, dan search_path kosong.
--    Hasil benar: 3 baris; aman_definer = true; pengaturan_path berisi search_path="" pada ketiganya.
--    (Setelah pembatalan: 0 baris.)
-- ============================================================
SELECT p.proname                                   AS fungsi,
       pg_get_function_identity_arguments(p.oid)   AS argumen,
       p.prosecdef                                 AS aman_definer,
       p.proconfig                                 AS pengaturan_path
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('order_status', 'order_metode_koreksi', 'order_alih_hari')
 ORDER BY p.proname;

-- ============================================================
-- 2. Hak EXECUTE.
--    Hasil benar: anon = false, authenticated = false, service_role = true pada ketiga baris
--    (anon sudah mencakup hak PUBLIC).
-- ============================================================
SELECT p.proname                                              AS fungsi,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated,
       has_function_privilege('service_role', p.oid, 'EXECUTE')  AS service_role
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('order_status', 'order_metode_koreksi', 'order_alih_hari')
 ORDER BY p.proname;

-- ============================================================
-- 3. Tabel tidak berubah: pagar `order` dan `riwayat_status` yang ada.
--    Hasil benar: pagar order_metode_status_cek, order_pemutus_cek, order_alasan_cek ada (versi 20261108_03),
--    dan riwayat_keterangan_cek ada. Tidak ada pagar baru dari migration ini.
-- ============================================================
SELECT c.conrelid::regclass AS tabel,
       c.conname            AS pagar
  FROM pg_constraint c
 WHERE c.conrelid IN ('public."order"'::regclass, 'public.riwayat_status'::regclass)
   AND c.contype = 'c'
 ORDER BY c.conrelid::regclass::text, c.conname;

-- ============================================================
-- 4. SESUDAH tes lewat konsol (giliran berikutnya, akun dummy): 10 baris riwayat terakhir.
--    Hasil benar: koreksi metode berbentuk "Metode bayar: <baru> (sebelumnya <lama>)" dengan status asal
--    dan tujuan sama; mundur berketerangan "Mundur satu langkah"; alih hari berbentuk
--    "Alih hari <lama> ke <baru>[, jam <lama> ke <baru>][. Alasan: ...]" dengan status tujuan Disetujui.
-- ============================================================
SELECT r.id, r.order_id, r.status_asal, r.status_tujuan, r.waktu, r.keterangan
  FROM public.riwayat_status r
 ORDER BY r.id DESC
 LIMIT 10;
