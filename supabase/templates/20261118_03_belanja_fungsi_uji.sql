-- supabase/templates/20261118_03_belanja_fungsi_uji.sql
-- Uji perilaku BLJ.02 (fungsi SQL Belanja Warung) dengan akun DUMMY.
-- Dijalankan MANUAL di SQL Editor (akun ketua), SEKALI, setelah migration 20261118_03_belanja_fungsi.sql.
-- Berkas di repo tetap berisi id nol (placeholder). Empat id akun dummy HANYA diisi di salinan
-- di SQL Editor, jangan disimpan kembali ke repo dan jangan ditempel ke chat (AGENTS.md aturan 11).
--
-- Akun yang dibutuhkan (semua dummy, aturan pengetesan bagian 10):
--   v_a  : owner aktif 1          v_b  : owner aktif 2 (orang lain, nama tampilan berbeda)
--   v_pj : penjaga aktif          v_cu : customer (punya profil, BUKAN staf)
-- Mencari id di SQL Editor (hasilnya jangan ditempel ke chat):
--   SELECT id, nama_tampilan, peran, aktif FROM public.staf ORDER BY peran, nama_tampilan;
--   SELECT id, nama_tampilan FROM public.profil ORDER BY nama_tampilan;
--
-- Cara kerja: tiap uji dicatat ke tabel sementara, lalu satu tabel hasil ditampilkan di akhir.
--   Kolom `lulus` harus true di semua baris. Baris pertama (RINGKASAN) menampilkan jumlah lulus.
--   Fungsi dipanggil langsung (sebagai pemilik), jadi yang diuji adalah logika dan penjaga di dalam
--   fungsi, bukan jalur token `kedai` (itu diuji di BLJ.07 setelah BLJ.03).
--
-- Penjaga: berkas ini MENOLAK jalan bila tabel `belanja` atau `belanja_item` sudah berisi, atau bila
--   keempat akun tidak sesuai peran. Jadi tidak bisa terjalankan dua kali.
--
-- Yang DIUBAH sementara: dua baris `pengaturan` (belanja_harga_maks dan belanja_terkunci_tampil)
--   diubah untuk menguji `pengaturan_rusak` dan batas tampil, lalu DIKEMBALIKAN ke nilai asal di
--   dalam berkas ini juga (ada baris hasil yang memastikan nilainya kembali).
--
-- Yang TERTINGGAL setelah uji: 3 catatan dan 56 item dummy di tabel belanja dan belanja_item
--   (dua catatan terkunci). Dibersihkan nanti oleh ketua di SQL Editor sebagai bagian pembersihan
--   data uji (BLJ.08 dan LNC.01, butuh penjelasan dampak dan "OK"). Belum ada layar Belanja,
--   jadi data ini belum terlihat siapa pun. Bersihkan sebelum owner mulai memakai layarnya.
--
-- BELUM diuji di sini (dicatat supaya tidak dianggap lulus): dua kiriman bersamaan (kunci baris
--   FOR UPDATE; dites tangan dua tab bila perlu), jalur `akun_nonaktif` (butuh mengubah tabel
--   `staf`), dan urutan catatan menurut tanggal (semua baris uji punya waktu dibuat yang sama
--   karena satu transaksi).

DROP TABLE IF EXISTS pg_temp.uji_hasil;

CREATE TEMP TABLE uji_hasil (
  urut    integer GENERATED ALWAYS AS IDENTITY,
  kode    text,
  uji     text,
  harapan text,
  hasil   text,
  lulus   boolean
);

-- Pembantu uji: bandingkan nilai
CREATE OR REPLACE FUNCTION pg_temp.u_cek(p_kode text, p_uji text, p_harapan text, p_hasil text)
RETURNS void
LANGUAGE plpgsql
AS $f$
BEGIN
  INSERT INTO pg_temp.uji_hasil (kode, uji, harapan, hasil, lulus)
  VALUES (p_kode, p_uji, p_harapan, p_hasil, p_hasil IS NOT DISTINCT FROM p_harapan);
END;
$f$;

-- Pembantu uji: jalankan SQL yang HARUS gagal dengan kode galat tertentu
CREATE OR REPLACE FUNCTION pg_temp.u_galat(p_kode text, p_uji text, p_harapan text, p_sql text)
RETURNS void
LANGUAGE plpgsql
AS $f$
DECLARE
  v_pesan text := '(tidak ada galat)';
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    v_pesan := SQLERRM;
  END;
  INSERT INTO pg_temp.uji_hasil (kode, uji, harapan, hasil, lulus)
  VALUES (p_kode, p_uji, p_harapan, v_pesan, v_pesan = p_harapan);
