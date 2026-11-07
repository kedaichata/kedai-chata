-- supabase/templates/20261107_03_menu_deskripsi_cek.sql
-- Cek hasil MNU.07 giliran 1 (20261107_03_menu_deskripsi.sql).
-- Jalankan SATU PER SATU di SQL Editor (akun ketua): blok 1 sampai 5 hanya membaca. Blok 5b dan 6
-- sengaja diberi komentar (awalan "-- "); hapus awalan itu hanya pada blok yang mau dijalankan.
-- Blok 6 aman karena selalu dibatalkan sendiri. SQL Editor hanya menampilkan hasil pernyataan
-- terakhir, jadi salin satu blok, jalankan, tempel hasilnya ke chat, lalu lanjut ke blok berikutnya.
-- Tanpa data nyata.

-- ============================================================
-- 1. Kolom deskripsi ada.
--    Hasil benar: baris `deskripsi` | text | YES
-- ============================================================
SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'menu'
 ORDER BY ordinal_position;

-- ============================================================
-- 2. Pagar tabel.
--    Hasil benar: ada menu_deskripsi_cek (selain menu_nama_cek, menu_harga_cek, menu_foto_cek)
-- ============================================================
SELECT conname, pg_get_constraintdef(oid) AS aturan
  FROM pg_constraint
 WHERE conrelid = 'public.menu'::regclass AND contype = 'c'
 ORDER BY conname;

-- ============================================================
-- 3. Pengaturan.
--    Hasil benar: harga_maks_menu = 200000 dan deskripsi_menu_maks = 200
-- ============================================================
SELECT kunci, nilai, keterangan
  FROM public.pengaturan
 WHERE kunci IN ('harga_maks_menu', 'deskripsi_menu_maks')
 ORDER BY kunci;

-- ============================================================
-- 4. Hak EXECUTE fungsi menu.
--    Hasil benar: menu_daftar(1), menu_simpan(6 argumen), menu_simpan(7 argumen), menu_stok,
--    menu_nonaktif: kolom anon, authenticated, dan publik semuanya false; service_role true.
-- ============================================================
SELECT p.oid::regprocedure AS fungsi,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated,
       has_function_privilege('service_role', p.oid, 'EXECUTE')  AS service_role
  FROM pg_proc p
 WHERE p.pronamespace = 'public'::regnamespace
   AND p.proname LIKE 'menu\_%'
 ORDER BY p.oid::regprocedure::text;

-- ============================================================
-- 5. RLS dan hak tabel menu tidak berubah.
--    5a. Hasil benar: rls_aktif = true, jumlah_policy = 0
-- ============================================================
SELECT c.relrowsecurity AS rls_aktif,
       (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'menu') AS jumlah_policy
  FROM pg_class c
 WHERE c.oid = 'public.menu'::regclass;

--    5b. Hasil benar: service_role hanya INSERT, SELECT, UPDATE (tanpa DELETE); anon dan authenticated tidak muncul.
--    (Jalankan terpisah dari 5a.)
-- SELECT grantee, privilege_type
--   FROM information_schema.role_table_grants
--  WHERE table_schema = 'public' AND table_name = 'menu'
--  ORDER BY grantee, privilege_type;

-- ============================================================
-- 6. Uji perilaku fungsi (AMAN: seluruh isi DO dibatalkan otomatis oleh RAISE EXCEPTION di akhir,
--    jadi tidak ada menu yang tersimpan). Hasilnya muncul sebagai PESAN GALAT berawalan "HASIL UJI"; itu normal.
--    Tanda ⏎ = satu baris baru.
--    Hasil benar:
--      A = "- telur⏎⏎- sambal"            (spasi dan baris kosong berlebih dirapikan)
--      B = "NULL"                          (isian hanya spasi = tanpa deskripsi)
--      C = "deskripsi_tidak_valid"         (201 karakter ditolak)
--      D = "200 karakter diterima"         (tepat 200 karakter diterima)
-- ============================================================
-- DO $$
-- DECLARE
--   v_owner uuid;
--   v_id    uuid;
--   v_a     text;
--   v_b     text;
--   v_c     text;
--   v_d     text;
-- BEGIN
--   SELECT s.id INTO v_owner FROM public.staf s WHERE s.aktif AND s.peran = 'owner' LIMIT 1;
--   IF v_owner IS NULL THEN
--     RAISE EXCEPTION 'HASIL UJI: tidak ada owner aktif';
--   END IF;
--
--   -- A: rapikan
--   v_id := public.menu_simpan(v_owner, NULL, 'Zz Uji A', 1000, NULL,
--             E'  - telur  \r\n\r\n\r\n\r\n  - sambal\t \n', false);
--   SELECT replace(deskripsi, E'\n', '⏎') INTO v_a FROM public.menu WHERE id = v_id;
--
--   -- B: hanya spasi
--   v_id := public.menu_simpan(v_owner, NULL, 'Zz Uji B', 1000, NULL, E'   \n  ', false);
--   SELECT COALESCE(deskripsi, 'NULL') INTO v_b FROM public.menu WHERE id = v_id;
--
--   -- C: 201 karakter
--   BEGIN
--     PERFORM public.menu_simpan(v_owner, NULL, 'Zz Uji C', 1000, NULL, repeat('a', 201), false);
--     v_c := 'TIDAK ditolak (salah)';
--   EXCEPTION WHEN OTHERS THEN
--     v_c := SQLERRM;
--   END;
--
--   -- D: tepat 200 karakter
--   BEGIN
--     PERFORM public.menu_simpan(v_owner, NULL, 'Zz Uji D', 1000, NULL, repeat('a', 200), false);
--     v_d := '200 karakter diterima';
--   EXCEPTION WHEN OTHERS THEN
--     v_d := 'DITOLAK (salah): ' || SQLERRM;
--   END;
--
--   RAISE EXCEPTION 'HASIL UJI | A = "%" | B = "%" | C = "%" | D = "%"', v_a, v_b, v_c, v_d;
-- END
-- $$;
