-- supabase/templates/20261107_04_menu_grup_pilihan_uji.sql
-- Uji PERILAKU fungsi MNU.09 giliran 1 (20261107_04_menu_grup_pilihan.sql). Tanpa data nyata.
-- Dijalankan di SQL Editor (akun ketua) sebagai SATU blok, lalu tempel laporannya ke chat sebagai bukti.
--
-- Cara kerja:
--   - Seluruh uji ada dalam satu blok DO. Di akhir blok, laporan dikeluarkan lewat galat yang DISENGAJA,
--     sehingga SEMUA grup, opsi, dan pemasangan uji dibatalkan otomatis. Tidak ada data uji yang tersisa.
--     Jadi hasil yang benar tampil sebagai kotak MERAH berisi "LAPORAN UJI". Itu normal, bukan kegagalan.
--   - Tidak ada ID yang perlu diisi: uji memilih sendiri satu owner aktif, satu penjaga aktif (bila ada),
--     dan dua menu yang sudah ada. ID tidak ikut ditampilkan di laporan.
--   - Syarat: belum ada grup pilihan sama sekali (jalankan SEBELUM owner membuat grup), minimal 1 owner aktif,
--     dan minimal 2 menu. Bila syarat tidak terpenuhi, uji berhenti dengan pesan jelas dan tidak mengubah apa pun.
--   - Baris laporan: LULUS, GAGAL, atau LEWAT (uji dilewati karena prasyaratnya tidak ada, misalnya tidak ada penjaga).
--
-- Setelah blok dijalankan, jalankan juga CEK SESUDAH UJI di bagian paling bawah (bukti bahwa semuanya terbatalkan).

DO $uji$
DECLARE
  v_owner   uuid;
  v_penjaga uuid;
  v_menu1   uuid;
  v_menu2   uuid;
  v_g1      uuid;
  v_g2      uuid;
  v_g3      uuid;
  v_g4      uuid;
  v_o1      uuid;
  v_o2      uuid;
  v_o3      uuid;
  v_o4      uuid;
  v_lain    uuid;
  v_err     text;
  v_t       text;
  v_n       integer;
  v_n2      integer;
  v_j       jsonb;
  v_j2      jsonb;
  v_lap     text := '';
  v_lulus   integer;
  v_gagal   integer;
