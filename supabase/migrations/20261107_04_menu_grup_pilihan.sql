-- supabase/migrations/20261107_04_menu_grup_pilihan.sql
-- MNU.09 (giliran 1): grup pilihan gratis (tabel grup, opsi, pemasangan ke menu), dua pengaturan baru,
-- fungsi SQL baru, dan `menu_daftar` diperluas. Aksi `kedai` (index.ts) dikerjakan di giliran 2.
-- Layar owner (MNU.10) dan tampilan pilihan di sheet detail (MNU.11) dikerjakan terpisah.
-- Dijalankan MANUAL di SQL Editor (akun ketua). Pembatalan: 20261107_04_menu_grup_pilihan_batal.sql
-- Cek hasil: supabase/templates/20261107_04_menu_grup_pilihan_cek.sql
-- Tanpa data nyata.
--
-- Yang BARU:
--   - tabel `public.grup_pilihan`, `public.opsi_pilihan`, `public.menu_grup`
--   - baris pengaturan `grup_maks_per_menu` = 3 dan `opsi_maks_per_grup` = 6
--   - fungsi `grup_simpan`, `grup_nonaktif`, `grup_daftar`, `menu_grup_atur`, `opsi_periksa`
-- Yang DIGANTI di tempat (tanda tangan sama, hak EXECUTE sama):
--   - `public.menu_daftar(boolean)`: balasannya kini membawa field `grup` (grup aktif yang terpasang di menu,
--     lengkap dengan opsi aktifnya). Field lama tidak berubah; aplikasi dan `kedai` yang lama tidak terganggu.
-- Yang SENGAJA TIDAK DISENTUH:
--   - `public.menu_simpan` (7 argumen) dan versi 6 argumen yang belum dibuang. Pemasangan grup ke menu
--     lewat fungsi sendiri (`menu_grup_atur`), jadi `menu_simpan` tidak berubah.
--   - Tabel `order` dan `order_item` belum ada (ORD.01). `opsi_periksa` hanya disiapkan; ORD.01 yang memanggilnya.
--
-- Keputusan yang berlaku (menu.md bagian 9, blok "Deskripsi, sheet detail, dan pilihan menu", 7 Nov 2026):
--   - Grup dibuat owner sekali, dipasang ke menu mana saja. Satu jenis grup: pilih satu, tepat satu opsi bawaan,
--     gratis (tidak mengubah harga dan total). Satu menu boleh memakai lebih dari satu grup.
--   - Grup dan opsi TIDAK dihapus, hanya dinonaktifkan. Karena itu pemasangan ke menu juga memakai penanda
--     aktif (melepas grup = menandai tidak aktif), sebab `service_role` tanpa DELETE.
--   - Aplikasi hanya mengirim id opsi terpilih; bila tidak dikirim, server memakai opsi bawaan.
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   - Batas bawaan: 3 grup per menu, 6 opsi aktif per grup (disimpan di pengaturan, bukan ditulis mati).
--   - Panjang nama: grup 3 sampai 30 karakter, opsi 2 sampai 30 karakter (bentuk data, di tabel dan fungsi).
--   - Grup harus punya minimal 2 opsi aktif (satu opsi saja bukan pilihan).
--   - Batas opsi dan grup dihitung dari yang AKTIF saja, karena yang nonaktif tidak bisa dihapus.
--
-- Cara `grup_simpan` bekerja (penting untuk giliran 2 dan MNU.10):
--   - `p_opsi` adalah DAFTAR LENGKAP opsi grup itu (array JSON), urutannya = urutan tampil.
--     Tiap elemen: {"id": <id opsi lama atau kosong bila opsi baru>, "nama": "...", "bawaan": true/false,
--     "aktif": true/false (bila tidak ada dianggap true)}.
--   - Saat mengubah grup yang sudah ada, SEMUA opsi lama (termasuk yang nonaktif) wajib ikut dikirim;
--     opsi yang mau dibuang dikirim dengan "aktif": false. Bila ada yang kurang, ditolak (opsi_tidak_lengkap).
--   - Tepat satu elemen "bawaan": true, dan elemen itu harus aktif.
--   - Grup nonaktif hanya bisa diubah bila p_aktifkan = true (sekaligus mengaktifkannya kembali).
--
-- Kode galat baru (untuk `kedai`, giliran 2):
--   grup_nama_tidak_valid, grup_nama_kembar, grup_tidak_ditemukan, grup_tidak_aktif, grup_tidak_valid,
--   grup_terlalu_banyak, opsi_tidak_valid, opsi_tidak_lengkap, opsi_nama_kembar, opsi_terlalu_banyak,
--   pilihan_rusak (data tidak konsisten; seharusnya tidak pernah muncul). Yang lama tetap
--   (id_kosong, bukan_owner, pengaturan_rusak, menu_tidak_ditemukan, dan seterusnya).

