-- supabase/templates/20261109_05_pelanggan_luar_fungsi_cek.sql
-- Cek ORD.11 (giliran 1): dijalankan di SQL Editor SETELAH 20261109_05_pelanggan_luar_fungsi.sql.
-- Semua query BACA-SAJA: tidak menulis apa pun. Jalankan satu per satu dan tempel hasilnya ke chat.
-- Tes perilaku fungsi (tambah, ubah, aktifkan lagi, ditolak, dan seterusnya) dikerjakan lewat konsol di giliran 2,
-- setelah aksi `kedai` dideploy, supaya tidak ada baris uji yang tertulis lewat SQL Editor.

-- ------------------------------------------------------------
-- 1. Tiga fungsi ada, SECURITY DEFINER, search_path kosong, hak EXECUTE benar
--    Hasil yang benar: 3 baris (daftar, nonaktif, simpan); security_definer = true di ketiganya;
--    search_path_cfg berisi {search_path=""}; anon = false; authenticated = false; service_role = true.
-- ------------------------------------------------------------
SELECT
  p.proname                                              AS fungsi,
  pg_get_function_identity_arguments(p.oid)              AS argumen,
  p.prosecdef                                            AS security_definer,
  p.proconfig                                            AS search_path_cfg,
  has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated,
  has_function_privilege('service_role',  p.oid, 'EXECUTE') AS service_role
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname LIKE 'pelanggan_luar\_%'
ORDER BY p.proname;

-- ------------------------------------------------------------
-- 2. Hak tabel `pelanggan_luar` tidak berubah
--    Hasil yang benar: service_role hanya INSERT, SELECT, UPDATE (tanpa DELETE);
--    tidak ada baris untuk anon dan authenticated. Baris untuk pemilik (postgres) boleh ada.
-- ------------------------------------------------------------
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'pelanggan_luar'
ORDER BY grantee, privilege_type;

-- ------------------------------------------------------------
-- 3. Tidak ada fungsi pelanggan_luar yang menghapus baris
--    Hasil yang benar: 0 baris.
-- ------------------------------------------------------------
SELECT p.proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname LIKE 'pelanggan_luar\_%'
  AND p.prosrc ILIKE '%delete from%';

-- ------------------------------------------------------------
-- 4. Isi tabel (hitungan saja, tanpa menampilkan data pribadi)
--    Hasil yang benar sebelum tes giliran 2: total = 0 dan aktif = 0 (belum ada pelanggan tanpa akun).
--    Sesudah tes giliran 2: sesuai jumlah pelanggan dummy yang dibuat.
-- ------------------------------------------------------------
SELECT
  count(*)                       AS total,
  count(*) FILTER (WHERE aktif)  AS aktif
FROM public.pelanggan_luar;

-- ------------------------------------------------------------
-- 5. Setelah tes giliran 2 (jalankan lagi di sana): tidak ada dua pelanggan AKTIF dengan nama dan keterangan yang
--    sama (huruf besar-kecil dianggap sama). Hasil yang benar: 0 baris.
-- ------------------------------------------------------------
SELECT lower(nama) AS nama, coalesce(lower(keterangan), '') AS keterangan, count(*) AS jumlah
FROM public.pelanggan_luar
WHERE aktif
GROUP BY lower(nama), coalesce(lower(keterangan), '')
HAVING count(*) > 1;