END;
$f$;

DO $uji$
DECLARE
  -- ===== ISI DI SINI (hanya di salinan SQL Editor) =====
  v_a   uuid := '00000000-0000-0000-0000-000000000000';  -- owner dummy 1
  v_b   uuid := '00000000-0000-0000-0000-000000000000';  -- owner dummy 2
  v_pj  uuid := '00000000-0000-0000-0000-000000000000';  -- penjaga dummy
  v_cu  uuid := '00000000-0000-0000-0000-000000000000';  -- customer dummy
  -- =====================================================

  q_buat   text := 'SELECT public.belanja_buat(%L::uuid, %L::text, %L::jsonb)';
  q_tmb    text := 'SELECT public.belanja_item_tambah(%L::uuid, %L::uuid, %L::jsonb)';
  q_ubah   text := 'SELECT public.belanja_item_ubah(%L::uuid, %L::uuid, %L::jsonb)';
  q_batal  text := 'SELECT public.belanja_item_batal(%L::uuid, %L::uuid)';
  q_judul  text := 'SELECT public.belanja_judul_ubah(%L::uuid, %L::uuid, %L::text)';
  q_kunci  text := 'SELECT public.belanja_kunci(%L::uuid, %L::uuid)';
  q_daftar text := 'SELECT public.belanja_daftar(%L::uuid, %L::boolean)';

  j_ok       text := '[{"nama":"Uji","harga":1}]';
  v_hari     text := to_char((now() AT TIME ZONE 'Asia/Jakarta')::date, 'DD-MM-YYYY');
  v_panjang  text := repeat('a', 61);

  v_nama_a text;
  v_nama_b text;
  r        jsonb;
  v_c1     uuid;
  v_c2     uuid;
  v_c3     uuid;
  v_i_ayam   uuid;
  v_i_minyak uuid;
  v_i_c3a    uuid;
  v_i_c3b    uuid;
  v_hm     text;
  v_tt     text;