BEGIN;

-- ============================================================
-- 1. Pengaturan baru (database.md bagian 4: angka yang bisa berubah ada di database)
-- ============================================================
INSERT INTO public.pengaturan (kunci, nilai, keterangan)
VALUES
  ('grup_maks_per_menu', '3', 'Batas grup pilihan aktif yang dipasang di satu menu (MNU.09)'),
  ('opsi_maks_per_grup', '6', 'Batas opsi aktif dalam satu grup pilihan (MNU.09)');

-- ============================================================
-- 2. Tabel grup pilihan
--    Pagar di tabel hanya soal bentuk. Batas jumlah dijaga fungsi dari pengaturan.
-- ============================================================
CREATE TABLE public.grup_pilihan (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        text        NOT NULL
              CONSTRAINT grup_pilihan_nama_cek CHECK (
                char_length(nama) BETWEEN 3 AND 30
                AND nama !~ '[[:cntrl:]]'   -- tanpa karakter kontrol (termasuk tab dan baris baru)
                AND nama !~ '^\s'           -- tanpa spasi di awal
                AND nama !~ '\s$'           -- tanpa spasi di akhir
                AND nama !~ '\s\s'          -- tanpa spasi ganda
              ),
  aktif       boolean     NOT NULL DEFAULT true,
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  diubah_pada timestamptz NOT NULL DEFAULT now(),
  diubah_oleh uuid        NOT NULL
);

-- Nama grup aktif tidak boleh kembar (huruf besar atau kecil dianggap sama)
CREATE UNIQUE INDEX grup_pilihan_nama_aktif_uniq
  ON public.grup_pilihan (lower(nama))
  WHERE aktif;

-- ============================================================
-- 3. Tabel opsi pilihan
--    Satu opsi bawaan per grup dijaga indeks unik (paling banyak satu) dan fungsi (wajib ada satu).
--    Opsi bawaan tidak boleh nonaktif.
-- ============================================================
CREATE TABLE public.opsi_pilihan (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  grup_id     uuid        NOT NULL REFERENCES public.grup_pilihan (id),
  nama        text        NOT NULL
              CONSTRAINT opsi_pilihan_nama_cek CHECK (
                char_length(nama) BETWEEN 2 AND 30
                AND nama !~ '[[:cntrl:]]'
                AND nama !~ '^\s'
                AND nama !~ '\s$'
                AND nama !~ '\s\s'
              ),
  bawaan      boolean     NOT NULL DEFAULT false,
  aktif       boolean     NOT NULL DEFAULT true,
  urutan      integer     NOT NULL DEFAULT 0
              CONSTRAINT opsi_pilihan_urutan_cek CHECK (urutan >= 0),
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  diubah_pada timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT opsi_pilihan_bawaan_aktif_cek CHECK (NOT bawaan OR aktif)
);

-- Nama opsi aktif tidak boleh kembar di dalam satu grup
CREATE UNIQUE INDEX opsi_pilihan_nama_aktif_uniq
  ON public.opsi_pilihan (grup_id, lower(nama))
  WHERE aktif;

-- Paling banyak satu opsi bawaan per grup
CREATE UNIQUE INDEX opsi_pilihan_bawaan_uniq
  ON public.opsi_pilihan (grup_id)
  WHERE bawaan;

