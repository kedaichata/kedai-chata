-- supabase/templates/20261109_04_catatan_fungsi_cek.sql
-- Cek hasil migration 20261109_04_catatan_fungsi.sql (ORD.09). SEMUA query BACA-SAJA; boleh dijalankan berulang.
-- Jalankan di SQL Editor (akun ketua), satu per satu, tempel hasilnya ke chat sebagai bukti (AGENTS.md bagian 10).
-- Tanpa data nyata: query tidak menampilkan nama, nomor WA, alamat, atau isi catatan.

-- 1. Dua fungsi ada, SECURITY DEFINER, search_path kosong, hak hanya postgres dan service_role.
--    Hasil benar: 2 baris; security_definer = true; konfigurasi memuat search_path="";
--    kolom hak TIDAK memuat anon, authenticated, dan entri tanpa nama peran di depan "=" (PUBLIC).
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS argumen,
       p.prosecdef                               AS security_definer,
       p.proconfig                               AS konfigurasi,
       p.proacl::text                            AS hak
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('catatan_tambah', 'catatan_dibaca')
 ORDER BY p.proname;

-- 2. Siapa yang boleh EXECUTE. Hasil benar: anon false false; authenticated false false; service_role true true.
SELECT r.rolname,
       has_function_privilege(r.rolname, 'public.catatan_tambah(uuid, uuid, text)', 'EXECUTE') AS tambah,
       has_function_privilege(r.rolname, 'public.catatan_dibaca(uuid, uuid)',       'EXECUTE') AS dibaca
  FROM pg_roles r
 WHERE r.rolname IN ('anon', 'authenticated', 'service_role')
 ORDER BY r.rolname;

-- 3. Hak tabel tidak berubah. Hasil benar:
--    service_role: catatan_order select true, insert true, update false, delete false;
--                  baca_catatan  select true, insert true, update true,  delete false;
--    anon dan authenticated: semua false.
SELECT t.tabel, r.rolname,
       has_table_privilege(r.rolname, t.tabel, 'SELECT') AS pilih,
       has_table_privilege(r.rolname, t.tabel, 'INSERT') AS tambah,
       has_table_privilege(r.rolname, t.tabel, 'UPDATE') AS ubah,
       has_table_privilege(r.rolname, t.tabel, 'DELETE') AS hapus
  FROM (VALUES ('public.catatan_order'), ('public.baca_catatan')) AS t(tabel)
 CROSS JOIN pg_roles r
 WHERE r.rolname IN ('anon', 'authenticated', 'service_role')
 ORDER BY t.tabel, r.rolname;

-- 4. Batas catatan di pengaturan. Hasil benar: dua baris, angka bulat lebih dari 0 (nilai awal 200 dan 10).
SELECT g.kunci, g.nilai
  FROM public.pengaturan g
 WHERE g.kunci IN ('catatan_maks_karakter', 'catatan_maks_per_order')
 ORDER BY g.kunci;

-- 5. Panjang nama penulis catatan: tabel `catatan_order` menolak nama di luar 3 sampai 30 karakter.
--    Hasil benar: kolom di_luar_batas = 0 di kedua baris (hanya angka, tanpa nama).
SELECT 'staf' AS sumber,
       count(*) AS jumlah,
       count(*) FILTER (WHERE char_length(nama_tampilan) < 3 OR char_length(nama_tampilan) > 30) AS di_luar_batas
  FROM public.staf
UNION ALL
SELECT 'profil',
       count(*),
       count(*) FILTER (WHERE char_length(nama_tampilan) < 3 OR char_length(nama_tampilan) > 30)
  FROM public.profil;

-- 6. Tidak ada order yang catatannya melebihi batas jumlah. Hasil benar: 0 baris.
SELECT c.order_id, count(*) AS jumlah
  FROM public.catatan_order c
 GROUP BY c.order_id
HAVING count(*) > (SELECT g.nilai::integer FROM public.pengaturan g WHERE g.kunci = 'catatan_maks_per_order');

-- 7. Penunjuk baca tidak pernah menunjuk catatan milik order lain. Hasil benar: penunjuk_salah = 0.
SELECT count(*) AS penunjuk_salah
  FROM public.baca_catatan b
  JOIN public.catatan_order c ON c.id = b.catatan_terakhir_id
 WHERE c.order_id <> b.order_id;

-- 8. SESUDAH `kedai` di-deploy dan dites di konsol: 20 catatan terbaru (tanpa isi, hanya panjangnya).
--    Cek: peran_penulis hanya customer atau owner; waktu_wajar = true (waktu dari server, SEC-19);
--    catatan di order Diproses ke atas, Ditolak, atau Dibatalkan hanya yang ditulis SEBELUM status itu.
SELECT c.id, o.nomor, o.status, c.peran_penulis,
       char_length(c.isi) AS panjang_isi,
       c.waktu,
       (c.waktu <= now()) AS waktu_wajar
  FROM public.catatan_order c
  JOIN public."order" o ON o.id = c.order_id
 ORDER BY c.id DESC
 LIMIT 20;

-- 9. SESUDAH dites: penunjuk baca terhadap catatan terbaru tiap order (tanpa id akun).
--    Hasil benar: catatan_terakhir_id tidak pernah lebih besar dari catatan_terbaru.
SELECT o.nomor, b.catatan_terakhir_id, b.waktu,
       (SELECT max(c.id) FROM public.catatan_order c WHERE c.order_id = b.order_id) AS catatan_terbaru
  FROM public.baca_catatan b
  JOIN public."order" o ON o.id = b.order_id
 ORDER BY b.waktu DESC
 LIMIT 20;
