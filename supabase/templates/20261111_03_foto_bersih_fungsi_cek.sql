-- supabase/templates/20261111_03_foto_bersih_fungsi_cek.sql
-- Query cek BACA-SAJA untuk migration 20261111_03_foto_bersih_fungsi.sql (FTO.05 langkah 2).
-- Dijalankan di SQL Editor (akun ketua), SETELAH migration berhasil. Jalankan satu per satu;
-- tempel hasilnya ke chat. Hanya SELECT: tidak mengubah data (foto_bersih_tandai TIDAK dipanggil di sini).
-- Tanpa data nyata.

-- 1. Ketiga fungsi ada, SECURITY DEFINER, search_path kosong.
--    Hasil benar: 3 baris; security_definer = true; config memuat search_path="".
SELECT p.proname,
       p.prosecdef AS security_definer,
       p.proconfig AS config
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('foto_bersih_pilih', 'foto_bersih_tandai', 'foto_bersih_tanpa_baris')
 ORDER BY p.proname;

-- 2. EXECUTE hanya untuk service_role (tidak ada PUBLIC, anon, authenticated).
--    Hasil benar: tiap baris acl hanya memuat pemilik (postgres) dan service_role.
SELECT p.proname,
       p.proacl AS acl,
       has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon_bisa,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_bisa,
       has_function_privilege('service_role', p.oid, 'EXECUTE')  AS service_role_bisa
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('foto_bersih_pilih', 'foto_bersih_tandai', 'foto_bersih_tanpa_baris')
 ORDER BY p.proname;

-- 3. Hak tabel foto_bukti tidak berubah dan tanpa DELETE.
--    Hasil benar: hanya service_role dengan INSERT, SELECT, UPDATE; anon dan authenticated tidak muncul.
SELECT grantee, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND table_name = 'foto_bukti'
   AND grantee IN ('anon', 'authenticated', 'service_role')
 ORDER BY grantee, privilege_type;

-- 4. Pilihan foto yang layak dihapus (hanya membaca).
--    Hasil benar: ada `batas_waktu` (sekitar 14 hari lalu) dan `foto`.
--    Foto dummy dari tes FTO.03 dan FTO.04 (11 Nov 2026) masih baru, jadi `foto` kosong ([]) kecuali ada yang
--    ditandai diganti.
SELECT public.foto_bersih_pilih();

-- 5. Berkas tanpa baris (hanya membaca): lokasi karangan harus ikut kembali, lokasi yang punya baris tidak.
--    Hasil benar: ["tidak-ada/contoh.jpg"] saja (lokasi nyata dari tabel tidak ikut).
SELECT public.foto_bersih_tanpa_baris(
  ARRAY['tidak-ada/contoh.jpg']
  || COALESCE((SELECT array_agg(f.lokasi_berkas) FROM public.foto_bukti f), ARRAY[]::text[])
);

-- 6. Pengaturan yang dibaca fungsi.
--    Hasil benar: foto_simpan_hari = 14.
SELECT kunci, nilai FROM public.pengaturan WHERE kunci = 'foto_simpan_hari';
