-- supabase/templates/20261107_04_menu_grup_pilihan_cek.sql
-- Cek BACA-SAJA untuk MNU.09 giliran 1 (20261107_04_menu_grup_pilihan.sql). Tanpa data nyata, tidak mengubah apa pun.
-- Dijalankan di SQL Editor (akun ketua) SATU PER SATU (blok bernomor), tempel hasilnya ke chat sebagai bukti.
-- SQL Editor hanya menampilkan hasil query terakhir yang dijalankan, jadi blok jangan digabung.

-- ============================================================
-- CEK 1. Tabel ada, RLS aktif, tanpa policy
-- Harapan: 3 baris (grup_pilihan, menu_grup, opsi_pilihan), rls_aktif = true, jumlah_policy = 0
-- ============================================================
SELECT c.relname AS tabel,
       c.relrowsecurity AS rls_aktif,
       (SELECT count(*) FROM pg_policies p
         WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS jumlah_policy
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND c.relname IN ('grup_pilihan', 'opsi_pilihan', 'menu_grup')
 ORDER BY c.relname;

-- ============================================================
-- CEK 2. Hak tabel per peran
-- Harapan: anon dan authenticated semua false; service_role baca, tambah, ubah = true, hapus = false
-- ============================================================
SELECT t.tabel,
       r.peran,
       has_table_privilege(r.peran, 'public.' || t.tabel, 'SELECT') AS baca,
       has_table_privilege(r.peran, 'public.' || t.tabel, 'INSERT') AS tambah,
       has_table_privilege(r.peran, 'public.' || t.tabel, 'UPDATE') AS ubah,
       has_table_privilege(r.peran, 'public.' || t.tabel, 'DELETE') AS hapus
  FROM (VALUES ('grup_pilihan'), ('opsi_pilihan'), ('menu_grup')) AS t(tabel)
 CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(peran)
 ORDER BY t.tabel, r.peran;

-- ============================================================
-- CEK 3. Fungsi: ada, SECURITY DEFINER, search_path kosong, hak EXECUTE
-- Harapan: 8 baris (grup_daftar, grup_nonaktif, grup_simpan, menu_daftar, menu_grup_atur, opsi_periksa,
--          dan menu_simpan dua kali, lihat catatan). security_definer = true, konfigurasi memuat search_path="",
--          anon = false, authenticated = false, service_role = true.
-- Catatan: menu_simpan tampil dua baris (versi 6 dan 7 argumen) karena versi lama belum dibuang; keduanya tidak disentuh.
-- ============================================================
SELECT p.proname AS fungsi,
       pg_get_function_identity_arguments(p.oid) AS argumen,
       p.prosecdef AS security_definer,
       p.proconfig AS konfigurasi,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated,
       has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('grup_simpan', 'grup_nonaktif', 'grup_daftar', 'menu_grup_atur',
                     'opsi_periksa', 'menu_daftar', 'menu_simpan')
 ORDER BY p.proname, argumen;

-- ============================================================
-- CEK 4. Pengaturan baru
-- Harapan: 2 baris: grup_maks_per_menu = 3 dan opsi_maks_per_grup = 6
-- ============================================================
SELECT kunci, nilai, keterangan
  FROM public.pengaturan
 WHERE kunci IN ('grup_maks_per_menu', 'opsi_maks_per_grup')
 ORDER BY kunci;

-- ============================================================
-- CEK 5. Pagar di tabel (constraint dan indeks)
-- Harapan: constraint nama, urutan, bawaan_aktif, kunci utama, dan kunci asing ada;
--          indeks unik grup_pilihan_nama_aktif_uniq, opsi_pilihan_nama_aktif_uniq, opsi_pilihan_bawaan_uniq ada
--          dan memuat kata WHERE (indeks sebagian).
-- ============================================================
SELECT conrelid::regclass::text AS tabel,
       conname AS nama,
       pg_get_constraintdef(oid) AS definisi
  FROM pg_constraint
 WHERE conrelid IN ('public.grup_pilihan'::regclass,
                    'public.opsi_pilihan'::regclass,
                    'public.menu_grup'::regclass)
 ORDER BY 1, 2;

-- (jalankan terpisah dari query di atas)
SELECT tablename AS tabel, indexname AS indeks, indexdef AS definisi
  FROM pg_indexes
 WHERE schemaname = 'public'
   AND tablename IN ('grup_pilihan', 'opsi_pilihan', 'menu_grup')
 ORDER BY tablename, indexname;

-- ============================================================
-- CEK 6. Bentuk balasan menu_daftar (field `grup` ada, menu lama tetap berisi `grup` = [])
-- Harapan: kolom ada_field_grup = true untuk semua baris; jumlah_grup = 0 selama belum ada grup terpasang.
-- ============================================================
SELECT e ->> 'nama' AS menu,
       (e ? 'grup') AS ada_field_grup,
       jsonb_array_length(e -> 'grup') AS jumlah_grup
  FROM jsonb_array_elements(public.menu_daftar(true)) AS e
 ORDER BY 1;