BEGIN
  -- ---------- Prasyarat ----------
  SELECT s.id INTO v_owner   FROM public.staf s WHERE s.aktif AND s.peran = 'owner'   ORDER BY s.id LIMIT 1;
  SELECT s.id INTO v_penjaga FROM public.staf s WHERE s.aktif AND s.peran = 'penjaga' ORDER BY s.id LIMIT 1;
  SELECT m.id INTO v_menu1 FROM public.menu m ORDER BY m.id LIMIT 1;
  SELECT m.id INTO v_menu2 FROM public.menu m ORDER BY m.id OFFSET 1 LIMIT 1;

  IF v_owner IS NULL OR v_menu1 IS NULL OR v_menu2 IS NULL THEN
    RAISE EXCEPTION 'Uji berhenti: butuh minimal 1 owner aktif dan 2 menu. Tidak ada yang diubah.';
  END IF;
  SELECT count(*) INTO v_n FROM public.grup_pilihan;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'Uji berhenti: sudah ada grup pilihan di database; uji ini butuh database tanpa grup. Tidak ada yang diubah.';
  END IF;

  -- ---------- Bagian A: membuat dan menolak grup ----------
  v_g1 := public.grup_simpan(
    v_owner, NULL, '  Uji   pedas ',
    '[{"nama":"Tidak pedas","bawaan":true},{"nama":" Sedang "},{"nama":"Pedas"}]'::jsonb
  );
  SELECT g.nama INTO v_t FROM public.grup_pilihan g WHERE g.id = v_g1;
  v_lap := v_lap || format(E'%s  T01 grup baru tersimpan, nama dirapikan (dapat: %s)\n',
    CASE WHEN v_t = 'Uji pedas' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_t, 'kosong'));

  SELECT string_agg(o.nama, ',' ORDER BY o.urutan) INTO v_t FROM public.opsi_pilihan o WHERE o.grup_id = v_g1;
  v_lap := v_lap || format(E'%s  T02 opsi tersimpan sesuai urutan, nama opsi dirapikan (dapat: %s)\n',
    CASE WHEN v_t = 'Tidak pedas,Sedang,Pedas' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_t, 'kosong'));

  SELECT o.nama INTO v_t FROM public.opsi_pilihan o WHERE o.grup_id = v_g1 AND o.bawaan;
  SELECT count(*) INTO v_n FROM public.opsi_pilihan o WHERE o.grup_id = v_g1 AND o.bawaan;
  v_lap := v_lap || format(E'%s  T03 tepat satu opsi bawaan, yaitu Tidak pedas (dapat: %s buah, %s)\n',
    CASE WHEN v_n = 1 AND v_t = 'Tidak pedas' THEN 'LULUS' ELSE 'GAGAL' END, v_n, COALESCE(v_t, 'kosong'));

  IF v_penjaga IS NULL THEN
    v_lap := v_lap || E'LEWAT  T04 penjaga tidak boleh membuat grup (tidak ada penjaga aktif)\n';
  ELSE
    v_err := NULL;
    BEGIN
      PERFORM public.grup_simpan(v_penjaga, NULL, 'Uji galat', '[{"nama":"Aa","bawaan":true},{"nama":"Bb"}]'::jsonb);
    EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
    END;
    v_lap := v_lap || format(E'%s  T04 penjaga tidak boleh membuat grup (dapat: %s)\n',
      CASE WHEN v_err IS NOT DISTINCT FROM 'bukan_owner' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));
  END IF;

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(NULL, NULL, 'Uji galat', '[{"nama":"Aa","bawaan":true},{"nama":"Bb"}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T05 pelaku kosong ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'id_kosong' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, NULL, 'Uji galat', '[{"nama":"Aa"},{"nama":"Bb"}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T06 tanpa opsi bawaan ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, NULL, 'Uji galat', '[{"nama":"Aa","bawaan":true},{"nama":"Bb","bawaan":true}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T07 dua opsi bawaan ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, NULL, 'Uji galat', '[{"nama":"Aa","bawaan":true,"aktif":false},{"nama":"Bb"}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T08 opsi bawaan yang nonaktif ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, NULL, 'Uji galat', '[{"nama":"Aa","bawaan":true},{"nama":"Bb","aktif":false}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T09 hanya satu opsi aktif ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, NULL, 'Uji galat', '[{"nama":"Aa","bawaan":true}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T10 daftar dengan satu opsi saja ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, NULL, 'Uji galat',
      '[{"nama":"Aa","bawaan":true},{"nama":"Bb"},{"nama":"Cc"},{"nama":"Dd"},{"nama":"Ee"},{"nama":"Ff"},{"nama":"Gg"}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T11 7 opsi aktif melebihi batas 6 ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_terlalu_banyak' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, NULL, 'Uji galat', '[{"nama":"Pedas","bawaan":true},{"nama":"PEDAS"}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T12 nama opsi kembar (beda huruf besar) ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_nama_kembar' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, NULL, 'UJI PEDAS', '[{"nama":"Aa","bawaan":true},{"nama":"Bb"}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T13 nama grup kembar (beda huruf besar) ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'grup_nama_kembar' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, NULL, 'ab', '[{"nama":"Aa","bawaan":true},{"nama":"Bb"}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T14 nama grup 2 karakter ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'grup_nama_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, NULL, repeat('a', 31), '[{"nama":"Aa","bawaan":true},{"nama":"Bb"}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T15 nama grup 31 karakter ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'grup_nama_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, NULL, 'Uji galat', '{"a":1}'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T16 daftar opsi yang bukan array ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, NULL, 'Uji galat', '[{"id":"abc","nama":"Aa","bawaan":true},{"nama":"Bb"}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T17 id opsi yang bukan uuid ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, NULL, 'Uji galat', '[{"nama":"Aa","bawaan":"ya"},{"nama":"Bb"}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T18 penanda bawaan berupa teks ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, NULL, 'Uji galat', '[{"nama":5,"bawaan":true},{"nama":"Bb"}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T19 nama opsi berupa angka ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  SELECT o.id INTO v_o1 FROM public.opsi_pilihan o WHERE o.grup_id = v_g1 AND o.nama = 'Tidak pedas';
  SELECT o.id INTO v_o2 FROM public.opsi_pilihan o WHERE o.grup_id = v_g1 AND o.nama = 'Sedang';
  SELECT o.id INTO v_o3 FROM public.opsi_pilihan o WHERE o.grup_id = v_g1 AND o.nama = 'Pedas';

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, NULL, 'Uji galat',
      jsonb_build_array(
        jsonb_build_object('id', v_o1, 'nama', 'Aa', 'bawaan', true),
        jsonb_build_object('nama', 'Bb')));
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T20 grup baru yang membawa id opsi lama ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  -- ---------- Bagian B: mengubah grup ----------
  -- Ganti bawaan ke Sedang, nonaktifkan Pedas, tambah Extra pedas
  PERFORM public.grup_simpan(v_owner, v_g1, 'Uji pedas',
    jsonb_build_array(
      jsonb_build_object('id', v_o1, 'nama', 'Tidak pedas', 'bawaan', false),
      jsonb_build_object('id', v_o2, 'nama', 'Sedang', 'bawaan', true),
      jsonb_build_object('id', v_o3, 'nama', 'Pedas', 'aktif', false),
      jsonb_build_object('nama', 'Extra pedas')));
  SELECT o.id INTO v_o4 FROM public.opsi_pilihan o WHERE o.grup_id = v_g1 AND o.nama = 'Extra pedas';

  SELECT o.nama INTO v_t FROM public.opsi_pilihan o WHERE o.grup_id = v_g1 AND o.bawaan;
  SELECT count(*) INTO v_n FROM public.opsi_pilihan o WHERE o.grup_id = v_g1;
  SELECT count(*) INTO v_n2 FROM public.opsi_pilihan o WHERE o.grup_id = v_g1 AND o.nama = 'Pedas' AND NOT o.aktif AND NOT o.bawaan;
  v_lap := v_lap || format(E'%s  T21 ubah grup: bawaan pindah ke Sedang, Pedas nonaktif, Extra pedas ditambah (bawaan: %s, total opsi: %s, Pedas nonaktif: %s)\n',
    CASE WHEN v_t = 'Sedang' AND v_n = 4 AND v_n2 = 1 AND v_o4 IS NOT NULL THEN 'LULUS' ELSE 'GAGAL' END,
    COALESCE(v_t, 'kosong'), v_n, v_n2);

  v_g2 := public.grup_simpan(v_owner, NULL, 'Uji suhu', '[{"nama":"Dingin","bawaan":true},{"nama":"Panas"}]'::jsonb);
  SELECT o.id INTO v_lain FROM public.opsi_pilihan o WHERE o.grup_id = v_g2 ORDER BY o.urutan LIMIT 1;

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, v_g1, 'Uji pedas',
      jsonb_build_array(
        jsonb_build_object('id', v_o1, 'nama', 'Tidak pedas'),
        jsonb_build_object('id', v_o2, 'nama', 'Sedang', 'bawaan', true)));
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T22 daftar opsi tidak lengkap (opsi lama kurang) ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_lengkap' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, v_g1, 'Uji pedas',
      jsonb_build_array(
        jsonb_build_object('id', v_o1, 'nama', 'Tidak pedas'),
        jsonb_build_object('id', v_o2, 'nama', 'Sedang', 'bawaan', true),
        jsonb_build_object('id', v_o3, 'nama', 'Pedas', 'aktif', false),
        jsonb_build_object('id', v_lain, 'nama', 'Extra pedas')));
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T23 id opsi milik grup lain pada daftar ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_lengkap' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  -- Dua opsi bertukar nama dalam satu simpan, bawaan pindah ke Tidak pedas
  PERFORM public.grup_simpan(v_owner, v_g1, 'Uji pedas',
    jsonb_build_array(
      jsonb_build_object('id', v_o1, 'nama', 'Sedang'),
      jsonb_build_object('id', v_o2, 'nama', 'Tidak pedas', 'bawaan', true),
      jsonb_build_object('id', v_o3, 'nama', 'Pedas', 'aktif', false),
      jsonb_build_object('id', v_o4, 'nama', 'Extra pedas')));
  SELECT o.nama INTO v_t FROM public.opsi_pilihan o WHERE o.id = v_o1;
  SELECT o.nama INTO v_err FROM public.opsi_pilihan o WHERE o.id = v_o2;
  SELECT count(*) INTO v_n FROM public.opsi_pilihan o WHERE o.grup_id = v_g1 AND o.bawaan AND o.id = v_o2;
  v_lap := v_lap || format(E'%s  T24 dua opsi bertukar nama dan bawaan pindah dalam satu simpan (opsi 1: %s, opsi 2: %s, bawaan di opsi 2: %s)\n',
    CASE WHEN v_t = 'Sedang' AND v_err = 'Tidak pedas' AND v_n = 1 THEN 'LULUS' ELSE 'GAGAL' END,
    COALESCE(v_t, 'kosong'), COALESCE(v_err, 'kosong'), v_n);

  SELECT jsonb_agg(jsonb_build_object('id', o.id, 'nama', o.nama, 'bawaan', o.bawaan, 'aktif', o.aktif) ORDER BY o.urutan, o.id)
    INTO v_j2
    FROM public.opsi_pilihan o WHERE o.grup_id = v_g2;
  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, v_g2, 'Uji pedas', v_j2);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T25 mengganti nama grup menjadi nama grup aktif lain ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'grup_nama_kembar' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, gen_random_uuid(), 'Uji galat', '[{"nama":"Aa","bawaan":true},{"nama":"Bb"}]'::jsonb);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T26 mengubah grup yang tidak ada ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'grup_tidak_ditemukan' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  -- ---------- Bagian C: memasang grup ke menu ----------
  PERFORM public.menu_grup_atur(v_owner, v_menu1, ARRAY[v_g1]);
  SELECT e INTO v_j FROM jsonb_array_elements(public.menu_daftar(true)) AS e WHERE e ->> 'id' = v_menu1::text;
  SELECT jsonb_array_length(x -> 'opsi') INTO v_n
    FROM jsonb_array_elements(v_j -> 'grup') AS x WHERE x ->> 'nama' = 'Uji pedas';
  v_lap := v_lap || format(E'%s  T27 grup terpasang di menu dan tampil di menu_daftar dengan 3 opsi aktif (jumlah grup: %s, opsi aktif: %s)\n',
    CASE WHEN jsonb_array_length(v_j -> 'grup') = 1 AND v_n = 3 THEN 'LULUS' ELSE 'GAGAL' END,
    jsonb_array_length(v_j -> 'grup'), COALESCE(v_n::text, 'kosong'));
  v_lap := v_lap || format(E'%s  T28 opsi nonaktif (Pedas) tidak tampil di menu_daftar\n',
    CASE WHEN (v_j -> 'grup' -> 0 -> 'opsi')::text NOT LIKE '%"Pedas"%' THEN 'LULUS' ELSE 'GAGAL' END);

  v_g3 := public.grup_simpan(v_owner, NULL, 'Uji porsi', '[{"nama":"Biasa","bawaan":true},{"nama":"Besar"}]'::jsonb);
  v_g4 := public.grup_simpan(v_owner, NULL, 'Uji nasi',  '[{"nama":"Hangat","bawaan":true},{"nama":"Dingin"}]'::jsonb);

  v_err := NULL;
  BEGIN
    PERFORM public.menu_grup_atur(v_owner, v_menu1, ARRAY[v_g1, v_g2, v_g3, v_g4]);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T29 4 grup di satu menu melebihi batas 3 ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'grup_terlalu_banyak' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  PERFORM public.menu_grup_atur(v_owner, v_menu1, ARRAY[v_g2, v_g1, v_g3]);
  SELECT e INTO v_j FROM jsonb_array_elements(public.menu_daftar(true)) AS e WHERE e ->> 'id' = v_menu1::text;
  SELECT string_agg(x ->> 'nama', ',' ORDER BY ord) INTO v_t FROM jsonb_array_elements(v_j -> 'grup') WITH ORDINALITY AS t(x, ord);
  v_lap := v_lap || format(E'%s  T30 3 grup terpasang, urutan tampil mengikuti urutan pemasangan (dapat: %s)\n',
    CASE WHEN v_t = 'Uji suhu,Uji pedas,Uji porsi' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_t, 'kosong'));

  PERFORM public.grup_nonaktif(v_owner, v_g4);
  v_err := NULL;
  BEGIN
    PERFORM public.menu_grup_atur(v_owner, v_menu1, ARRAY[v_g4]);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T31 grup nonaktif tidak bisa dipasang (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'grup_tidak_ditemukan' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  -- Melepas grup: baris pemasangan tidak dihapus, hanya ditandai tidak aktif
  PERFORM public.menu_grup_atur(v_owner, v_menu1, ARRAY[v_g1]);
  SELECT e INTO v_j FROM jsonb_array_elements(public.menu_daftar(true)) AS e WHERE e ->> 'id' = v_menu1::text;
  SELECT count(*) INTO v_n  FROM public.menu_grup mg WHERE mg.menu_id = v_menu1;
  SELECT count(*) INTO v_n2 FROM public.menu_grup mg WHERE mg.menu_id = v_menu1 AND mg.aktif;
  v_lap := v_lap || format(E'%s  T32 melepas grup: menu_daftar tinggal 1 grup, baris pemasangan tetap ada (grup di menu_daftar: %s, baris: %s, aktif: %s)\n',
    CASE WHEN jsonb_array_length(v_j -> 'grup') = 1 AND v_n = 3 AND v_n2 = 1 THEN 'LULUS' ELSE 'GAGAL' END,
    jsonb_array_length(v_j -> 'grup'), v_n, v_n2);

  PERFORM public.menu_grup_atur(v_owner, v_menu1, ARRAY[]::uuid[]);
  SELECT e INTO v_j FROM jsonb_array_elements(public.menu_daftar(true)) AS e WHERE e ->> 'id' = v_menu1::text;
  v_lap := v_lap || format(E'%s  T33 daftar kosong melepas semua grup (grup di menu_daftar: %s)\n',
    CASE WHEN jsonb_array_length(v_j -> 'grup') = 0 THEN 'LULUS' ELSE 'GAGAL' END, jsonb_array_length(v_j -> 'grup'));
  PERFORM public.menu_grup_atur(v_owner, v_menu1, ARRAY[v_g1]);

  v_err := NULL;
  BEGIN
    PERFORM public.menu_grup_atur(v_owner, v_menu1, ARRAY[v_g1, v_g1]);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T34 id grup dobel ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'grup_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.menu_grup_atur(v_owner, v_menu1, ARRAY[v_g1, NULL]::uuid[]);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T35 elemen kosong pada daftar grup ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'grup_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.menu_grup_atur(v_owner, v_menu1, NULL);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T36 daftar grup NULL ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'grup_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.menu_grup_atur(v_owner, v_menu1, ARRAY[gen_random_uuid()]);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T37 id grup yang tidak ada ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'grup_tidak_ditemukan' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.menu_grup_atur(v_owner, gen_random_uuid(), ARRAY[v_g1]);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T38 menu yang tidak ada ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'menu_tidak_ditemukan' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  IF v_penjaga IS NULL THEN
    v_lap := v_lap || E'LEWAT  T39 penjaga tidak boleh memasang grup atau menonaktifkannya (tidak ada penjaga aktif)\n';
  ELSE
    v_err := NULL;
    BEGIN
      PERFORM public.menu_grup_atur(v_penjaga, v_menu1, ARRAY[v_g1]);
    EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
    END;
    v_t := v_err;
    v_err := NULL;
    BEGIN
      PERFORM public.grup_nonaktif(v_penjaga, v_g1);
    EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
    END;
    v_lap := v_lap || format(E'%s  T39 penjaga tidak boleh memasang grup atau menonaktifkannya (dapat: %s dan %s)\n',
      CASE WHEN v_t IS NOT DISTINCT FROM 'bukan_owner' AND v_err IS NOT DISTINCT FROM 'bukan_owner' THEN 'LULUS' ELSE 'GAGAL' END,
      COALESCE(v_t, 'tanpa galat'), COALESCE(v_err, 'tanpa galat'));
  END IF;

  -- ---------- Bagian D: opsi_periksa (dipakai ORD.01 nanti). Menu 1 punya grup Uji pedas saja ----------
  v_j := public.opsi_periksa(v_menu1, ARRAY[]::uuid[]);
  v_lap := v_lap || format(E'%s  T40 tanpa pilihan: memakai opsi bawaan (dapat: %s)\n',
    CASE WHEN jsonb_array_length(v_j) = 1 AND v_j -> 0 ->> 'opsi_nama' = 'Tidak pedas' AND v_j -> 0 ->> 'grup_nama' = 'Uji pedas'
         THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_j -> 0 ->> 'opsi_nama', 'kosong'));

  v_j := public.opsi_periksa(v_menu1, NULL);
  v_lap := v_lap || format(E'%s  T41 daftar pilihan NULL dianggap tanpa pilihan (dapat: %s)\n',
    CASE WHEN jsonb_array_length(v_j) = 1 AND v_j -> 0 ->> 'opsi_nama' = 'Tidak pedas' THEN 'LULUS' ELSE 'GAGAL' END,
    COALESCE(v_j -> 0 ->> 'opsi_nama', 'kosong'));

  v_j := public.opsi_periksa(v_menu1, ARRAY[v_o4]);
  v_lap := v_lap || format(E'%s  T42 pilihan sah dipakai (dapat: %s)\n',
    CASE WHEN jsonb_array_length(v_j) = 1 AND v_j -> 0 ->> 'opsi_nama' = 'Extra pedas' THEN 'LULUS' ELSE 'GAGAL' END,
    COALESCE(v_j -> 0 ->> 'opsi_nama', 'kosong'));

  v_err := NULL;
  BEGIN
    PERFORM public.opsi_periksa(v_menu1, ARRAY[v_o3]);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T43 opsi nonaktif ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.opsi_periksa(v_menu1, ARRAY[v_lain]);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T44 opsi dari grup yang tidak terpasang di menu itu ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.opsi_periksa(v_menu1, ARRAY[v_o1, v_o4]);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T45 dua opsi dari grup yang sama ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.opsi_periksa(v_menu1, ARRAY[v_o4, v_o4]);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T46 id opsi dobel ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.opsi_periksa(v_menu1, ARRAY[v_o4, NULL]::uuid[]);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T47 elemen kosong pada daftar opsi ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.opsi_periksa(v_menu1, ARRAY[gen_random_uuid()]);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T48 id opsi yang tidak ada ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_j := public.opsi_periksa(v_menu2, ARRAY[]::uuid[]);
  v_lap := v_lap || format(E'%s  T49 menu tanpa grup mengembalikan daftar kosong (panjang: %s)\n',
    CASE WHEN jsonb_array_length(v_j) = 0 THEN 'LULUS' ELSE 'GAGAL' END, jsonb_array_length(v_j));

  v_err := NULL;
  BEGIN
    PERFORM public.opsi_periksa(v_menu2, ARRAY[v_o4]);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T50 menu tanpa grup menolak opsi apa pun (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  v_err := NULL;
  BEGIN
    PERFORM public.opsi_periksa(gen_random_uuid(), ARRAY[]::uuid[]);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T51 menu yang tidak ada ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'menu_tidak_ditemukan' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  -- ---------- Bagian E: menonaktifkan dan mengaktifkan kembali grup ----------
  PERFORM public.grup_nonaktif(v_owner, v_g1);
  SELECT e INTO v_j FROM jsonb_array_elements(public.menu_daftar(true)) AS e WHERE e ->> 'id' = v_menu1::text;
  v_lap := v_lap || format(E'%s  T52 grup nonaktif tidak tampil di menu_daftar (grup: %s)\n',
    CASE WHEN jsonb_array_length(v_j -> 'grup') = 0 THEN 'LULUS' ELSE 'GAGAL' END, jsonb_array_length(v_j -> 'grup'));

  v_j := public.opsi_periksa(v_menu1, ARRAY[]::uuid[]);
  v_lap := v_lap || format(E'%s  T53 grup nonaktif tidak ikut dihitung di opsi_periksa (panjang: %s)\n',
    CASE WHEN jsonb_array_length(v_j) = 0 THEN 'LULUS' ELSE 'GAGAL' END, jsonb_array_length(v_j));

  v_err := NULL;
  BEGIN
    PERFORM public.opsi_periksa(v_menu1, ARRAY[v_o4]);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T54 opsi dari grup nonaktif ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'opsi_tidak_valid' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  SELECT jsonb_agg(jsonb_build_object('id', o.id, 'nama', o.nama, 'bawaan', o.bawaan, 'aktif', o.aktif) ORDER BY o.urutan, o.id)
    INTO v_j2
    FROM public.opsi_pilihan o WHERE o.grup_id = v_g1;

  v_err := NULL;
  BEGIN
    PERFORM public.grup_simpan(v_owner, v_g1, 'Uji pedas', v_j2);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T55 mengubah grup nonaktif tanpa mengaktifkannya ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'grup_tidak_aktif' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  PERFORM public.grup_simpan(v_owner, v_g1, 'Uji pedas', v_j2, true);
  SELECT e INTO v_j FROM jsonb_array_elements(public.menu_daftar(true)) AS e WHERE e ->> 'id' = v_menu1::text;
  SELECT g.aktif::text INTO v_t FROM public.grup_pilihan g WHERE g.id = v_g1;
  v_lap := v_lap || format(E'%s  T56 grup diaktifkan kembali lewat grup_simpan dan muncul lagi di menu tanpa dipasang ulang (aktif: %s, grup di menu: %s)\n',
    CASE WHEN v_t = 'true' AND jsonb_array_length(v_j -> 'grup') = 1 THEN 'LULUS' ELSE 'GAGAL' END,
    COALESCE(v_t, 'kosong'), jsonb_array_length(v_j -> 'grup'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_nonaktif(v_owner, gen_random_uuid());
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T57 menonaktifkan grup yang tidak ada ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'grup_tidak_ditemukan' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  -- ---------- Bagian F: grup_daftar ----------
  -- Keadaan sekarang: Uji pedas, Uji suhu, Uji porsi aktif; Uji nasi nonaktif
  v_j := public.grup_daftar(true);
  v_j2 := public.grup_daftar(false);
  v_lap := v_lap || format(E'%s  T58 grup_daftar(true) memuat semua grup, grup_daftar(false) hanya yang aktif (semua: %s, aktif: %s)\n',
    CASE WHEN jsonb_array_length(v_j) = 4 AND jsonb_array_length(v_j2) = 3 THEN 'LULUS' ELSE 'GAGAL' END,
    jsonb_array_length(v_j), jsonb_array_length(v_j2));

  SELECT jsonb_array_length(x -> 'opsi') INTO v_n  FROM jsonb_array_elements(v_j)  AS x WHERE x ->> 'nama' = 'Uji pedas';
  SELECT jsonb_array_length(x -> 'opsi') INTO v_n2 FROM jsonb_array_elements(v_j2) AS x WHERE x ->> 'nama' = 'Uji pedas';
  v_lap := v_lap || format(E'%s  T59 opsi nonaktif ikut muncul di grup_daftar(true) tetapi tidak di grup_daftar(false) (semua: %s, aktif: %s)\n',
    CASE WHEN v_n = 4 AND v_n2 = 3 THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_n::text, 'kosong'), COALESCE(v_n2::text, 'kosong'));

  v_err := NULL;
  BEGIN
    PERFORM public.grup_nonaktif(NULL, v_g1);
  EXCEPTION WHEN OTHERS THEN v_err := SQLERRM;
  END;
  v_lap := v_lap || format(E'%s  T60 menonaktifkan grup dengan pelaku kosong ditolak (dapat: %s)\n',
    CASE WHEN v_err IS NOT DISTINCT FROM 'id_kosong' THEN 'LULUS' ELSE 'GAGAL' END, COALESCE(v_err, 'tanpa galat'));

  -- ---------- Laporan (galat disengaja supaya semua data uji dibatalkan) ----------
  v_lulus := (length(v_lap) - length(replace(v_lap, 'LULUS  ', ''))) / 7;
  v_gagal := (length(v_lap) - length(replace(v_lap, 'GAGAL  ', ''))) / 7;

  RAISE EXCEPTION E'\n=== LAPORAN UJI MNU.09 giliran 1 ===\n(Galat ini disengaja: seluruh data uji dibatalkan otomatis.)\nRingkasan: % lulus, % gagal\n\n%',
    v_lulus, v_gagal, v_lap;
END;
$uji$;

-- ============================================================
-- CEK SESUDAH UJI (jalankan TERPISAH setelah blok di atas, di query baru)
-- Bukti bahwa semua data uji terbatalkan.
-- Harapan: ketiga jumlah = 0 (selama owner belum membuat grup sungguhan).
-- ============================================================
-- SELECT (SELECT count(*) FROM public.grup_pilihan) AS grup,
--        (SELECT count(*) FROM public.opsi_pilihan) AS opsi,
--        (SELECT count(*) FROM public.menu_grup)    AS pemasangan;
