-- supabase/templates/20261111_06_inbox_fungsi_cek.sql
-- Query BACA-SAJA untuk bukti INB.02 (SEC-03, SEC-04, SEC-34 bagian hak fungsi). Aman dijalankan berulang.
-- Tempel hasil tiap bagian ke chat sebagai bukti (tidak disimpan di repo/md).
-- Jalankan SETELAH 20261111_06_inbox_fungsi.sql berhasil. Jalankan satu bagian per kali.
-- Tidak ada bagian di sini yang menulis data. Uji penulisan (`inbox_tulis` dengan data dummy)
-- dikerjakan lewat `kedai` di INB.04 dan sesi tes INB.07.

-- (1) Fungsi ada dan polanya benar. Harapan: 3 baris, semuanya
--     security_definer = true dan pengaturan search_path memuat search_path="".
SELECT p.proname AS fungsi,
       pg_get_function_identity_arguments(p.oid) AS argumen,
       p.prosecdef AS security_definer,
       p.proconfig AS pengaturan
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('inbox_tulis', 'inbox_daftar', 'inbox_terbaru')
ORDER BY p.proname;

-- (2) Hak EXECUTE per peran. Harapan: 9 baris;
--     service_role = true, anon dan authenticated = false (untuk ketiga fungsi).
SELECT f.fungsi, r.peran,
       has_function_privilege(r.peran, f.sig, 'EXECUTE') AS boleh_jalankan
FROM (VALUES
  ('inbox_tulis',   'public.inbox_tulis(uuid, text, uuid)'),
  ('inbox_daftar',  'public.inbox_daftar(uuid, bigint)'),
  ('inbox_terbaru', 'public.inbox_terbaru(uuid)')
) AS f(fungsi, sig)
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(peran)
ORDER BY f.fungsi, r.peran;

-- (3) Hak PUBLIC tidak tersisa. Harapan: 3 baris, semuanya public_boleh = false.
SELECT f.fungsi,
       coalesce(
         (SELECT bool_or(a.grantee = 0)
            FROM pg_proc p2
            CROSS JOIN LATERAL aclexplode(coalesce(p2.proacl, acldefault('f', p2.proowner))) a
           WHERE p2.oid = f.sig::regprocedure),
         false
       ) AS public_boleh
FROM (VALUES
  ('inbox_tulis',   'public.inbox_tulis(uuid, text, uuid)'),
  ('inbox_daftar',  'public.inbox_daftar(uuid, bigint)'),
  ('inbox_terbaru', 'public.inbox_terbaru(uuid)')
) AS f(fungsi, sig)
ORDER BY f.fungsi;

-- (4) Pengaturan yang dibaca fungsi masih ada. Harapan: 2 baris
--     inbox_maks_tampil = 30, inbox_simpan_hari = 14.
SELECT kunci, nilai
FROM public.pengaturan
WHERE kunci IN ('inbox_simpan_hari', 'inbox_maks_tampil')
ORDER BY kunci;

-- (5) Tabel inbox masih kosong dan hak tabelnya tidak berubah.
--     Harapan: jumlah = 0.
SELECT 'inbox' AS tabel, count(*) AS jumlah FROM public.inbox;

-- (6) `inbox_daftar` untuk akun yang tidak ada (id acak, bukan data nyata). Read-only.
--     Harapan: butir = [], terbaru = null, maks = 30.
SELECT public.inbox_daftar('00000000-0000-0000-0000-000000000000'::uuid, 0) AS hasil;

-- (7) `inbox_terbaru` untuk akun yang tidak ada. Harapan: terbaru = null.
SELECT public.inbox_terbaru('00000000-0000-0000-0000-000000000000'::uuid) AS terbaru;

-- (8) `inbox_tulis` dengan isian kosong. Harapan: GALAT "id_kosong" (tidak ada yang tertulis).
--     Galat ini memang yang diharapkan.
SELECT public.inbox_tulis(NULL, 'order_baru', NULL);

-- (9) `inbox_tulis` dengan kejadian ngawur. Harapan: GALAT "kejadian_tidak_dikenal".
SELECT public.inbox_tulis(
  '00000000-0000-0000-0000-000000000000'::uuid, 'ngawur',
  '00000000-0000-0000-0000-000000000000'::uuid);

-- (10) `inbox_tulis` dengan order yang tidak ada. Harapan: GALAT "order_tidak_ditemukan".
SELECT public.inbox_tulis(
  '00000000-0000-0000-0000-000000000000'::uuid, 'order_baru',
  '00000000-0000-0000-0000-000000000000'::uuid);

-- (11) Setelah bagian 8 sampai 10, tabel inbox tetap kosong. Harapan: jumlah = 0.
SELECT 'inbox' AS tabel, count(*) AS jumlah FROM public.inbox;
