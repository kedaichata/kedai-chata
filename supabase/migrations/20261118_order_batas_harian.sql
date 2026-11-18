-- supabase/migrations/20261118_order_batas_harian.sql
-- BTO.02: batas order per customer per hari (order.md blok 18 Nov 2026 dan blok persetujuan BTO.01).
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH `kedai` versi BTO.03 di-deploy (pemetaan kode galat
-- `batas_order_harian`). Bila dijalankan lebih dulu, customer yang kena batas melihat galat umum.
-- Pembatalan: 20261118_order_batas_harian_batal.sql
-- Cek hasil: supabase/templates/20261118_order_batas_harian_cek.sql
-- Tanpa data nyata.
--
-- Yang BERUBAH:
--   - satu baris baru di `pengaturan`: `order_maks_per_hari` = 5 (diganti kelak lewat UPDATE di SQL Editor).
--   - fungsi `public.order_buat(uuid, text, uuid, text, text, jsonb, text)` diganti dengan CREATE OR REPLACE
--     (nama, parameter, dan tipe kembalian sama). Dasarnya persis versi 20261108_02_order_fungsi.sql;
--     satu-satunya tambahan: tiga variabel dan blok batas harian tepat setelah cek profil.
-- Yang SENGAJA TIDAK DISENTUH: semua tabel dan data, hak tabel, `order_daftar`, `order_detail`,
--   `order_buat_wakil` (order wakil owner tidak kena batas), pengaturan lain, dan order yang sudah ada.
--
-- Aturan batas:
--   - Batas: `order_maks_per_hari` order per customer per hari. Order ke-(batas+1) ditolak dengan galat
--     `batas_order_harian`, tanpa memakai nomor order.
--   - "Hari" = hari order DIBUAT, kalender WIB dari jam server (bukan hari antar, bukan jam HP).
--   - Semua status ikut dihitung (Menunggu, Disetujui, Ditolak, Dibatalkan, dst).
--   - Nilai pengaturan harus bilangan bulat 1 atau lebih (maks 6 digit); selain itu `pengaturan_rusak`.
--   - Kunci per akun (pg_advisory_xact_lock) mencegah dua kiriman bersamaan sama-sama lolos.
--   - Pesanan yang ditolak validasi (menu habis dan sebagainya) tidak membuat baris, jadi tidak terhitung.
--
-- Pola keamanan tidak berubah: SECURITY DEFINER, search_path kosong, `public.` eksplisit,
-- public."order", EXECUTE hanya untuk service_role.
--
-- Kode galat baru: batas_order_harian (dipetakan `kedai` di BTO.03). Kode lain sama dengan versi sebelumnya.

BEGIN;

INSERT INTO public.pengaturan (kunci, nilai)
VALUES ('order_maks_per_hari', '5');