-- ============================================================
-- 4. Tabel pemasangan grup ke menu
--    Tidak ada DELETE: melepas grup dari menu = aktif jadi false.
-- ============================================================
CREATE TABLE public.menu_grup (
  menu_id     uuid        NOT NULL REFERENCES public.menu (id),
  grup_id     uuid        NOT NULL REFERENCES public.grup_pilihan (id),
  urutan      integer     NOT NULL DEFAULT 0
              CONSTRAINT menu_grup_urutan_cek CHECK (urutan >= 0),
  aktif       boolean     NOT NULL DEFAULT true,
  diubah_pada timestamptz NOT NULL DEFAULT now(),
  diubah_oleh uuid        NOT NULL,
  PRIMARY KEY (menu_id, grup_id)
);

-- ============================================================
-- 5. RLS aktif tanpa policy, hak tabel seminimal mungkin (database.md bagian 3)
--    service_role: baca, tambah, ubah. Tanpa DELETE. anon dan authenticated nol.
-- ============================================================
ALTER TABLE public.grup_pilihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opsi_pilihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_grup    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.grup_pilihan FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.opsi_pilihan FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.menu_grup    FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.grup_pilihan TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.opsi_pilihan TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.menu_grup    TO service_role;

-- ============================================================
-- 6. grup_simpan: owner. Tambah grup (p_id kosong) atau ubah grup (p_id terisi),
--    beserta SELURUH opsinya, dalam satu langkah atomik. Mengembalikan id grup.
--    p_aktifkan = true: sekaligus mengaktifkan kembali grup yang nonaktif.
-- ============================================================
CREATE FUNCTION public.grup_simpan(
  p_oleh     uuid,
  p_id       uuid,
  p_nama     text,
  p_opsi     jsonb,
  p_aktifkan boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_nama       text;
  v_id         uuid;
  v_aktif      boolean;
  v_maks       bigint;
  v_n          integer;
  v_i          integer;
  v_item       jsonb;
  v_tmp        text;
  v_ids        uuid[]    := ARRAY[]::uuid[];
  v_namas      text[]    := ARRAY[]::text[];
  v_bawaans    boolean[] := ARRAY[]::boolean[];
  v_aktifs     boolean[] := ARRAY[]::boolean[];
  v_jml_aktif  integer   := 0;
  v_jml_bawaan integer   := 0;
  v_jml_lama   integer;
  v_jml_id     integer;
  v_cocok      integer;
BEGIN
  IF p_oleh IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.staf s
    WHERE s.id = p_oleh AND s.aktif AND s.peran = 'owner'
  ) THEN
    RAISE EXCEPTION 'bukan_owner';
  END IF;

  -- Rapikan nama grup: spasi ganda jadi satu, karakter kontrol dibuang, spasi di tepi dibuang
  v_nama := regexp_replace(COALESCE(p_nama, ''), '\s+', ' ', 'g');
  v_nama := regexp_replace(v_nama, '[[:cntrl:]]', '', 'g');
  v_nama := regexp_replace(regexp_replace(v_nama, '\s+', ' ', 'g'), '^\s+|\s+$', '', 'g');
  IF char_length(v_nama) < 3 OR char_length(v_nama) > 30 THEN
    RAISE EXCEPTION 'grup_nama_tidak_valid';
  END IF;

  -- Batas opsi aktif per grup (pengaturan)
  SELECT CASE WHEN s.nilai::text ~ '^[0-9]{1,9}$' THEN s.nilai::text::bigint END
    INTO v_maks
    FROM public.pengaturan s
   WHERE s.kunci = 'opsi_maks_per_grup';
  IF v_maks IS NULL THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;

  -- Bentuk daftar opsi: array JSON, 2 sampai 100 elemen (100 = pagar kasar; batas aktif dicek di bawah)
  IF p_opsi IS NULL OR jsonb_typeof(p_opsi) <> 'array' THEN
    RAISE EXCEPTION 'opsi_tidak_valid';
  END IF;
  v_n := jsonb_array_length(p_opsi);
  IF v_n < 2 OR v_n > 100 THEN
    RAISE EXCEPTION 'opsi_tidak_valid';
  END IF;

  FOR v_i IN 0 .. v_n - 1 LOOP
    v_item := p_opsi -> v_i;
    IF jsonb_typeof(v_item) <> 'object' THEN
      RAISE EXCEPTION 'opsi_tidak_valid';
    END IF;

    -- id: kosong (opsi baru) atau uuid
    v_tmp := COALESCE(jsonb_typeof(v_item -> 'id'), 'null');
    IF v_tmp = 'null' THEN
      v_ids := array_append(v_ids, NULL::uuid);
    ELSIF v_tmp = 'string'
          AND (v_item ->> 'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      v_ids := array_append(v_ids, (v_item ->> 'id')::uuid);
    ELSE
      RAISE EXCEPTION 'opsi_tidak_valid';
    END IF;

    -- nama: teks, dirapikan seperti nama grup, 2 sampai 30 karakter
    IF jsonb_typeof(v_item -> 'nama') IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION 'opsi_tidak_valid';
    END IF;
    v_tmp := regexp_replace(v_item ->> 'nama', '\s+', ' ', 'g');
    v_tmp := regexp_replace(v_tmp, '[[:cntrl:]]', '', 'g');
    v_tmp := regexp_replace(regexp_replace(v_tmp, '\s+', ' ', 'g'), '^\s+|\s+$', '', 'g');
    IF char_length(v_tmp) < 2 OR char_length(v_tmp) > 30 THEN
      RAISE EXCEPTION 'opsi_tidak_valid';
    END IF;
    v_namas := array_append(v_namas, v_tmp);

    -- bawaan: boolean, bila tidak ada dianggap false
    v_tmp := COALESCE(jsonb_typeof(v_item -> 'bawaan'), 'null');
    IF v_tmp NOT IN ('boolean', 'null') THEN
      RAISE EXCEPTION 'opsi_tidak_valid';
    END IF;
    v_bawaans := array_append(v_bawaans, COALESCE((v_item ->> 'bawaan')::boolean, false));

    -- aktif: boolean, bila tidak ada dianggap true
    v_tmp := COALESCE(jsonb_typeof(v_item -> 'aktif'), 'null');
    IF v_tmp NOT IN ('boolean', 'null') THEN
      RAISE EXCEPTION 'opsi_tidak_valid';
    END IF;
    v_aktifs := array_append(v_aktifs, COALESCE((v_item ->> 'aktif')::boolean, true));

    -- hitung; opsi bawaan wajib aktif
    IF v_bawaans[v_i + 1] AND NOT v_aktifs[v_i + 1] THEN
      RAISE EXCEPTION 'opsi_tidak_valid';
    END IF;
    IF v_bawaans[v_i + 1] THEN
      v_jml_bawaan := v_jml_bawaan + 1;
    END IF;
    IF v_aktifs[v_i + 1] THEN
      v_jml_aktif := v_jml_aktif + 1;
    END IF;
  END LOOP;

  IF v_jml_bawaan <> 1 THEN
    RAISE EXCEPTION 'opsi_tidak_valid';
  END IF;
  IF v_jml_aktif < 2 THEN
    RAISE EXCEPTION 'opsi_tidak_valid';
  END IF;
  IF v_jml_aktif > v_maks THEN
    RAISE EXCEPTION 'opsi_terlalu_banyak';
  END IF;

  -- Nama opsi aktif tidak boleh kembar di dalam daftar
  IF EXISTS (
    SELECT 1
      FROM unnest(v_namas, v_aktifs) AS t(nm, ak)
     WHERE t.ak
     GROUP BY lower(t.nm)
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'opsi_nama_kembar';
  END IF;

  -- Id opsi yang terisi tidak boleh dobel
  IF (SELECT count(x) <> count(DISTINCT x) FROM unnest(v_ids) AS x) THEN
    RAISE EXCEPTION 'opsi_tidak_valid';
  END IF;

  IF p_id IS NULL THEN
    -- Grup baru: semua opsi harus baru (tanpa id)
    SELECT count(x) INTO v_jml_id FROM unnest(v_ids) AS x;
    IF v_jml_id > 0 THEN
      RAISE EXCEPTION 'opsi_tidak_valid';
    END IF;

    BEGIN
      INSERT INTO public.grup_pilihan (nama, aktif, diubah_pada, diubah_oleh)
      VALUES (v_nama, true, now(), p_oleh)
      RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'grup_nama_kembar';
    END;
  ELSE
    -- Ubah grup yang ada (dikunci supaya dua owner tidak bertabrakan)
    SELECT g.aktif INTO v_aktif
      FROM public.grup_pilihan g
     WHERE g.id = p_id
       FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'grup_tidak_ditemukan';
    END IF;
    IF NOT v_aktif AND NOT COALESCE(p_aktifkan, false) THEN
      RAISE EXCEPTION 'grup_tidak_aktif';
    END IF;
    v_id := p_id;

    -- Daftar harus lengkap: semua opsi lama ikut dikirim, tidak ada id milik grup lain
    SELECT count(*) INTO v_jml_lama FROM public.opsi_pilihan o WHERE o.grup_id = v_id;
    SELECT count(x) INTO v_jml_id   FROM unnest(v_ids) AS x;
    SELECT count(*) INTO v_cocok
      FROM public.opsi_pilihan o
     WHERE o.grup_id = v_id AND o.id = ANY (v_ids);
    IF v_cocok <> v_jml_lama OR v_cocok <> v_jml_id THEN
      RAISE EXCEPTION 'opsi_tidak_lengkap';
    END IF;

    BEGIN
      UPDATE public.grup_pilihan
         SET nama        = v_nama,
             aktif       = CASE WHEN COALESCE(p_aktifkan, false) THEN true ELSE aktif END,
             diubah_pada = now(),
             diubah_oleh = p_oleh
       WHERE id = v_id;
    EXCEPTION WHEN unique_violation THEN
      -- Termasuk saat mengaktifkan kembali grup yang namanya sudah dipakai grup aktif
      RAISE EXCEPTION 'grup_nama_kembar';
    END;

    -- Kosongkan dulu semua opsi lama (nonaktif, bukan bawaan), lalu isi ulang dari daftar.
    -- Ini mencegah tabrakan nama atau opsi bawaan di tengah jalan (misalnya dua opsi bertukar nama);
    -- hasil akhirnya sudah dicek di atas, dan semuanya satu transaksi.
    UPDATE public.opsi_pilihan
       SET bawaan = false, aktif = false, diubah_pada = now()
     WHERE grup_id = v_id;
  END IF;

  -- Tulis opsi sesuai daftar (urutan daftar = urutan tampil)
  BEGIN
    FOR v_i IN 1 .. v_n LOOP
      IF v_ids[v_i] IS NULL THEN
        INSERT INTO public.opsi_pilihan (grup_id, nama, bawaan, aktif, urutan, diubah_pada)
        VALUES (v_id, v_namas[v_i], v_bawaans[v_i], v_aktifs[v_i], v_i, now());
      ELSE
        UPDATE public.opsi_pilihan
           SET nama        = v_namas[v_i],
               bawaan      = v_bawaans[v_i],
               aktif       = v_aktifs[v_i],
               urutan      = v_i,
               diubah_pada = now()
         WHERE id = v_ids[v_i] AND grup_id = v_id;
      END IF;
    END LOOP;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'opsi_nama_kembar';
  END;

  RETURN v_id;
END;
$$;

-- ============================================================
-- 7. grup_nonaktif: owner. Menandai grup tidak aktif (opsinya tidak diubah, pemasangannya dibiarkan).
--    Grup nonaktif tidak tampil di menu dan tidak sah dipilih; mengaktifkan kembali lewat grup_simpan.
-- ============================================================
CREATE FUNCTION public.grup_nonaktif(
  p_oleh uuid,
  p_id   uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_oleh IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.staf s
    WHERE s.id = p_oleh AND s.aktif AND s.peran = 'owner'
  ) THEN
    RAISE EXCEPTION 'bukan_owner';
  END IF;

  IF p_id IS NULL THEN
    RAISE EXCEPTION 'grup_tidak_ditemukan';
  END IF;

  PERFORM 1 FROM public.grup_pilihan g WHERE g.id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'grup_tidak_ditemukan';
  END IF;

  UPDATE public.grup_pilihan
     SET aktif       = false,
         diubah_pada = now(),
         diubah_oleh = p_oleh
   WHERE id = p_id;
END;
$$;

-- ============================================================
-- 8. grup_daftar: daftar grup beserta opsinya (untuk layar owner, MNU.10).
--    p_semua = true: semua grup dan semua opsi (termasuk nonaktif, agar bisa dikirim balik lengkap).
--    p_semua = false: hanya yang aktif. Pembatasan peran dilakukan `kedai` (seperti menu_daftar).
-- ============================================================
CREATE FUNCTION public.grup_daftar(p_semua boolean)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',    g.id,
          'nama',  g.nama,
          'aktif', g.aktif,
          'opsi',  COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id',      o.id,
                  'nama',    o.nama,
                  'bawaan',  o.bawaan,
                  'aktif',   o.aktif,
                  'urutan',  o.urutan
                )
                ORDER BY o.urutan, lower(o.nama), o.id
              )
              FROM public.opsi_pilihan o
              WHERE o.grup_id = g.id
                AND (o.aktif OR COALESCE(p_semua, false))
            ),
            '[]'::jsonb
          )
        )
        ORDER BY lower(g.nama), g.id
      )
      FROM public.grup_pilihan g
      WHERE g.aktif OR COALESCE(p_semua, false)
    ),
    '[]'::jsonb
  );
