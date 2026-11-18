-- supabase/migrations/20261118_03_belanja_fungsi.sql
-- BLJ.02: fungsi SQL Belanja Warung (buat catatan, tambah item, ubah item, batalkan item,
-- ubah judul, kunci, baca daftar plus rekap) beserta tiga fungsi pembantu baca-saja.
-- Dijalankan MANUAL di SQL Editor (akun ketua). Pembatalan: 20261118_03_belanja_fungsi_batal.sql
-- Cek hasil: supabase/templates/20261118_03_belanja_fungsi_cek.sql
-- Tanpa data nyata. Semua objek di sini BARU (hanya fungsi). Tabel, hak tabel, pengaturan, dan data
-- tidak disentuh. Fungsi baru belum dipanggil siapa pun sampai `belanja.ts` (BLJ.03) di-deploy,
-- jadi berkas ini berdiri sendiri: tidak perlu deploy `kedai` lebih dulu.
--
-- Pola keamanan (AGENTS.md bagian 7): SECURITY DEFINER, search_path kosong, `public.` eksplisit,
-- EXECUTE hanya untuk service_role. Peran owner dan kepemilikan dicek DI DALAM fungsi dari id akun
-- (yang dibaca `kedai` dari token login, bukan dari aplikasi). Aplikasi tidak pernah mengirim total.
--
-- Fungsi pembantu (baca-saja, dipanggil fungsi lain di berkas ini):
--   - belanja_angka(kunci)        : baca satu angka dari `pengaturan`, cek bentuk (bulat, 1 sampai 9 digit).
--   - belanja_owner(akun)         : pastikan akun staf aktif berperan owner, kembalikan nama tampilannya.
--   - belanja_item_periksa(item)  : periksa dan rapikan daftar item [{nama, harga}].
--
-- Fungsi utama:
--   - belanja_buat(akun, judul, item)          : catatan baru plus item (BL2, BL5, BL14).
--   - belanja_item_tambah(akun, id, item)      : mencicil item ke catatan sendiri (BL2).
--   - belanja_item_ubah(akun, id_item, item)   : ubah nama dan harga satu item (BL7).
--   - belanja_item_batal(akun, id_item)        : tandai item Dibatalkan (BL8).
--   - belanja_judul_ubah(akun, id, judul)      : ubah judul (BL5, BL7).
--   - belanja_kunci(akun, id)                  : kunci satu arah (BL9).
--   - belanja_daftar(akun, tampilkan_terkunci) : daftar plus rekap (BL11, BL12, BL13).
--
-- Keputusan yang berlaku (belanja.md dan "gas" ketua 18 Nov 2026 atas empat pilihan penulis):
--   - Item Dibatalkan TIDAK bisa diaktifkan lagi dan tidak bisa diedit.
--   - Batas `belanja_item_maks` dihitung TERMASUK item Dibatalkan.
--   - Catatan tanpa item TIDAK boleh dibuat.
--   - Hanya penginput yang boleh tambah, ubah, batalkan, ubah judul, dan kunci. Owner lain hanya melihat.
--   - Catatan terkunci tidak bisa diubah apa pun, termasuk judul. Tanpa DELETE.
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   - REKAP selalu hanya menjumlah catatan yang BELUM terkunci, juga saat saklar "tampilkan yang terkunci"
--     dinyalakan. Catatan terkunci yang ikut tampil hanya 10 terbaru, jadi menjumlahnya akan memberi
--     angka per owner yang menyesatkan di hari ngumpul. Tiap catatan membawa totalnya sendiri.
--   - Ubah item mengirim nama DAN harga sekaligus (keduanya wajib), bentuk {nama, harga}.
--   - Membatalkan item yang sudah Dibatalkan, atau mengedit item Dibatalkan, ditolak (`item_sudah_batal`).
--   - Waktu tambah item memakai clock_timestamp() per baris, supaya urutan item dalam satu kiriman
--     (Simpan sekali banyak item) terjaga di layar.
--   - Judul kosong diisi "DD-MM-YYYY Nama penginput" (tanggal catatan dibuat, kalender WIB, jam server).
--   - Panjang nama item dan judul dibatasi dari pengaturan; harga bulat, 1 sampai `belanja_harga_maks`.
--   - Balasan `belanja_daftar` tidak memuat id akun orang lain; hanya `milik_saya` (benar atau salah).
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai` ke pesan aman di BLJ.03:
--   id_kosong, peran_tidak_boleh, akun_nonaktif, pengaturan_rusak,
--   belanja_tidak_ditemukan, item_tidak_ditemukan, bukan_penginput, belanja_terkunci, item_sudah_batal,
--   judul_tidak_valid, item_kosong, item_tidak_valid, item_terlalu_banyak,
--   nama_item_tidak_valid, harga_tidak_valid, harga_terlalu_besar
--   (BARU di fitur ini: semua kecuali id_kosong, peran_tidak_boleh, akun_nonaktif, pengaturan_rusak,
--   item_kosong, item_tidak_valid, item_terlalu_banyak, yang namanya dipakai ulang dari fitur lain.)

BEGIN;

-- ============================================================
-- 1. Pembantu: baca satu angka pengaturan (bulat, 1 sampai 9 digit)
-- ============================================================
CREATE FUNCTION public.belanja_angka(p_kunci text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_teks  text;
  v_angka integer;
BEGIN
  SELECT g.nilai INTO v_teks
    FROM public.pengaturan g
   WHERE g.kunci = p_kunci;
  IF v_teks IS NULL OR v_teks !~ '^[0-9]{1,9}$' THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;
  v_angka := v_teks::integer;
  IF v_angka < 1 THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;
  RETURN v_angka;
END;
$$;

-- ============================================================
-- 2. Pembantu: pastikan akun adalah owner aktif (BL1), kembalikan nama tampilannya
-- ============================================================
CREATE FUNCTION public.belanja_owner(p_akun uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_nama  text;
  v_peran text;
  v_aktif boolean;
BEGIN
  IF p_akun IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  SELECT s.nama_tampilan, s.peran, s.aktif
    INTO v_nama, v_peran, v_aktif
    FROM public.staf s
   WHERE s.id = p_akun;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'peran_tidak_boleh';   -- customer (bukan staf)
  END IF;
  IF NOT v_aktif THEN
    RAISE EXCEPTION 'akun_nonaktif';
  END IF;
  IF v_peran <> 'owner' THEN
    RAISE EXCEPTION 'peran_tidak_boleh';   -- penjaga
  END IF;

  RETURN v_nama;
END;
$$;

-- ============================================================
-- 3. Pembantu: periksa dan rapikan daftar item [{nama, harga}] (BL3, BL4)
--    Mengembalikan array jsonb [{nama, harga}] yang sudah dirapikan, urutan sama.
--    Harga harus ANGKA JSON bulat 1 sampai `belanja_harga_maks`: teks, desimal, dan minus ditolak.
-- ============================================================
CREATE FUNCTION public.belanja_item_periksa(p_item jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item_maks  integer := public.belanja_angka('belanja_item_maks');
  v_nama_maks  integer := public.belanja_angka('belanja_nama_maks');
  v_harga_maks integer := public.belanja_angka('belanja_harga_maks');
  v_n          integer;
  v_elem       jsonb;
  v_nama       text;
  v_harga      bigint;
  v_hasil      jsonb := '[]'::jsonb;
BEGIN
  IF p_item IS NULL OR jsonb_typeof(p_item) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'item_tidak_valid';
  END IF;
  v_n := jsonb_array_length(p_item);
  IF v_n < 1 THEN
    RAISE EXCEPTION 'item_kosong';
  END IF;
  IF v_n > v_item_maks THEN
    RAISE EXCEPTION 'item_terlalu_banyak';
  END IF;

  FOR v_elem IN
    SELECT x.e FROM jsonb_array_elements(p_item) WITH ORDINALITY AS x(e, n) ORDER BY x.n
  LOOP
    IF jsonb_typeof(v_elem) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'item_tidak_valid';
    END IF;

    -- Nama: teks, dirapikan, tidak kosong, tanpa karakter kontrol, dalam batas panjang
    IF jsonb_typeof(v_elem -> 'nama') IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION 'nama_item_tidak_valid';
    END IF;
    v_nama := btrim(v_elem ->> 'nama', E' \t\r\n');
    IF v_nama = ''
       OR char_length(v_nama) > v_nama_maks
       OR v_nama ~ '[[:cntrl:]]' THEN
      RAISE EXCEPTION 'nama_item_tidak_valid';
    END IF;

    -- Harga: harus angka JSON, hanya digit (tanpa desimal, minus, atau huruf), minimal 1 (BL4)
    IF jsonb_typeof(v_elem -> 'harga') IS DISTINCT FROM 'number'
       OR (v_elem ->> 'harga') !~ '^[0-9]{1,9}$' THEN
      RAISE EXCEPTION 'harga_tidak_valid';
    END IF;
    v_harga := (v_elem ->> 'harga')::bigint;
    IF v_harga < 1 THEN
      RAISE EXCEPTION 'harga_tidak_valid';
    END IF;
    IF v_harga > v_harga_maks THEN
      RAISE EXCEPTION 'harga_terlalu_besar';
    END IF;

    v_hasil := v_hasil || jsonb_build_array(
      jsonb_build_object('nama', v_nama, 'harga', v_harga)
    );
  END LOOP;

  RETURN v_hasil;
END;
$$;

-- ============================================================
-- 4. belanja_buat: catatan baru plus item, satu langkah atomik (BL2, BL5, BL14)
--    Mengembalikan {id, judul, jumlah_item}.
-- ============================================================
CREATE FUNCTION public.belanja_buat(
  p_akun  uuid,
  p_judul text,
  p_item  jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_nama       text;
  v_judul_maks integer;
  v_judul      text;
  v_item       jsonb;
  v_id         uuid;
  v_elem       jsonb;
BEGIN
  v_nama := public.belanja_owner(p_akun);
  v_judul_maks := public.belanja_angka('belanja_judul_maks');

  -- Judul bebas, boleh kosong; kosong diisi tanggal dan nama penginput (BL5)
  v_judul := btrim(COALESCE(p_judul, ''), E' \t\r\n');
  IF v_judul = '' THEN
    v_judul := to_char((now() AT TIME ZONE 'Asia/Jakarta')::date, 'DD-MM-YYYY') || ' ' || v_nama;
  ELSIF char_length(v_judul) > v_judul_maks OR v_judul ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION 'judul_tidak_valid';
  END IF;

  -- Catatan tanpa item tidak boleh dibuat (item_kosong dari pembantu)
  v_item := public.belanja_item_periksa(p_item);

  INSERT INTO public.belanja (judul, penginput, nama_penginput)
  VALUES (v_judul, p_akun, v_nama)
  RETURNING id INTO v_id;

  FOR v_elem IN
    SELECT x.e FROM jsonb_array_elements(v_item) WITH ORDINALITY AS x(e, n) ORDER BY x.n
  LOOP
    INSERT INTO public.belanja_item (belanja_id, nama, harga, ditambah_pada)
    VALUES (v_id, v_elem ->> 'nama', (v_elem ->> 'harga')::integer, clock_timestamp());
  END LOOP;

  RETURN jsonb_build_object(
    'id',          v_id,
    'judul',       v_judul,
    'jumlah_item', jsonb_array_length(v_item)
  );
END;
$$;

-- ============================================================
-- 5. belanja_item_tambah: mencicil item ke catatan sendiri yang belum terkunci (BL2)
--    Mengembalikan {id, jumlah_item} (jumlah_item = total di catatan, termasuk yang Dibatalkan).
-- ============================================================
CREATE FUNCTION public.belanja_item_tambah(
  p_akun       uuid,
  p_belanja_id uuid,
  p_item       jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_penginput uuid;
  v_kunci     timestamptz;
  v_item      jsonb;
  v_item_maks integer;
  v_ada       integer;
  v_elem      jsonb;
BEGIN
  PERFORM public.belanja_owner(p_akun);
  IF p_belanja_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Kunci baris catatan sampai transaksi selesai: tambah dan kunci bersamaan diurutkan (satu menang)
  SELECT b.penginput, b.dikunci_pada
    INTO v_penginput, v_kunci
    FROM public.belanja b
   WHERE b.id = p_belanja_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'belanja_tidak_ditemukan';
  END IF;
  IF v_penginput <> p_akun THEN
    RAISE EXCEPTION 'bukan_penginput';
  END IF;
  IF v_kunci IS NOT NULL THEN
    RAISE EXCEPTION 'belanja_terkunci';
  END IF;

  v_item := public.belanja_item_periksa(p_item);
  v_item_maks := public.belanja_angka('belanja_item_maks');

  -- Batas dihitung termasuk item yang Dibatalkan (tanpa DELETE, barisnya tetap ada)
  SELECT count(*)::integer INTO v_ada
    FROM public.belanja_item i
   WHERE i.belanja_id = p_belanja_id;
  IF v_ada + jsonb_array_length(v_item) > v_item_maks THEN
    RAISE EXCEPTION 'item_terlalu_banyak';
  END IF;

  FOR v_elem IN
    SELECT x.e FROM jsonb_array_elements(v_item) WITH ORDINALITY AS x(e, n) ORDER BY x.n
  LOOP
    INSERT INTO public.belanja_item (belanja_id, nama, harga, ditambah_pada)
    VALUES (p_belanja_id, v_elem ->> 'nama', (v_elem ->> 'harga')::integer, clock_timestamp());
  END LOOP;

  RETURN jsonb_build_object(
    'id',          p_belanja_id,
    'jumlah_item', v_ada + jsonb_array_length(v_item)
  );
END;
$$;

-- ============================================================
-- 6. belanja_item_ubah: ubah nama dan harga satu item (BL7)
--    p_item berbentuk satu objek {nama, harga}. Item Dibatalkan tidak bisa diubah.
--    Mengembalikan {id, nama, harga}.
-- ============================================================
CREATE FUNCTION public.belanja_item_ubah(
  p_akun    uuid,
  p_item_id uuid,
  p_item    jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_belanja_id uuid;
  v_penginput  uuid;
  v_kunci      timestamptz;
  v_batal      boolean;
  v_baru       jsonb;
BEGIN
  PERFORM public.belanja_owner(p_akun);
  IF p_item_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  SELECT i.belanja_id INTO v_belanja_id
    FROM public.belanja_item i
   WHERE i.id = p_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'item_tidak_ditemukan';
  END IF;

  SELECT b.penginput, b.dikunci_pada
    INTO v_penginput, v_kunci
    FROM public.belanja b
   WHERE b.id = v_belanja_id
     FOR UPDATE;
  IF v_penginput <> p_akun THEN
    RAISE EXCEPTION 'bukan_penginput';
  END IF;
  IF v_kunci IS NOT NULL THEN
    RAISE EXCEPTION 'belanja_terkunci';
  END IF;

  SELECT i.dibatalkan INTO v_batal
    FROM public.belanja_item i
   WHERE i.id = p_item_id
     FOR UPDATE;
  IF v_batal THEN
    RAISE EXCEPTION 'item_sudah_batal';
  END IF;

  -- Periksa lewat pembantu: satu objek dibungkus jadi array satu elemen
  v_baru := public.belanja_item_periksa(jsonb_build_array(p_item)) -> 0;

  UPDATE public.belanja_item
     SET nama  = v_baru ->> 'nama',
         harga = (v_baru ->> 'harga')::integer
   WHERE id = p_item_id;

  RETURN jsonb_build_object(
    'id',    p_item_id,
    'nama',  v_baru ->> 'nama',
    'harga', (v_baru ->> 'harga')::integer
  );
END;
$$;

-- ============================================================
-- 7. belanja_item_batal: tandai item Dibatalkan, satu arah (BL8)
--    Mengembalikan {id}.
-- ============================================================
CREATE FUNCTION public.belanja_item_batal(
  p_akun    uuid,
  p_item_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_belanja_id uuid;
  v_penginput  uuid;
  v_kunci      timestamptz;
  v_batal      boolean;
BEGIN
  PERFORM public.belanja_owner(p_akun);
  IF p_item_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  SELECT i.belanja_id INTO v_belanja_id
    FROM public.belanja_item i
   WHERE i.id = p_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'item_tidak_ditemukan';
  END IF;

  SELECT b.penginput, b.dikunci_pada
    INTO v_penginput, v_kunci
    FROM public.belanja b
   WHERE b.id = v_belanja_id
     FOR UPDATE;
  IF v_penginput <> p_akun THEN
    RAISE EXCEPTION 'bukan_penginput';
  END IF;
  IF v_kunci IS NOT NULL THEN
    RAISE EXCEPTION 'belanja_terkunci';
  END IF;

  SELECT i.dibatalkan INTO v_batal
    FROM public.belanja_item i
   WHERE i.id = p_item_id
     FOR UPDATE;
  IF v_batal THEN
    RAISE EXCEPTION 'item_sudah_batal';
  END IF;

  UPDATE public.belanja_item
     SET dibatalkan = true
   WHERE id = p_item_id;

  RETURN jsonb_build_object('id', p_item_id);
END;
$$;

-- ============================================================
-- 8. belanja_judul_ubah: ubah judul catatan sendiri yang belum terkunci (BL5, BL7)
--    Judul kosong diisi ulang dengan tanggal catatan dibuat dan nama penginput.
--    Mengembalikan {id, judul}.
-- ============================================================
CREATE FUNCTION public.belanja_judul_ubah(
  p_akun       uuid,
  p_belanja_id uuid,
  p_judul      text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_penginput  uuid;
  v_nama_pg    text;
  v_dibuat     timestamptz;
  v_kunci      timestamptz;
  v_judul_maks integer;
  v_judul      text;
BEGIN
  PERFORM public.belanja_owner(p_akun);
  IF p_belanja_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;
  v_judul_maks := public.belanja_angka('belanja_judul_maks');

  SELECT b.penginput, b.nama_penginput, b.dibuat_pada, b.dikunci_pada
    INTO v_penginput, v_nama_pg, v_dibuat, v_kunci
    FROM public.belanja b
   WHERE b.id = p_belanja_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'belanja_tidak_ditemukan';
  END IF;
  IF v_penginput <> p_akun THEN
    RAISE EXCEPTION 'bukan_penginput';
  END IF;
  IF v_kunci IS NOT NULL THEN
    RAISE EXCEPTION 'belanja_terkunci';
  END IF;

  v_judul := btrim(COALESCE(p_judul, ''), E' \t\r\n');
  IF v_judul = '' THEN
    v_judul := to_char((v_dibuat AT TIME ZONE 'Asia/Jakarta')::date, 'DD-MM-YYYY') || ' ' || v_nama_pg;
  ELSIF char_length(v_judul) > v_judul_maks OR v_judul ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION 'judul_tidak_valid';
  END IF;

  UPDATE public.belanja
     SET judul = v_judul
   WHERE id = p_belanja_id;

  RETURN jsonb_build_object('id', p_belanja_id, 'judul', v_judul);
END;
$$;

-- ============================================================
-- 9. belanja_kunci: kunci SATU ARAH, hanya penginput (BL9, BL10)
--    Membuka kunci hanya oleh ketua di SQL Editor (di luar fungsi ini).
--    Mengembalikan {id, dikunci_pada}.
-- ============================================================
CREATE FUNCTION public.belanja_kunci(
  p_akun       uuid,
  p_belanja_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_penginput uuid;
  v_kunci     timestamptz;
  v_waktu     timestamptz := now();
BEGIN
  PERFORM public.belanja_owner(p_akun);
  IF p_belanja_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  SELECT b.penginput, b.dikunci_pada
    INTO v_penginput, v_kunci
    FROM public.belanja b
   WHERE b.id = p_belanja_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'belanja_tidak_ditemukan';
  END IF;
  IF v_penginput <> p_akun THEN
    RAISE EXCEPTION 'bukan_penginput';
  END IF;
  IF v_kunci IS NOT NULL THEN
    RAISE EXCEPTION 'belanja_terkunci';   -- sudah terkunci (dua ketukan bersamaan: satu menang)
  END IF;

  UPDATE public.belanja
     SET dikunci_pada = v_waktu
   WHERE id = p_belanja_id;

  RETURN jsonb_build_object('id', p_belanja_id, 'dikunci_pada', v_waktu);
END;
$$;

-- ============================================================
-- 10. belanja_daftar: daftar catatan plus rekap, baca-saja (BL11, BL12, BL13)
--     Semua owner aktif boleh membaca. Total SELALU dihitung di sini; item Dibatalkan tidak dihitung.
--     Daftar: SEMUA catatan belum terkunci (tanpa batas) + bila p_terkunci true, catatan terkunci
--     sebanyak `belanja_terkunci_tampil` terbaru. Rekap: hanya catatan belum terkunci (lihat catatan
--     pilihan penulis di kepala berkas).
--     Balasan: {rekap: {total, per_owner: [{nama, total}]}, catatan: [...], terkunci_tampil_maks}
-- ============================================================
CREATE FUNCTION public.belanja_daftar(
  p_akun     uuid,
  p_terkunci boolean
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tampil integer;
  v_hasil  jsonb;
BEGIN
  PERFORM public.belanja_owner(p_akun);
  v_tampil := public.belanja_angka('belanja_terkunci_tampil');

  WITH pilih AS (
    SELECT b.*
      FROM public.belanja b
     WHERE b.dikunci_pada IS NULL
    UNION ALL
    (SELECT b.*
       FROM public.belanja b
      WHERE COALESCE(p_terkunci, false)
        AND b.dikunci_pada IS NOT NULL
      ORDER BY b.dikunci_pada DESC, b.id
      LIMIT v_tampil)
  ),
  total_catatan AS (
    SELECT i.belanja_id, sum(i.harga)::bigint AS total
      FROM public.belanja_item i
     WHERE NOT i.dibatalkan
       AND i.belanja_id IN (SELECT p.id FROM pilih p)
     GROUP BY i.belanja_id
  ),
  belum AS (
    SELECT p.penginput,
           max(p.nama_penginput)            AS nama,
           COALESCE(sum(t.total), 0)::bigint AS total
      FROM pilih p
      LEFT JOIN total_catatan t ON t.belanja_id = p.id
     WHERE p.dikunci_pada IS NULL
     GROUP BY p.penginput
  )
  SELECT jsonb_build_object(
    'rekap', jsonb_build_object(
      'total', COALESCE((SELECT sum(bl.total) FROM belum bl), 0),
      'per_owner', COALESCE(
        (SELECT jsonb_agg(
                  jsonb_build_object('nama', bl.nama, 'total', bl.total)
                  ORDER BY bl.nama, bl.penginput)
           FROM belum bl),
        '[]'::jsonb)
    ),
    'catatan', COALESCE(
      (SELECT jsonb_agg(
                jsonb_build_object(
                  'id',             p.id,
                  'judul',          p.judul,
                  'nama_penginput', p.nama_penginput,
                  'milik_saya',     (p.penginput = p_akun),
                  'dibuat_pada',    p.dibuat_pada,
                  'dikunci_pada',   p.dikunci_pada,
                  'total',          COALESCE(t.total, 0),
                  'item', COALESCE(
                    (SELECT jsonb_agg(
                              jsonb_build_object(
                                'id',            i.id,
                                'nama',          i.nama,
                                'harga',         i.harga,
                                'dibatalkan',    i.dibatalkan,
                                'ditambah_pada', i.ditambah_pada)
                              ORDER BY i.ditambah_pada, i.id)
                       FROM public.belanja_item i
                      WHERE i.belanja_id = p.id),
                    '[]'::jsonb)
                )
                ORDER BY (p.dikunci_pada IS NOT NULL), p.dibuat_pada DESC, p.id)
         FROM pilih p
         LEFT JOIN total_catatan t ON t.belanja_id = p.id),
      '[]'::jsonb),
    'terkunci_tampil_maks', v_tampil
  )
  INTO v_hasil;

  RETURN v_hasil;
END;
$$;

-- ============================================================
-- 11. Hak EXECUTE: cabut semua, beri ulang HANYA ke service_role (AGENTS.md bagian 7)
-- ============================================================
REVOKE ALL ON FUNCTION public.belanja_angka(text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.belanja_owner(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.belanja_item_periksa(jsonb)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.belanja_buat(uuid, text, jsonb)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.belanja_item_tambah(uuid, uuid, jsonb)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.belanja_item_ubah(uuid, uuid, jsonb)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.belanja_item_batal(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.belanja_judul_ubah(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.belanja_kunci(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.belanja_daftar(uuid, boolean)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.belanja_angka(text)                TO service_role;
GRANT EXECUTE ON FUNCTION public.belanja_owner(uuid)                TO service_role;
GRANT EXECUTE ON FUNCTION public.belanja_item_periksa(jsonb)        TO service_role;
GRANT EXECUTE ON FUNCTION public.belanja_buat(uuid, text, jsonb)    TO service_role;
GRANT EXECUTE ON FUNCTION public.belanja_item_tambah(uuid, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.belanja_item_ubah(uuid, uuid, jsonb)   TO service_role;
GRANT EXECUTE ON FUNCTION public.belanja_item_batal(uuid, uuid)     TO service_role;
GRANT EXECUTE ON FUNCTION public.belanja_judul_ubah(uuid, uuid, text)   TO service_role;
GRANT EXECUTE ON FUNCTION public.belanja_kunci(uuid, uuid)          TO service_role;
GRANT EXECUTE ON FUNCTION public.belanja_daftar(uuid, boolean)      TO service_role;

COMMIT;