CREATE OR REPLACE FUNCTION public.order_buat(
  p_akun      uuid,
  p_tipe      text,
  p_alamat_id uuid,
  p_hari      text,
  p_jam       text,
  p_item      jsonb,
  p_catatan   text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  c_uuid         CONSTANT text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
  v_nama         text;
  v_wa           text;
  v_tipe         text := btrim(p_tipe);
  v_hari_teks    text := btrim(p_hari);
  v_jam_teks     text := btrim(p_jam);
  v_hari_ini     date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  v_hari         date;
  v_jam          time;
  v_alias        text;
  v_isi_alamat   text;
  v_item_maks    integer;
  v_jumlah_maks  integer;
  v_cat_maks     integer;
  v_cat_n_maks   integer;
  v_catatan      text;
  v_n_item       integer;
  v_elem         jsonb;
  v_opsi_json    jsonb;
  v_opsi         uuid[];
  v_menu_id      uuid;
  v_jumlah       integer;
  v_nama_menu    text;
  v_harga        integer;
  v_aktif        boolean;
  v_tersedia     boolean;
  v_periksa      jsonb;
  v_pilihan      jsonb;
  v_baris        jsonb := '[]'::jsonb;
  v_total        bigint := 0;
  v_order_id     uuid;
  v_nomor        integer;
  v_batas_teks   text;
  v_batas        integer;
  v_n_hari       integer;
BEGIN
  IF p_akun IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Hanya customer yang memesan lewat fungsi ini (staf memakai order wakil, ORD.12)
  IF EXISTS (SELECT 1 FROM public.staf s WHERE s.id = p_akun) THEN
    RAISE EXCEPTION 'bukan_customer';
  END IF;

  SELECT p.nama_tampilan, p.nomor_wa
    INTO v_nama, v_wa
    FROM public.profil p
   WHERE p.id = p_akun;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profil_tidak_ada';
  END IF;

  -- BTO.02: batas order per customer per hari (order.md blok 18 Nov 2026).
  -- Nilai dibaca terpisah dengan cek bentuk angka, supaya nilai salah ketik di dashboard menjadi
  -- `pengaturan_rusak` (bukan galat konversi mentah) dan tidak diam-diam mematikan batas.
  SELECT g.nilai
    INTO v_batas_teks
    FROM public.pengaturan g
   WHERE g.kunci = 'order_maks_per_hari';
  IF v_batas_teks IS NULL OR v_batas_teks !~ '^[0-9]{1,6}$' THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;
  v_batas := v_batas_teks::integer;
  IF v_batas < 1 THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;

  -- Kunci per akun sampai transaksi selesai: dua kiriman bersamaan dari akun yang sama antre,
  -- jadi tidak bisa sama-sama lolos. Akun lain tidak terhambat.
  PERFORM pg_advisory_xact_lock(hashtextextended('order_buat:' || p_akun::text, 0));

  -- Hitung semua order akun ini yang DIBUAT hari ini (kalender WIB, jam server), apa pun statusnya.
  -- Order wakil owner tidak ikut: pemesannya kosong, bukan akun customer.
  SELECT count(*)
    INTO v_n_hari
    FROM public."order" o
   WHERE o.pemesan = p_akun
     AND (o.dibuat_pada AT TIME ZONE 'Asia/Jakarta')::date = v_hari_ini;
  IF v_n_hari >= v_batas THEN
    RAISE EXCEPTION 'batas_order_harian';
  END IF;

  -- Batas dibaca dari pengaturan, tidak ditulis mati (AGENTS.md bagian 1)
  SELECT
    max(g.nilai::integer) FILTER (WHERE g.kunci = 'item_maks_per_order'),
    max(g.nilai::integer) FILTER (WHERE g.kunci = 'jumlah_maks_per_item'),
    max(g.nilai::integer) FILTER (WHERE g.kunci = 'catatan_maks_karakter'),
    max(g.nilai::integer) FILTER (WHERE g.kunci = 'catatan_maks_per_order')
    INTO v_item_maks, v_jumlah_maks, v_cat_maks, v_cat_n_maks
    FROM public.pengaturan g
   WHERE g.kunci IN ('item_maks_per_order', 'jumlah_maks_per_item',
                     'catatan_maks_karakter', 'catatan_maks_per_order');
  IF COALESCE(v_item_maks, 0) < 1 OR COALESCE(v_jumlah_maks, 0) < 1
     OR COALESCE(v_cat_maks, 0) < 1 OR COALESCE(v_cat_n_maks, 0) < 1 THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;

  -- Tipe (O1)
  IF COALESCE(v_tipe, '') NOT IN ('Diantar', 'Diambil', 'Makan di warung') THEN
    RAISE EXCEPTION 'tipe_tidak_valid';
  END IF;

  -- Hari: dihitung server, bukan jam HP (O2, aturan 6)
  IF v_hari_teks = 'Hari ini' THEN
    v_hari := v_hari_ini;
  ELSIF v_hari_teks = 'Besok' THEN
    v_hari := v_hari_ini + 1;
  ELSE
    RAISE EXCEPTION 'hari_tidak_valid';
  END IF;

  -- Jam: bebas diisi, hanya format dicek. Jam yang sudah lewat TIDAK ditolak (O2).
  IF COALESCE(v_jam_teks, '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$' THEN
    RAISE EXCEPTION 'jam_tidak_valid';
  END IF;
  v_jam := left(v_jam_teks, 5)::time;

  -- Alamat (O4): hanya tipe Diantar; harus alamat AKTIF milik sendiri (SEC-09)
  IF v_tipe = 'Diantar' THEN
    IF p_alamat_id IS NULL THEN
      RAISE EXCEPTION 'alamat_wajib';
    END IF;
    SELECT a.alias, a.isi
      INTO v_alias, v_isi_alamat
      FROM public.alamat a
     WHERE a.id = p_alamat_id AND a.pemilik = p_akun AND a.aktif;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'alamat_tidak_ditemukan';
    END IF;
  END IF;

  -- Catatan awal (O12): panjang dicek dari pengaturan
  v_catatan := btrim(COALESCE(p_catatan, ''), E' \t\r\n');
  IF char_length(v_catatan) > v_cat_maks THEN
    RAISE EXCEPTION 'catatan_terlalu_panjang';
  END IF;

  -- Isi order: bentuk dan jumlah baris
  IF p_item IS NULL OR jsonb_typeof(p_item) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'item_tidak_valid';
  END IF;
  v_n_item := jsonb_array_length(p_item);
  IF v_n_item < 1 THEN
    RAISE EXCEPTION 'item_kosong';
  END IF;
  IF v_n_item > v_item_maks THEN
    RAISE EXCEPTION 'item_terlalu_banyak';
  END IF;

  -- Tiap baris: cek menu, harga dari server, pilihan lewat opsi_periksa
  FOR v_elem IN
    SELECT x.e FROM jsonb_array_elements(p_item) WITH ORDINALITY AS x(e, n) ORDER BY x.n
  LOOP
    IF jsonb_typeof(v_elem) IS DISTINCT FROM 'object'
       OR jsonb_typeof(v_elem -> 'menu_id') IS DISTINCT FROM 'string'
       OR (v_elem ->> 'menu_id') !~ c_uuid THEN
      RAISE EXCEPTION 'item_tidak_valid';
    END IF;
    v_menu_id := (v_elem ->> 'menu_id')::uuid;

    IF jsonb_typeof(v_elem -> 'jumlah') IS DISTINCT FROM 'number'
       OR (v_elem ->> 'jumlah') !~ '^[0-9]{1,4}$' THEN
      RAISE EXCEPTION 'jumlah_tidak_valid';
    END IF;
    v_jumlah := (v_elem ->> 'jumlah')::integer;
    IF v_jumlah < 1 THEN
      RAISE EXCEPTION 'jumlah_tidak_valid';
    END IF;
    IF v_jumlah > v_jumlah_maks THEN
      RAISE EXCEPTION 'jumlah_terlalu_banyak';
    END IF;

    -- Id opsi terpilih (boleh tidak ada: opsi bawaan dipakai)
    v_opsi_json := v_elem -> 'opsi_ids';
    IF v_opsi_json IS NULL OR jsonb_typeof(v_opsi_json) = 'null' THEN
      v_opsi := ARRAY[]::uuid[];
    ELSIF jsonb_typeof(v_opsi_json) <> 'array' THEN
      RAISE EXCEPTION 'item_tidak_valid';
    ELSE
      IF EXISTS (
        SELECT 1
          FROM jsonb_array_elements(v_opsi_json) AS o(e)
         WHERE jsonb_typeof(o.e) IS DISTINCT FROM 'string'
            OR (o.e #>> '{}') !~ c_uuid
      ) THEN
        RAISE EXCEPTION 'item_tidak_valid';
      END IF;
      SELECT COALESCE(array_agg((o.e #>> '{}')::uuid), ARRAY[]::uuid[])
        INTO v_opsi
        FROM jsonb_array_elements(v_opsi_json) AS o(e);
    END IF;

    -- Menu: harus ada, aktif, dan tersedia. Harga dibaca di sini, bukan dari aplikasi (aturan 2).
    SELECT m.nama, m.harga, m.aktif, m.tersedia
      INTO v_nama_menu, v_harga, v_aktif, v_tersedia
      FROM public.menu m
     WHERE m.id = v_menu_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'menu_tidak_ditemukan';
    END IF;
    IF NOT v_aktif OR NOT v_tersedia THEN
      RAISE EXCEPTION 'menu_tidak_tersedia';
    END IF;

    -- Pilihan final per grup (opsi bawaan bila tidak dipilih); galat opsi_tidak_valid dan pilihan_rusak
    -- datang dari opsi_periksa. Salinan teks "Nama grup: Nama opsi" mengikuti urutan grup di menu.
    v_periksa := public.opsi_periksa(v_menu_id, v_opsi);
    SELECT COALESCE(
             jsonb_agg(to_jsonb((r.e ->> 'grup_nama') || ': ' || (r.e ->> 'opsi_nama')) ORDER BY r.n),
             '[]'::jsonb
           )
      INTO v_pilihan
      FROM jsonb_array_elements(v_periksa) WITH ORDINALITY AS r(e, n);

    v_total := v_total + (v_harga::bigint * v_jumlah);
    v_baris := v_baris || jsonb_build_array(
      jsonb_build_object(
        'menu_id',      v_menu_id,
        'nama_menu',    v_nama_menu,
        'harga_satuan', v_harga,
        'jumlah',       v_jumlah,
        'subtotal',     v_harga * v_jumlah,
        'pilihan',      v_pilihan
      )
    );
  END LOOP;

  -- Pengaman: total harus muat di kolom integer
  IF v_total > 2147483647 THEN
    RAISE EXCEPTION 'total_terlalu_besar';
  END IF;

  -- Simpan. Status awal Menunggu, tanpa metode bayar dan tanpa pemutus (pagar tabel order).
  INSERT INTO public."order" (
    pemesan, nama_pemesan, nomor_wa_pemesan, tipe, hari_target, jam_permintaan,
    alias_alamat, isi_alamat, total
  )
  VALUES (
    p_akun, v_nama, v_wa, v_tipe, v_hari, v_jam,
    v_alias, v_isi_alamat, v_total::integer
  )
  RETURNING id, nomor INTO v_order_id, v_nomor;

  INSERT INTO public.order_item (order_id, menu_id, nama_menu, harga_satuan, jumlah, subtotal, pilihan)
  SELECT
    v_order_id,
    (b.e ->> 'menu_id')::uuid,
    b.e ->> 'nama_menu',
    (b.e ->> 'harga_satuan')::integer,
    (b.e ->> 'jumlah')::integer,
    (b.e ->> 'subtotal')::integer,
    ARRAY(
      SELECT u.t
        FROM jsonb_array_elements_text(b.e -> 'pilihan') WITH ORDINALITY AS u(t, k)
       ORDER BY u.k
    )
    FROM jsonb_array_elements(v_baris) WITH ORDINALITY AS b(e, n)
   ORDER BY b.n;

  -- Catatan awal = catatan pertama (O12), hanya bila diisi
  IF v_catatan <> '' THEN
    INSERT INTO public.catatan_order (order_id, penulis, nama_penulis, peran_penulis, isi)
    VALUES (v_order_id, p_akun, v_nama, 'customer', v_catatan);
  END IF;

  -- Riwayat pertama: status asal kosong, tujuan Menunggu (O10)
  INSERT INTO public.riwayat_status (order_id, status_asal, status_tujuan, oleh)
  VALUES (v_order_id, NULL, 'Menunggu', p_akun);

  RETURN jsonb_build_object(
    'id',             v_order_id,
    'nomor',          v_nomor,
    'status',         'Menunggu',
    'total',          v_total,
    'hari_target',    v_hari,
    'jam_permintaan', to_char(v_jam, 'HH24:MI')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.order_buat(uuid, text, uuid, text, text, jsonb, text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.order_buat(uuid, text, uuid, text, text, jsonb, text) TO service_role;

COMMIT;
