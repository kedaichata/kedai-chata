-- supabase/templates/20261118_order_batas_harian_cek.sql
-- Cek baca-saja untuk migration 20261118_order_batas_harian.sql (BTO.02). Tanpa data nyata.
-- Jalankan di SQL Editor sesudah migration, tempel hasilnya ke chat. Tidak mengubah apa pun.

-- 1. Fungsi order_buat: harus 1 baris, secdef = true, config memuat search_path kosong.
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS argumen,
       p.prosecdef AS secdef,
       p.proconfig AS config
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'order_buat';

-- 2. Hak EXECUTE: anon = false, authenticated = false, service_role = true.
SELECT has_function_privilege('anon', 'public.order_buat(uuid, text, uuid, text, text, jsonb, text)', 'EXECUTE') AS anon,
       has_function_privilege('authenticated', 'public.order_buat(uuid, text, uuid, text, text, jsonb, text)', 'EXECUTE') AS authenticated,
       has_function_privilege('service_role', 'public.order_buat(uuid, text, uuid, text, text, jsonb, text)', 'EXECUTE') AS service_role;

-- 3. Pengaturan baru: 1 baris, nilai 5 (bawaan).
SELECT kunci, nilai FROM public.pengaturan WHERE kunci = 'order_maks_per_hari';

-- 4. Empat pengaturan order lama tidak berubah (10, 10, 200, 10).
SELECT kunci, nilai FROM public.pengaturan
 WHERE kunci IN ('item_maks_per_order', 'jumlah_maks_per_item', 'catatan_maks_karakter', 'catatan_maks_per_order')
 ORDER BY kunci;

-- 5. Tipe kolom waktu dibuat: harus 'timestamp with time zone' (dasar hitungan hari WIB).
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'order' AND column_name = 'dibuat_pada';

-- 6. Badan fungsi memuat blok batas (harus true, true, true).
SELECT position('batas_order_harian' IN pg_get_functiondef(p.oid)) > 0 AS ada_galat_batas,
       position('pg_advisory_xact_lock' IN pg_get_functiondef(p.oid)) > 0 AS ada_kunci_akun,
       position('order_maks_per_hari' IN pg_get_functiondef(p.oid)) > 0 AS ada_kunci_pengaturan
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'order_buat';

-- 7. Jumlah order terbanyak oleh satu akun customer per hari (WIB), tanpa menampilkan siapa pun.
--    Hanya info: order dummy lama bisa melebihi batas dan itu tidak apa-apa (batas hanya untuk order baru).
SELECT max(jumlah) AS terbanyak_per_akun_per_hari
  FROM (
    SELECT count(*) AS jumlah
      FROM public."order" o
     WHERE o.pemesan IS NOT NULL
     GROUP BY o.pemesan, (o.dibuat_pada AT TIME ZONE 'Asia/Jakarta')::date
  ) t;
