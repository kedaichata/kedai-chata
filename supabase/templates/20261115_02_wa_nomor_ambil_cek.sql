-- supabase/templates/20261115_02_wa_nomor_ambil_cek.sql
-- Cek BACA-SAJA untuk 20261115_02_wa_nomor_ambil.sql (WAG.02).
-- Hanya SELECT. Tanpa data nyata dan TANPA menampilkan nomor: query hanya menghitung jumlah.
-- Jalankan SATU PER SATU di SQL Editor (akun ketua), lalu tempel hasilnya ke chat.
-- Bukti diperiksa bersama di chat dan tidak disimpan (AGENTS.md bagian 10 butir 2).
-- CATATAN: jangan menjalankan query yang menampilkan isi hasil `wa_nomor_ambil` apa adanya (isinya nomor pribadi).

-- ------------------------------------------------------------
-- CEK A: fungsi ada, tepat satu, SECURITY DEFINER, search_path kosong, STABLE, kembalian jsonb.
-- Yang benar: 1 baris; argumen "p_akun uuid[]"; kembalian jsonb; security_definer = true;
-- config memuat search_path kosong; sifat = s (STABLE, artinya tidak menulis).
-- ------------------------------------------------------------
SELECT p.proname                        AS fungsi,
       pg_get_function_arguments(p.oid) AS argumen,
       pg_get_function_result(p.oid)    AS kembalian,
       p.prosecdef                      AS security_definer,
       p.proconfig                      AS config,
       p.provolatile                    AS sifat
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname = 'wa_nomor_ambil';

-- ------------------------------------------------------------
-- CEK B: hak EXECUTE. Yang benar: service_role = true; anon = false; authenticated = false.
-- ------------------------------------------------------------
SELECT has_function_privilege('service_role',  'public.wa_nomor_ambil(uuid[])', 'EXECUTE') AS service_role,
       has_function_privilege('anon',          'public.wa_nomor_ambil(uuid[])', 'EXECUTE') AS anon,
       has_function_privilege('authenticated', 'public.wa_nomor_ambil(uuid[])', 'EXECUTE') AS authenticated;

-- ------------------------------------------------------------
-- CEK C: EXECUTE tidak terbuka untuk PUBLIC. Yang benar: acl memuat HANYA entri service_role
-- (bentuk "service_role=X/..."), plus entri pemilik (postgres); tanpa entri kosong di depan "=" (itu PUBLIC).
-- ------------------------------------------------------------
SELECT p.proname AS fungsi,
       p.proacl  AS acl
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname = 'wa_nomor_ambil';

-- ------------------------------------------------------------
-- CEK D: hak tabel profil dan staf TIDAK berubah.
-- Yang benar: profil -> service_role INSERT, SELECT, UPDATE; staf -> service_role SELECT saja.
-- Tidak ada baris PUBLIC, anon, atau authenticated. (Baris postgres, pemilik tabel, memang muncul.)
-- ------------------------------------------------------------
SELECT c.relname AS tabel,
       CASE WHEN x.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END AS penerima,
       string_agg(x.privilege_type, ', ' ORDER BY x.privilege_type)               AS hak
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace,
       LATERAL aclexplode(c.relacl) x
 WHERE n.nspname = 'public'
   AND c.relname IN ('profil', 'staf')
 GROUP BY 1, 2
 ORDER BY 1, 2;

-- ------------------------------------------------------------
-- CEK E (hanya jumlah, tanpa nomor): semua akun customer, lalu semua akun staf.
-- Dijalankan dari SQL Editor sebagai pemilik, jadi tidak lewat hak service_role (hak dibuktikan di CEK B dan C).
-- Yang benar sebelum WAG.06 (nomor staf belum diisi):
--   customer_kembali sama dengan jumlah profil yang bukan staf (data 15 Nov 2026: 6),
--   staf_kembali = 0 (nomor staf belum ada).
-- Setelah WAG.06: staf_kembali = jumlah staf aktif yang nomornya terisi.
-- ------------------------------------------------------------
SELECT
  (SELECT count(*)
     FROM jsonb_array_elements(
            public.wa_nomor_ambil(ARRAY(SELECT id FROM public.profil))
          ) e
    WHERE e->>'peran' = 'customer')                         AS customer_kembali,
  (SELECT count(*)
     FROM jsonb_array_elements(
            public.wa_nomor_ambil(ARRAY(SELECT id FROM public.staf))
          ) e
    WHERE e->>'peran' IN ('owner', 'penjaga'))              AS staf_kembali,
  (SELECT count(*) FROM public.profil p
    WHERE NOT EXISTS (SELECT 1 FROM public.staf s WHERE s.id = p.id)) AS profil_bukan_staf,
  (SELECT count(*) FROM public.staf s
    WHERE s.aktif AND s.nomor_wa IS NOT NULL)               AS staf_aktif_bernomor;

-- ------------------------------------------------------------
-- CEK F: akun duplikat dan akun tak dikenal. Yang benar: kolom jumlah_duplikat = 1 (satu akun yang sama
-- dikirim dua kali, hasilnya sekali), jumlah_tak_dikenal = 0 (uuid acak tidak menghasilkan apa-apa),
-- jumlah_null = 0 hasilnya tetap array kosong, bukan galat.
-- Pakai satu akun customer (diambil otomatis, nomornya tidak ditampilkan). Bila tidak ada customer sama sekali, query ini galat id_kosong (bukan kegagalan fungsi).
-- ------------------------------------------------------------
SELECT
  jsonb_array_length(
    public.wa_nomor_ambil(
      (SELECT ARRAY[x.id, x.id]
         FROM (SELECT p.id FROM public.profil p
                WHERE NOT EXISTS (SELECT 1 FROM public.staf s WHERE s.id = p.id)
                ORDER BY p.id LIMIT 1) x)
    )
  )                                                                    AS jumlah_duplikat,
  jsonb_array_length(public.wa_nomor_ambil(ARRAY[gen_random_uuid()])) AS jumlah_tak_dikenal,
  jsonb_array_length(public.wa_nomor_ambil(ARRAY[NULL::uuid]))        AS jumlah_null;

-- ------------------------------------------------------------
-- CEK G: galat daftar kosong (null). Yang benar: GALAT dengan pesan "id_kosong".
-- (Galat di sini adalah hasil yang BENAR.)
-- ------------------------------------------------------------
SELECT public.wa_nomor_ambil(NULL);

-- ------------------------------------------------------------
-- CEK H: galat daftar terlalu panjang (101 elemen). Yang benar: GALAT dengan pesan "daftar_terlalu_panjang".
-- (Galat di sini adalah hasil yang BENAR.)
-- ------------------------------------------------------------
SELECT public.wa_nomor_ambil(ARRAY(SELECT gen_random_uuid() FROM generate_series(1, 101)));

-- ------------------------------------------------------------
-- CEK I: tepat 100 elemen masih diterima. Yang benar: hasil 0 (uuid acak tidak dikenal), tanpa galat.
-- ------------------------------------------------------------
SELECT jsonb_array_length(
         public.wa_nomor_ambil(ARRAY(SELECT gen_random_uuid() FROM generate_series(1, 100)))
       ) AS jumlah_100_elemen;