END;
$$;

-- ============================================================
-- 9. menu_grup_atur: owner. Menetapkan grup apa saja yang terpasang di satu menu.
--    p_grup_ids = daftar LENGKAP grup aktif yang diinginkan (urutan daftar = urutan tampil).
--    Daftar kosong = lepas semua. Grup lain yang tadinya terpasang ditandai tidak aktif.
-- ============================================================
CREATE FUNCTION public.menu_grup_atur(
  p_oleh     uuid,
  p_menu_id  uuid,
  p_grup_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_n    integer;
  v_maks bigint;
BEGIN
  IF p_oleh IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.staf s
    WHERE s.id = p_oleh AND s.aktif AND s.peran = 'owner'
  ) THEN
    RAISE EXCEPTION 'bukan_owner';
  END IF;

  IF p_menu_id IS NULL THEN
    RAISE EXCEPTION 'menu_tidak_ditemukan';
  END IF;

  IF p_grup_ids IS NULL THEN
    RAISE EXCEPTION 'grup_tidak_valid';
  END IF;
  v_n := COALESCE(cardinality(p_grup_ids), 0);

  -- Tanpa elemen kosong dan tanpa id dobel
  IF EXISTS (SELECT 1 FROM unnest(p_grup_ids) AS x WHERE x IS NULL)
     OR (SELECT count(DISTINCT x) FROM unnest(p_grup_ids) AS x) <> v_n THEN
    RAISE EXCEPTION 'grup_tidak_valid';
  END IF;

  -- Menu dikunci supaya dua owner tidak bertabrakan
  PERFORM 1 FROM public.menu m WHERE m.id = p_menu_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'menu_tidak_ditemukan';
  END IF;

  SELECT CASE WHEN s.nilai::text ~ '^[0-9]{1,9}$' THEN s.nilai::text::bigint END
    INTO v_maks
    FROM public.pengaturan s
   WHERE s.kunci = 'grup_maks_per_menu';
  IF v_maks IS NULL THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;
  IF v_n > v_maks THEN
    RAISE EXCEPTION 'grup_terlalu_banyak';
  END IF;

  -- Semua grup yang diminta harus ada dan aktif
  IF (
    SELECT count(*) FROM public.grup_pilihan g
     WHERE g.id = ANY (p_grup_ids) AND g.aktif
  ) <> v_n THEN
    RAISE EXCEPTION 'grup_tidak_ditemukan';
  END IF;

  -- Pasang atau aktifkan kembali yang diminta
  INSERT INTO public.menu_grup (menu_id, grup_id, urutan, aktif, diubah_pada, diubah_oleh)
  SELECT p_menu_id, t.gid, t.n::integer, true, now(), p_oleh
    FROM unnest(p_grup_ids) WITH ORDINALITY AS t(gid, n)
  ON CONFLICT (menu_id, grup_id) DO UPDATE
     SET urutan      = EXCLUDED.urutan,
         aktif       = true,
         diubah_pada = now(),
         diubah_oleh = p_oleh;

  -- Lepas (tandai tidak aktif) yang tidak ada di daftar
  UPDATE public.menu_grup
     SET aktif       = false,
         diubah_pada = now(),
         diubah_oleh = p_oleh
   WHERE menu_id = p_menu_id
     AND aktif
     AND NOT (grup_id = ANY (p_grup_ids));