BEGIN
  -- ============================================================
  -- 0. Penjaga: tabel kosong dan keempat akun sesuai peran
  -- ============================================================
  IF (SELECT count(*) FROM public.belanja) > 0
     OR (SELECT count(*) FROM public.belanja_item) > 0 THEN
    RAISE EXCEPTION 'uji_ditolak: tabel belanja sudah berisi, uji hanya boleh dijalankan sekali';
  END IF;

  SELECT s.nama_tampilan INTO v_nama_a
    FROM public.staf s WHERE s.id = v_a AND s.peran = 'owner' AND s.aktif;
  IF v_nama_a IS NULL THEN
    RAISE EXCEPTION 'persiapan_salah: v_a bukan owner aktif';
  END IF;
  SELECT s.nama_tampilan INTO v_nama_b
    FROM public.staf s WHERE s.id = v_b AND s.peran = 'owner' AND s.aktif;
  IF v_nama_b IS NULL THEN
    RAISE EXCEPTION 'persiapan_salah: v_b bukan owner aktif';
  END IF;
  IF v_a = v_b OR v_nama_a = v_nama_b THEN
    RAISE EXCEPTION 'persiapan_salah: v_a dan v_b harus dua owner berbeda dengan nama berbeda';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.staf s WHERE s.id = v_pj AND s.peran = 'penjaga' AND s.aktif) THEN
    RAISE EXCEPTION 'persiapan_salah: v_pj bukan penjaga aktif';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profil p WHERE p.id = v_cu)
     OR EXISTS (SELECT 1 FROM public.staf s WHERE s.id = v_cu) THEN
    RAISE EXCEPTION 'persiapan_salah: v_cu harus customer (punya profil, bukan staf)';
  END IF;

  -- ============================================================
  -- 1. Buat catatan (belanja_buat), jalur sukses
  -- ============================================================
  r := public.belanja_buat(v_a, 'Uji Belanja 1',
        '[{"nama":"Ayam 2 kg","harga":80000},{"nama":"Beras 10 kg","harga":150000},{"nama":"Minyak","harga":30000}]'::jsonb);
  v_c1 := (r ->> 'id')::uuid;
  PERFORM pg_temp.u_cek('B01', 'owner buat catatan 3 item: jumlah_item', '3', r ->> 'jumlah_item');
  PERFORM pg_temp.u_cek('B02', 'judul yang diisi dipakai apa adanya', 'Uji Belanja 1', r ->> 'judul');
  PERFORM pg_temp.u_cek('B05', 'nama penginput disalin dari staf', 'sesuai',
    CASE WHEN (SELECT b.nama_penginput FROM public.belanja b WHERE b.id = v_c1) = v_nama_a
         THEN 'sesuai' ELSE 'tidak sesuai' END);

  r := public.belanja_buat(v_b, NULL, '[{"nama":"  Sabun  ","harga":15000}]'::jsonb);
  v_c2 := (r ->> 'id')::uuid;
  PERFORM pg_temp.u_cek('B03', 'judul kosong diisi tanggal WIB dan nama penginput', 'sesuai',
    CASE WHEN r ->> 'judul' = v_hari || ' ' || v_nama_b THEN 'sesuai' ELSE 'tidak sesuai' END);
  PERFORM pg_temp.u_cek('B04', 'nama item dirapikan (spasi tepi dibuang)', 'Sabun',
    (SELECT i.nama FROM public.belanja_item i WHERE i.belanja_id = v_c2));

  -- ============================================================
  -- 2. Buat catatan: jalur galat
  -- ============================================================
  PERFORM pg_temp.u_galat('G01', 'penjaga tidak boleh membuat', 'peran_tidak_boleh', format(q_buat, v_pj, NULL, j_ok));
  PERFORM pg_temp.u_galat('G02', 'customer tidak boleh membuat', 'peran_tidak_boleh', format(q_buat, v_cu, NULL, j_ok));
  PERFORM pg_temp.u_galat('G03', 'akun kosong', 'id_kosong', format(q_buat, NULL, NULL, j_ok));
  PERFORM pg_temp.u_galat('G04', 'item kosong (catatan tanpa item ditolak)', 'item_kosong', format(q_buat, v_a, NULL, '[]'));
  PERFORM pg_temp.u_galat('G05', 'item NULL', 'item_tidak_valid', format(q_buat, v_a, NULL, NULL));
  PERFORM pg_temp.u_galat('G06', 'item bukan array', 'item_tidak_valid', format(q_buat, v_a, NULL, '{"nama":"x","harga":1}'));
  PERFORM pg_temp.u_galat('G07', 'elemen item bukan objek', 'item_tidak_valid', format(q_buat, v_a, NULL, '[1]'));
  PERFORM pg_temp.u_galat('G08', 'harga 0', 'harga_tidak_valid', format(q_buat, v_a, NULL, '[{"nama":"x","harga":0}]'));
  PERFORM pg_temp.u_galat('G09', 'harga minus', 'harga_tidak_valid', format(q_buat, v_a, NULL, '[{"nama":"x","harga":-5}]'));
  PERFORM pg_temp.u_galat('G10', 'harga desimal', 'harga_tidak_valid', format(q_buat, v_a, NULL, '[{"nama":"x","harga":1.5}]'));
  PERFORM pg_temp.u_galat('G11', 'harga berupa teks', 'harga_tidak_valid', format(q_buat, v_a, NULL, '[{"nama":"x","harga":"5000"}]'));
  PERFORM pg_temp.u_galat('G12', 'harga tidak dikirim', 'harga_tidak_valid', format(q_buat, v_a, NULL, '[{"nama":"x"}]'));
  PERFORM pg_temp.u_galat('G13', 'harga di atas batas pengaturan', 'harga_terlalu_besar', format(q_buat, v_a, NULL, '[{"nama":"x","harga":5000001}]'));
  PERFORM pg_temp.u_galat('G14', 'nama hanya spasi', 'nama_item_tidak_valid', format(q_buat, v_a, NULL, '[{"nama":"   ","harga":1}]'));
  PERFORM pg_temp.u_galat('G15', 'nama tidak dikirim', 'nama_item_tidak_valid', format(q_buat, v_a, NULL, '[{"harga":1}]'));
  PERFORM pg_temp.u_galat('G16', 'nama berupa angka', 'nama_item_tidak_valid', format(q_buat, v_a, NULL, '[{"nama":123,"harga":1}]'));
  PERFORM pg_temp.u_galat('G17', 'nama 61 karakter', 'nama_item_tidak_valid',
    format(q_buat, v_a, NULL, format('[{"nama":"%s","harga":1}]', v_panjang)));
  PERFORM pg_temp.u_galat('G18', 'nama berisi baris baru', 'nama_item_tidak_valid',
    format(q_buat, v_a, NULL, jsonb_build_array(jsonb_build_object('nama', E'a\nb', 'harga', 1))::text));
  PERFORM pg_temp.u_galat('G19', 'judul 61 karakter', 'judul_tidak_valid', format(q_buat, v_a, v_panjang, j_ok));
  PERFORM pg_temp.u_galat('G20', 'judul berisi baris baru', 'judul_tidak_valid', format(q_buat, v_a, E'a\nb', j_ok));
  PERFORM pg_temp.u_galat('G21', '51 item (batas 50)', 'item_terlalu_banyak',
    format(q_buat, v_a, NULL,
      (SELECT jsonb_agg(jsonb_build_object('nama', 'x' || g, 'harga', 1)) FROM generate_series(1, 51) g)::text));
  PERFORM pg_temp.u_cek('B06', 'galat tidak meninggalkan catatan (hanya 2 catatan sah)', '2',
    (SELECT count(*) FROM public.belanja)::text);

  -- ============================================================
  -- 3. Tambah item (mencicil)
  -- ============================================================
  PERFORM pg_temp.u_galat('T01', 'owner lain tidak boleh menambah', 'bukan_penginput', format(q_tmb, v_b, v_c1, j_ok));
  PERFORM pg_temp.u_galat('T02', 'penjaga tidak boleh menambah', 'peran_tidak_boleh', format(q_tmb, v_pj, v_c1, j_ok));
  PERFORM pg_temp.u_galat('T03', 'catatan tidak ada', 'belanja_tidak_ditemukan', format(q_tmb, v_a, gen_random_uuid(), j_ok));
  PERFORM pg_temp.u_galat('T04', 'id catatan kosong', 'id_kosong', format(q_tmb, v_a, NULL, j_ok));
  r := public.belanja_item_tambah(v_a, v_c1,
        '[{"nama":"Gula","harga":25000},{"nama":"Telur","harga":40000}]'::jsonb);
  PERFORM pg_temp.u_cek('T05', 'penginput menambah 2 item: total item di catatan', '5', r ->> 'jumlah_item');
  PERFORM pg_temp.u_galat('T06', 'tambah dengan harga 0', 'harga_tidak_valid', format(q_tmb, v_a, v_c1, '[{"nama":"x","harga":0}]'));
  PERFORM pg_temp.u_galat('T07', 'tambah dengan daftar kosong', 'item_kosong', format(q_tmb, v_a, v_c1, '[]'));
  PERFORM pg_temp.u_cek('T08', 'galat tidak menambah item', '5',
    (SELECT count(*) FROM public.belanja_item i WHERE i.belanja_id = v_c1)::text);

  -- ============================================================
  -- 4. Ubah item
  -- ============================================================
  SELECT i.id INTO v_i_ayam   FROM public.belanja_item i WHERE i.belanja_id = v_c1 AND i.nama = 'Ayam 2 kg';
  SELECT i.id INTO v_i_minyak FROM public.belanja_item i WHERE i.belanja_id = v_c1 AND i.nama = 'Minyak';

  PERFORM pg_temp.u_galat('U01', 'owner lain tidak boleh mengubah', 'bukan_penginput',
    format(q_ubah, v_b, v_i_ayam, '{"nama":"x","harga":1}'));
  PERFORM pg_temp.u_galat('U02', 'penjaga tidak boleh mengubah', 'peran_tidak_boleh',
    format(q_ubah, v_pj, v_i_ayam, '{"nama":"x","harga":1}'));
  PERFORM pg_temp.u_galat('U03', 'item tidak ada', 'item_tidak_ditemukan',
    format(q_ubah, v_a, gen_random_uuid(), '{"nama":"x","harga":1}'));
  PERFORM pg_temp.u_galat('U04', 'id item kosong', 'id_kosong', format(q_ubah, v_a, NULL, '{"nama":"x","harga":1}'));
  PERFORM pg_temp.u_galat('U05', 'ubah dengan harga 0', 'harga_tidak_valid',
    format(q_ubah, v_a, v_i_ayam, '{"nama":"x","harga":0}'));
  PERFORM pg_temp.u_galat('U06', 'ubah tanpa isi (NULL)', 'item_tidak_valid', format(q_ubah, v_a, v_i_ayam, NULL));
  PERFORM pg_temp.u_galat('U07', 'ubah dengan array, bukan objek', 'item_tidak_valid',
    format(q_ubah, v_a, v_i_ayam, '[{"nama":"x","harga":1}]'));
  r := public.belanja_item_ubah(v_a, v_i_ayam, '{"nama":"Ayam 3 kg","harga":120000}'::jsonb);
  PERFORM pg_temp.u_cek('U08', 'penginput mengubah item: harga baru', '120000', r ->> 'harga');
  PERFORM pg_temp.u_cek('U09', 'nama baru tersimpan', 'Ayam 3 kg',
    (SELECT i.nama FROM public.belanja_item i WHERE i.id = v_i_ayam));

  -- ============================================================
  -- 5. Batalkan item (tanpa DELETE)
  -- ============================================================
  PERFORM pg_temp.u_galat('X01', 'owner lain tidak boleh membatalkan', 'bukan_penginput', format(q_batal, v_b, v_i_minyak));
  PERFORM pg_temp.u_galat('X02', 'customer tidak boleh membatalkan', 'peran_tidak_boleh', format(q_batal, v_cu, v_i_minyak));
  PERFORM pg_temp.u_galat('X03', 'item tidak ada', 'item_tidak_ditemukan', format(q_batal, v_a, gen_random_uuid()));
  PERFORM public.belanja_item_batal(v_a, v_i_minyak);
  PERFORM pg_temp.u_cek('X04', 'penginput membatalkan: item ditandai, barisnya tetap ada', 'true',
    (SELECT i.dibatalkan::text FROM public.belanja_item i WHERE i.id = v_i_minyak));
  PERFORM pg_temp.u_galat('X05', 'batal dua kali ditolak', 'item_sudah_batal', format(q_batal, v_a, v_i_minyak));
  PERFORM pg_temp.u_galat('X06', 'item dibatalkan tidak bisa diubah', 'item_sudah_batal',
    format(q_ubah, v_a, v_i_minyak, '{"nama":"x","harga":1}'));

  -- ============================================================
  -- 6. Ubah judul
  -- ============================================================
  PERFORM pg_temp.u_galat('J01', 'owner lain tidak boleh mengubah judul', 'bukan_penginput', format(q_judul, v_b, v_c1, 'Judul X'));
  PERFORM pg_temp.u_galat('J02', 'catatan tidak ada', 'belanja_tidak_ditemukan', format(q_judul, v_a, gen_random_uuid(), 'Judul X'));
  PERFORM pg_temp.u_galat('J03', 'judul 61 karakter', 'judul_tidak_valid', format(q_judul, v_a, v_c1, v_panjang));
  r := public.belanja_judul_ubah(v_a, v_c1, '  Belanja Pasar  ');
  PERFORM pg_temp.u_cek('J04', 'judul baru dirapikan dan tersimpan', 'Belanja Pasar', r ->> 'judul');
  r := public.belanja_judul_ubah(v_a, v_c1, '   ');
  PERFORM pg_temp.u_cek('J05', 'judul dikosongkan: diisi ulang tanggal dan nama', 'sesuai',
    CASE WHEN r ->> 'judul' = v_hari || ' ' || v_nama_a THEN 'sesuai' ELSE 'tidak sesuai' END);

  -- ============================================================
  -- 7. Batas 50 item dihitung termasuk yang Dibatalkan
  -- ============================================================
  r := public.belanja_buat(v_a, 'Uji Batas 50',
        (SELECT jsonb_agg(jsonb_build_object('nama', 'Uji ' || g, 'harga', 1) ORDER BY g)
           FROM generate_series(1, 50) g));
  v_c3 := (r ->> 'id')::uuid;
  PERFORM pg_temp.u_cek('L01', 'catatan 50 item (batas) bisa dibuat', '50', r ->> 'jumlah_item');
  PERFORM pg_temp.u_galat('L02', 'item ke-51 ditolak', 'item_terlalu_banyak', format(q_tmb, v_a, v_c3, j_ok));
  SELECT i.id INTO v_i_c3a FROM public.belanja_item i WHERE i.belanja_id = v_c3 AND i.nama = 'Uji 1';
  SELECT i.id INTO v_i_c3b FROM public.belanja_item i WHERE i.belanja_id = v_c3 AND i.nama = 'Uji 2';
  PERFORM public.belanja_item_batal(v_a, v_i_c3a);
  PERFORM pg_temp.u_galat('L03', 'setelah 1 item dibatalkan, tambah 1 tetap ditolak (batal tetap dihitung)',
    'item_terlalu_banyak', format(q_tmb, v_a, v_c3, j_ok));

  -- ============================================================
  -- 8. Daftar dan rekap (sebelum ada yang terkunci), dibaca sebagai owner B
  -- ============================================================
  r := public.belanja_daftar(v_b, false);
  PERFORM pg_temp.u_cek('D01', 'rekap total (belum terkunci, tanpa item batal)', '350049', r -> 'rekap' ->> 'total');
  PERFORM pg_temp.u_cek('D02', 'jumlah owner di rekap', '2', jsonb_array_length(r -> 'rekap' -> 'per_owner')::text);
  PERFORM pg_temp.u_cek('D03', 'total owner A (335000 + 49)', '335049',
    (SELECT e ->> 'total' FROM jsonb_array_elements(r -> 'rekap' -> 'per_owner') e WHERE e ->> 'nama' = v_nama_a));
  PERFORM pg_temp.u_cek('D04', 'total owner B', '15000',
    (SELECT e ->> 'total' FROM jsonb_array_elements(r -> 'rekap' -> 'per_owner') e WHERE e ->> 'nama' = v_nama_b));
  PERFORM pg_temp.u_cek('D05', 'semua catatan belum terkunci tampil (tanpa batas)', '3', jsonb_array_length(r -> 'catatan')::text);
  PERFORM pg_temp.u_cek('D06', 'total catatan 1 tidak menghitung item batal', '335000',
    (SELECT c ->> 'total' FROM jsonb_array_elements(r -> 'catatan') c WHERE c ->> 'id' = v_c1::text));
  PERFORM pg_temp.u_cek('D07', 'item batal tetap tampil dengan penanda', 'true',
    (SELECT i ->> 'dibatalkan'
       FROM jsonb_array_elements(r -> 'catatan') c, jsonb_array_elements(c -> 'item') i
      WHERE c ->> 'id' = v_c1::text AND i ->> 'nama' = 'Minyak'));
  PERFORM pg_temp.u_cek('D08', 'urutan item mengikuti urutan input', 'Ayam 3 kg|Beras 10 kg|Minyak|Gula|Telur',
    (SELECT string_agg(i ->> 'nama', '|' ORDER BY t.n)
       FROM jsonb_array_elements(r -> 'catatan') c,
            jsonb_array_elements(c -> 'item') WITH ORDINALITY AS t(i, n)
      WHERE c ->> 'id' = v_c1::text));
  PERFORM pg_temp.u_cek('D09', 'urutan 50 item satu kiriman terjaga (pertama dan terakhir)', 'Uji 1|Uji 50',
    (SELECT (c -> 'item' -> 0 ->> 'nama') || '|' || (c -> 'item' -> 49 ->> 'nama')
       FROM jsonb_array_elements(r -> 'catatan') c WHERE c ->> 'id' = v_c3::text));
  PERFORM pg_temp.u_cek('D10', 'owner B: catatan A bukan milik saya', 'false',
    (SELECT c ->> 'milik_saya' FROM jsonb_array_elements(r -> 'catatan') c WHERE c ->> 'id' = v_c1::text));
  PERFORM pg_temp.u_cek('D11', 'owner B: catatan B milik saya', 'true',
    (SELECT c ->> 'milik_saya' FROM jsonb_array_elements(r -> 'catatan') c WHERE c ->> 'id' = v_c2::text));
  PERFORM pg_temp.u_cek('D12', 'balasan tidak memuat id akun owner mana pun', 'bersih',
    CASE WHEN position(v_a::text IN r::text) = 0 AND position(v_b::text IN r::text) = 0
         THEN 'bersih' ELSE 'bocor' END);
  PERFORM pg_temp.u_cek('D13', 'owner A: catatan A milik saya', 'true',
    (SELECT c ->> 'milik_saya'
       FROM jsonb_array_elements(public.belanja_daftar(v_a, false) -> 'catatan') c
      WHERE c ->> 'id' = v_c1::text));
  PERFORM pg_temp.u_galat('D14', 'customer tidak boleh membaca', 'peran_tidak_boleh', format(q_daftar, v_cu, false));
  PERFORM pg_temp.u_galat('D15', 'penjaga tidak boleh membaca', 'peran_tidak_boleh', format(q_daftar, v_pj, false));
  PERFORM pg_temp.u_galat('D16', 'akun kosong', 'id_kosong', format(q_daftar, NULL, false));

  -- ============================================================
  -- 9. Kunci (satu arah) dan akibatnya
  -- ============================================================
  PERFORM pg_temp.u_galat('K01', 'owner lain tidak boleh mengunci', 'bukan_penginput', format(q_kunci, v_b, v_c3));
  PERFORM pg_temp.u_galat('K02', 'customer tidak boleh mengunci', 'peran_tidak_boleh', format(q_kunci, v_cu, v_c3));
  PERFORM pg_temp.u_galat('K03', 'penjaga tidak boleh mengunci', 'peran_tidak_boleh', format(q_kunci, v_pj, v_c3));
  PERFORM pg_temp.u_galat('K04', 'catatan tidak ada', 'belanja_tidak_ditemukan', format(q_kunci, v_a, gen_random_uuid()));
  PERFORM pg_temp.u_galat('K05', 'id kosong', 'id_kosong', format(q_kunci, v_a, NULL));
  r := public.belanja_kunci(v_a, v_c3);
  PERFORM pg_temp.u_cek('K06', 'penginput mengunci: waktu kunci terisi', 'ada',
    CASE WHEN r ->> 'dikunci_pada' IS NOT NULL THEN 'ada' ELSE 'kosong' END);
  PERFORM pg_temp.u_galat('K07', 'kunci dua kali ditolak', 'belanja_terkunci', format(q_kunci, v_a, v_c3));
  PERFORM pg_temp.u_galat('K08', 'terkunci: tambah item ditolak', 'belanja_terkunci', format(q_tmb, v_a, v_c3, j_ok));
  PERFORM pg_temp.u_galat('K09', 'terkunci: ubah item ditolak', 'belanja_terkunci',
    format(q_ubah, v_a, v_i_c3b, '{"nama":"x","harga":1}'));
  PERFORM pg_temp.u_galat('K10', 'terkunci: batalkan item ditolak', 'belanja_terkunci', format(q_batal, v_a, v_i_c3b));
  PERFORM pg_temp.u_galat('K11', 'terkunci: ubah judul ditolak', 'belanja_terkunci', format(q_judul, v_a, v_c3, 'Judul X'));
  PERFORM pg_temp.u_cek('K12', 'isi catatan terkunci tidak berubah (50 item, 1 batal)', '50/1',
    (SELECT count(*) || '/' || count(*) FILTER (WHERE i.dibatalkan)
       FROM public.belanja_item i WHERE i.belanja_id = v_c3));

  -- ============================================================
  -- 10. Daftar dan rekap setelah ada yang terkunci
  -- ============================================================
  r := public.belanja_daftar(v_a, false);
  PERFORM pg_temp.u_cek('R01', 'saklar mati: hanya catatan belum terkunci tampil', '2', jsonb_array_length(r -> 'catatan')::text);
  PERFORM pg_temp.u_cek('R02', 'rekap tidak menghitung catatan terkunci', '350000', r -> 'rekap' ->> 'total');
  r := public.belanja_daftar(v_a, true);
  PERFORM pg_temp.u_cek('R03', 'saklar nyala: catatan terkunci ikut tampil', '3', jsonb_array_length(r -> 'catatan')::text);
  PERFORM pg_temp.u_cek('R04', 'saklar nyala: rekap tetap hanya yang belum terkunci', '350000', r -> 'rekap' ->> 'total');
  PERFORM pg_temp.u_cek('R05', 'catatan terkunci membawa totalnya sendiri', '49',
    (SELECT c ->> 'total' FROM jsonb_array_elements(r -> 'catatan') c WHERE c ->> 'id' = v_c3::text));
  PERFORM pg_temp.u_cek('R06', 'catatan terkunci membawa waktu kunci', 'ada',
    (SELECT CASE WHEN c ->> 'dikunci_pada' IS NOT NULL THEN 'ada' ELSE 'kosong' END
       FROM jsonb_array_elements(r -> 'catatan') c WHERE c ->> 'id' = v_c3::text));
  PERFORM pg_temp.u_cek('R07', 'batas tampil terkunci dari pengaturan', '10', r ->> 'terkunci_tampil_maks');

  -- Owner B mengunci catatannya sendiri; rekap tinggal catatan A
  r := public.belanja_kunci(v_b, v_c2);
  PERFORM pg_temp.u_cek('R08', 'owner B mengunci catatannya sendiri', 'ada',
    CASE WHEN r ->> 'dikunci_pada' IS NOT NULL THEN 'ada' ELSE 'kosong' END);
  r := public.belanja_daftar(v_a, false);
  PERFORM pg_temp.u_cek('R09', 'rekap setelah B mengunci: total', '335000', r -> 'rekap' ->> 'total');
  PERFORM pg_temp.u_cek('R10', 'rekap setelah B mengunci: hanya 1 owner', '1', jsonb_array_length(r -> 'rekap' -> 'per_owner')::text);

  -- ============================================================
  -- 11. Pengaturan: batas tampil terkunci dan pengaturan rusak (nilai dikembalikan)
  -- ============================================================
  SELECT g.nilai INTO v_tt FROM public.pengaturan g WHERE g.kunci = 'belanja_terkunci_tampil';
  SELECT g.nilai INTO v_hm FROM public.pengaturan g WHERE g.kunci = 'belanja_harga_maks';

  UPDATE public.pengaturan SET nilai = '1' WHERE kunci = 'belanja_terkunci_tampil';
  r := public.belanja_daftar(v_a, true);
  PERFORM pg_temp.u_cek('P01', 'batas tampil terkunci = 1: catatan belum terkunci + 1 terkunci', '2',
    jsonb_array_length(r -> 'catatan')::text);
  UPDATE public.pengaturan SET nilai = 'abc' WHERE kunci = 'belanja_terkunci_tampil';
  PERFORM pg_temp.u_galat('P02', 'pengaturan batas tampil rusak (teks)', 'pengaturan_rusak', format(q_daftar, v_a, true));
  UPDATE public.pengaturan SET nilai = v_tt WHERE kunci = 'belanja_terkunci_tampil';
  r := public.belanja_daftar(v_a, true);
  PERFORM pg_temp.u_cek('P03', 'batas tampil dikembalikan: 3 catatan tampil lagi', '3', jsonb_array_length(r -> 'catatan')::text);

  UPDATE public.pengaturan SET nilai = 'abc' WHERE kunci = 'belanja_harga_maks';
  PERFORM pg_temp.u_galat('P04', 'pengaturan harga maksimum rusak (teks)', 'pengaturan_rusak', format(q_buat, v_a, NULL, j_ok));
  UPDATE public.pengaturan SET nilai = '0' WHERE kunci = 'belanja_harga_maks';
  PERFORM pg_temp.u_galat('P05', 'pengaturan harga maksimum rusak (nol)', 'pengaturan_rusak', format(q_buat, v_a, NULL, j_ok));
  UPDATE public.pengaturan SET nilai = v_hm WHERE kunci = 'belanja_harga_maks';

  PERFORM pg_temp.u_cek('P06', 'kedua pengaturan kembali ke nilai asal', 'sama',
    CASE WHEN (SELECT g.nilai FROM public.pengaturan g WHERE g.kunci = 'belanja_terkunci_tampil') = v_tt
          AND (SELECT g.nilai FROM public.pengaturan g WHERE g.kunci = 'belanja_harga_maks') = v_hm
         THEN 'sama' ELSE 'berubah' END);

  -- ============================================================
  -- 12. Keadaan akhir tabel
  -- ============================================================
  PERFORM pg_temp.u_cek('Z01', 'jumlah catatan akhir', '3', (SELECT count(*) FROM public.belanja)::text);
  PERFORM pg_temp.u_cek('Z02', 'jumlah item akhir (5 + 1 + 50), tidak ada yang hilang', '56',
    (SELECT count(*) FROM public.belanja_item)::text);
END;
$uji$;

-- Hasil: kolom `lulus` harus true di semua baris. Tempel hasilnya ke chat.
SELECT kode, uji, harapan, hasil, lulus
  FROM (
    SELECT 0 AS urut, 'RINGKASAN' AS kode, 'jumlah lulus dari total' AS uji, '' AS harapan,
           (count(*) FILTER (WHERE lulus))::text || ' dari ' || count(*)::text AS hasil,
           bool_and(lulus) AS lulus
      FROM pg_temp.uji_hasil
    UNION ALL
    SELECT urut, kode, uji, harapan, hasil, lulus FROM pg_temp.uji_hasil
  ) x
 ORDER BY urut;