END;
$$;

-- ============================================================
-- 10. opsi_periksa: untuk dipanggil fungsi order (ORD.01), bukan langsung dari aplikasi.
--     Diberi menu dan daftar id opsi yang dipilih customer (boleh kosong atau NULL),
--     mengembalikan pilihan final per grup yang terpasang di menu itu:
--       [{grup_id, grup_nama, opsi_id, opsi_nama}, ...]
--     Grup tanpa pilihan memakai opsi bawaan. Opsi yang bukan milik grup aktif yang terpasang di menu itu,
--     opsi nonaktif, id dobel, atau dua opsi dari grup yang sama: galat opsi_tidak_valid.
--     Menu tanpa grup mengembalikan [] (dan id opsi apa pun yang dikirim ditolak).
-- ============================================================
CREATE FUNCTION public.opsi_periksa(
  p_menu_id  uuid,
  p_opsi_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ids    uuid[] := COALESCE(p_opsi_ids, ARRAY[]::uuid[]);
  v_n      integer;
  v_cocok  integer;
  v_grup   integer;
  v_hasil  jsonb;
BEGIN
  IF p_menu_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM public.menu m WHERE m.id = p_menu_id) THEN
    RAISE EXCEPTION 'menu_tidak_ditemukan';
  END IF;

  v_n := COALESCE(cardinality(v_ids), 0);

  -- Tanpa elemen kosong dan tanpa id dobel
  IF EXISTS (SELECT 1 FROM unnest(v_ids) AS x WHERE x IS NULL)
     OR (SELECT count(DISTINCT x) FROM unnest(v_ids) AS x) <> v_n THEN
    RAISE EXCEPTION 'opsi_tidak_valid';
  END IF;

  -- Setiap id harus opsi aktif dari grup aktif yang terpasang aktif di menu ini
  SELECT count(*) INTO v_cocok
    FROM public.opsi_pilihan o
    JOIN public.grup_pilihan g ON g.id = o.grup_id AND g.aktif
    JOIN public.menu_grup mg   ON mg.grup_id = g.id AND mg.menu_id = p_menu_id AND mg.aktif
   WHERE o.aktif AND o.id = ANY (v_ids);
  IF v_cocok <> v_n THEN
    RAISE EXCEPTION 'opsi_tidak_valid';
  END IF;

  -- Paling banyak satu opsi per grup
  IF EXISTS (
    SELECT 1 FROM public.opsi_pilihan o
     WHERE o.id = ANY (v_ids)
     GROUP BY o.grup_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'opsi_tidak_valid';
  END IF;

  -- Pilihan final per grup: yang dipilih, bila tidak ada maka opsi bawaan
  SELECT COALESCE(
           jsonb_agg(
             jsonb_build_object(
               'grup_id',   g.id,
               'grup_nama', g.nama,
               'opsi_id',   o.id,
               'opsi_nama', o.nama
             )
             ORDER BY mg.urutan, lower(g.nama), g.id
           ),
           '[]'::jsonb
         )
    INTO v_hasil
    FROM public.menu_grup mg
    JOIN public.grup_pilihan g ON g.id = mg.grup_id AND g.aktif
    JOIN LATERAL (
      SELECT o2.id, o2.nama
        FROM public.opsi_pilihan o2
       WHERE o2.grup_id = g.id
         AND o2.aktif
         AND (o2.id = ANY (v_ids) OR o2.bawaan)
       ORDER BY (o2.id = ANY (v_ids)) DESC, o2.bawaan DESC
       LIMIT 1
    ) o ON true
   WHERE mg.menu_id = p_menu_id AND mg.aktif;

  -- Pengaman: tiap grup terpasang harus menghasilkan satu pilihan (grup tanpa opsi bawaan aktif = data rusak)
  SELECT count(*) INTO v_grup
    FROM public.menu_grup mg
    JOIN public.grup_pilihan g ON g.id = mg.grup_id AND g.aktif
   WHERE mg.menu_id = p_menu_id AND mg.aktif;
  IF jsonb_array_length(v_hasil) <> v_grup THEN
    RAISE EXCEPTION 'pilihan_rusak';
  END IF;

  RETURN v_hasil;
END;
$$;

-- ============================================================
-- 11. menu_daftar: digantikan di tempat, menambah field `grup`
--     (grup aktif yang terpasang aktif di menu, urut sesuai pemasangan, dengan opsi aktifnya).
--     Field lama (id, nama, harga, tersedia, aktif, foto, deskripsi) tidak berubah.
-- ============================================================
CREATE OR REPLACE FUNCTION public.menu_daftar(p_semua boolean)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',        m.id,
          'nama',      m.nama,
          'harga',     m.harga,
          'tersedia',  m.tersedia,
          'aktif',     m.aktif,
          'foto',      m.foto,
          'deskripsi', m.deskripsi,
          'grup',      COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id',   g.id,
                  'nama', g.nama,
                  'opsi', COALESCE(
                    (
                      SELECT jsonb_agg(
                        jsonb_build_object(
                          'id',     o.id,
                          'nama',   o.nama,
                          'bawaan', o.bawaan
                        )
                        ORDER BY o.urutan, lower(o.nama), o.id
                      )
                      FROM public.opsi_pilihan o
                      WHERE o.grup_id = g.id AND o.aktif
                    ),
                    '[]'::jsonb
                  )
                )
                ORDER BY mg.urutan, lower(g.nama), g.id
              )
              FROM public.menu_grup mg
              JOIN public.grup_pilihan g ON g.id = mg.grup_id AND g.aktif
              WHERE mg.menu_id = m.id AND mg.aktif
            ),
            '[]'::jsonb
          )
        )
        ORDER BY lower(m.nama), m.id
      )
      FROM public.menu m
      WHERE m.aktif OR COALESCE(p_semua, false)
    ),
    '[]'::jsonb
  );
END;
$$;

-- ============================================================
-- 12. Hak EXECUTE: cabut semua dulu (termasuk bawaan Supabase),
--     lalu beri hanya ke service_role. anon/authenticated nol.
--     (menu_daftar diulang supaya pasti sama.)
-- ============================================================
REVOKE ALL ON FUNCTION public.grup_simpan(uuid, uuid, text, jsonb, boolean)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.grup_nonaktif(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.grup_daftar(boolean)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.menu_grup_atur(uuid, uuid, uuid[])
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.opsi_periksa(uuid, uuid[])
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.menu_daftar(boolean)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.grup_simpan(uuid, uuid, text, jsonb, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.grup_nonaktif(uuid, uuid)                      TO service_role;
GRANT EXECUTE ON FUNCTION public.grup_daftar(boolean)                           TO service_role;
GRANT EXECUTE ON FUNCTION public.menu_grup_atur(uuid, uuid, uuid[])             TO service_role;
GRANT EXECUTE ON FUNCTION public.opsi_periksa(uuid, uuid[])                     TO service_role;
GRANT EXECUTE ON FUNCTION public.menu_daftar(boolean)                           TO service_role;

COMMIT;
