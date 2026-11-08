-- supabase/migrations/20261108_02_order_fungsi.sql
-- ORD.02 (giliran 1): tiga fungsi SQL order: `order_buat`, `order_daftar`, `order_detail`.
-- Aksi `kedai` (index.ts) dan pemetaan kode galat dikerjakan di giliran 2.
-- Dijalankan MANUAL di SQL Editor (akun ketua). Pembatalan: 20261108_02_order_fungsi_batal.sql
-- Cek hasil: supabase/templates/20261108_02_order_fungsi_cek.sql
-- Tanpa data nyata.
--
-- Yang BARU:
--   - fungsi `public.order_buat(uuid, text, uuid, text, text, jsonb, text)`
--   - fungsi `public.order_daftar(uuid, text, text)`
--   - fungsi `public.order_detail(uuid, uuid)`
-- Yang SENGAJA TIDAK DISENTUH:
--   - semua tabel (tabel order dari ORD.01 dipakai apa adanya), semua pengaturan, semua fungsi lama
--     (termasuk `opsi_periksa` dan `menu_daftar`, hanya DIPANGGIL), `kedai/index.ts`, dan berkas aplikasi.
-- Semua fungsi BARU (CREATE FUNCTION, bukan OR REPLACE), jadi tidak mungkin menimpa fungsi lama.
-- Tidak ada data order yang berubah: tabel order masih kosong dan fungsi baru hanya berjalan bila dipanggil.
--
-- Pola keamanan (AGENTS.md bagian 7, security.md aturan 4): SECURITY DEFINER, search_path kosong,
-- `public.` eksplisit, nama tabel order ditulis public."order", EXECUTE hanya untuk service_role.
-- ID akun (`p_akun`) HARUS diambil `kedai` dari token login, bukan dari aplikasi (aturan 2 dan 5).
-- Peran dibaca fungsi sendiri dari tabel `staf` sebagai pagar kedua di samping `kedai` (aturan 8).
--
-- Keputusan yang berlaku (order.md, database.md):
--   - O2: hari dan jam. "Hari ini" dan "Besok" dihitung dari jam server (WIB). Jam bebas diisi, hanya format
--     yang dicek. Jam yang sudah lewat TIDAK ditolak (aturan "paling sering terlanggar" order.md bagian 6).
--   - O3: harga dihitung server dari menu; nama, harga satuan, dan pilihan DISALIN ke order_item.
--     Aplikasi hanya mengirim id menu, jumlah, dan id opsi (blok order.md 7 Nov 2026).
--   - O4: tipe Diantar memakai satu alamat AKTIF milik sendiri; alias dan isi alamat disalin.
--   - O11: customer hanya melihat order miliknya; owner semua; penjaga hanya Disetujui ke atas.
--   - O12: catatan awal customer menjadi catatan pertama (waktu dari server).
--   - O18: nomor order dibuat otomatis oleh database (urutan berjalan).
--   - O22: daftar owner dan penjaga hanya Hari ini dan Besok; owner boleh membuka hari lain lewat filter.
--     Customer melihat riwayat lengkap.
--   - Handoff #1 (order.md bagian 9): teks pilihan berbentuk "Nama grup: Nama opsi" (disetujui ketua
--     8 Nov 2026), disusun mengikuti urutan grup di menu (urutan hasil `opsi_periksa`).
--   - Batas (item per order, jumlah per item, panjang catatan) dibaca dari `pengaturan`, tidak ditulis mati.
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   - `order_buat`: nilai hari adalah teks persis "Hari ini" atau "Besok". Jam berbentuk HH:MM
--     (detik, bila ada, dibuang). Tipe selain Diantar: id alamat yang terkirim diabaikan.
--   - `order_buat`: menu nonaktif atau Habis memakai satu kode galat `menu_tidak_tersedia`.
--   - `order_buat`: item yang sama dengan pilihan yang sama yang dikirim dua kali menjadi dua baris
--     (tidak digabung). Batas item per order menghitung baris.
--   - `order_buat`: catatan awal dipangkas dari spasi dan baris kosong di tepi; kosong berarti tidak ada
--     catatan. Fungsi TIDAK mengisi `baca_catatan`; tanda "Catatan baru" (ORD.10) menghitung catatan
--     milik orang lain saja.
--   - `order_buat`: tidak ada penahan kirim ganda (dua kali tekan Kirim = dua order). Tombol Kirim
--     dikunci di layar (ORD.03).
--   - `order_daftar`: baris daftar ringkas (tanpa nomor WA dan tanpa isi alamat; ringkasan item berupa
--     satu teks "Nama x jumlah"). Pilihan menu dan data lengkap ada di `order_detail`.
--   - `order_daftar`: filter hari hanya dipakai owner (tanggal "YYYY-MM-DD"); untuk peran lain diabaikan.
--     Filter status berlaku untuk semua peran, di dalam order yang memang boleh dilihatnya.
--   - `order_daftar`: urutan owner dan penjaga: hari antar (Hari ini dulu), lalu kelompok (Disetujui sampai
--     siap dulu, lalu Menunggu, lalu Selesai, lalu Ditolak dan Dibatalkan), lalu waktu diputuskan
--     (atau waktu dibuat) terlama dulu, lalu nomor. Customer: terbaru dulu. Tanpa pembagian halaman.
--   - `order_detail`: metode bayar tampil untuk owner dan penjaga; nama pemutus dan riwayat status hanya
--     untuk owner; customer tidak melihat keduanya. Catatan tampil untuk semua yang boleh melihat order.
--     Id pemesan dan id pelanggan tanpa akun tidak dikirim (SEC-14).
--   - `order_detail`: urutan baris item = nama menu lalu pilihan (tabel tidak punya kolom urutan baris).
--   - Order yang tidak ada dan order yang tidak boleh dilihat memakai kode galat yang sama
--     (`order_tidak_ditemukan`), supaya keberadaan order orang lain tidak bocor (SEC-05, SEC-09).
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai` di giliran 2 (bagian "tidak dipetakan" jadi galat umum):
--   order_buat:    id_kosong, bukan_customer, profil_tidak_ada, pengaturan_rusak, tipe_tidak_valid,
--                  hari_tidak_valid, jam_tidak_valid, item_tidak_valid, item_kosong, item_terlalu_banyak,
--                  jumlah_tidak_valid, jumlah_terlalu_banyak, menu_tidak_ditemukan, menu_tidak_tersedia,
--                  opsi_tidak_valid, pilihan_rusak, alamat_wajib, alamat_tidak_ditemukan,
--                  catatan_terlalu_panjang, total_terlalu_besar
--   order_daftar:  id_kosong, akun_nonaktif, profil_tidak_ada, status_tidak_valid, hari_tidak_valid
--   order_detail:  id_kosong, akun_nonaktif, profil_tidak_ada, order_tidak_ditemukan
--   Yang seharusnya tidak muncul dari aplikasi biasa: id_kosong, pengaturan_rusak, pilihan_rusak,
--   total_terlalu_besar.

BEGIN;

-- ============================================================
-- 1. order_buat (customer): atomik. Cek akun, cek isian, cek menu dan pilihan, hitung harga di server,
--    simpan order + item + catatan awal + riwayat pertama dalam satu transaksi.
--    p_item = [{"menu_id": "<uuid>", "jumlah": <angka>, "opsi_ids": ["<uuid>"]} (satu objek per baris item)]
--    ("opsi_ids" boleh tidak ada atau kosong: opsi bawaan dipakai).
--    Mengembalikan {id, nomor, status, total, hari_target, jam_permintaan}.
-- ============================================================
CREATE FUNCTION public.order_buat(
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

-- ============================================================
-- 2. order_daftar (semua peran): visibilitas O11 dan tampilan O22. Hanya membaca.
--    p_hari: kosong, atau "YYYY-MM-DD" (hanya dipakai owner). p_status: kosong, atau satu status.
--    Mengembalikan daftar baris ringkas (tanpa nomor WA dan tanpa isi alamat).
-- ============================================================
CREATE FUNCTION public.order_daftar(
  p_akun   uuid,
  p_hari   text,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_peran     text;
  v_aktif     boolean;
  v_hari_ini  date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  v_hari_teks text := nullif(btrim(p_hari), '');
  v_hari_f    date;
  v_status    text := nullif(btrim(p_status), '');
  v_hasil     jsonb;
BEGIN
  IF p_akun IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Peran dari tabel staf; tidak ada baris = customer (harus punya profil)
  SELECT s.peran, s.aktif
    INTO v_peran, v_aktif
    FROM public.staf s
   WHERE s.id = p_akun;
  IF FOUND THEN
    IF NOT v_aktif THEN
      RAISE EXCEPTION 'akun_nonaktif';
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.profil p WHERE p.id = p_akun) THEN
      RAISE EXCEPTION 'profil_tidak_ada';
    END IF;
    v_peran := 'customer';
  END IF;

  IF v_status IS NOT NULL AND v_status NOT IN (
    'Menunggu', 'Disetujui', 'Diproses', 'Diantar', 'Siap diambil', 'Siap disajikan',
    'Selesai', 'Ditolak', 'Dibatalkan'
  ) THEN
    RAISE EXCEPTION 'status_tidak_valid';
  END IF;

  -- Filter hari: hanya owner (O22). Peran lain: diabaikan.
  IF v_peran = 'owner' AND v_hari_teks IS NOT NULL THEN
    IF v_hari_teks !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
      RAISE EXCEPTION 'hari_tidak_valid';
    END IF;
    BEGIN
      v_hari_f := v_hari_teks::date;
    EXCEPTION
      WHEN datetime_field_overflow OR invalid_datetime_format THEN
        RAISE EXCEPTION 'hari_tidak_valid';
    END;
  END IF;

  SELECT COALESCE(
           jsonb_agg(
             jsonb_build_object(
               'id',               o.id,
               'nomor',            o.nomor,
               'tipe',             o.tipe,
               'status',           o.status,
               'hari_target',      o.hari_target,
               'jam_permintaan',   to_char(o.jam_permintaan, 'HH24:MI'),
               'total',            o.total,
               'nama_pemesan',     o.nama_pemesan,
               'alias_alamat',     o.alias_alamat,
               'alasan_tolak',     o.alasan_tolak,
               'dibuat_oleh_nama', o.dibuat_oleh_nama,
               'dibuat_pada',      o.dibuat_pada,
               'diputuskan_pada',  o.diputuskan_pada,
               'ringkas',          (
                 SELECT string_agg(
                          i.nama_menu || ' x' || i.jumlah,
                          ', '
                          ORDER BY lower(i.nama_menu), array_to_string(i.pilihan, '|'), i.id
                        )
                   FROM public.order_item i
                  WHERE i.order_id = o.id
               )
             )
             ORDER BY
               -- Owner dan penjaga (O22): hari antar, kelompok, waktu diputuskan (atau dibuat), nomor
               CASE WHEN v_peran <> 'customer' THEN o.hari_target END ASC,
               CASE WHEN v_peran <> 'customer' THEN
                 CASE
                   WHEN o.status IN ('Disetujui', 'Diproses', 'Diantar', 'Siap diambil', 'Siap disajikan') THEN 0
                   WHEN o.status = 'Menunggu' THEN 1
                   WHEN o.status = 'Selesai' THEN 2
                   ELSE 3
                 END
               END ASC,
               CASE WHEN v_peran <> 'customer' THEN COALESCE(o.diputuskan_pada, o.dibuat_pada) END ASC,
               CASE WHEN v_peran <> 'customer' THEN o.nomor END ASC,
               -- Customer (O22): riwayat lengkap, terbaru dulu
               CASE WHEN v_peran = 'customer' THEN o.dibuat_pada END DESC,
               CASE WHEN v_peran = 'customer' THEN o.nomor END DESC
           ),
           '[]'::jsonb
         )
    INTO v_hasil
    FROM public."order" o
   WHERE CASE v_peran
           WHEN 'customer' THEN
             o.pemesan = p_akun
           WHEN 'penjaga' THEN
             o.status NOT IN ('Menunggu', 'Ditolak', 'Dibatalkan')
             AND o.hari_target BETWEEN v_hari_ini AND v_hari_ini + 1
           WHEN 'owner' THEN
             CASE
               WHEN v_hari_f IS NULL THEN o.hari_target BETWEEN v_hari_ini AND v_hari_ini + 1
               ELSE o.hari_target = v_hari_f
             END
           ELSE false
         END
     AND (v_status IS NULL OR o.status = v_status);

  RETURN v_hasil;
END;
$$;

-- ============================================================
-- 3. order_detail (semua peran): satu order lengkap dengan item, pilihan, dan catatan.
--    Order yang tidak ada dan order yang tidak boleh dilihat: galat yang sama (SEC-05, SEC-09).
-- ============================================================
CREATE FUNCTION public.order_detail(
  p_akun     uuid,
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_peran    text;
  v_aktif    boolean;
  v_o        public."order"%ROWTYPE;
  v_item     jsonb;
  v_catatan  jsonb;
  v_riwayat  jsonb := '[]'::jsonb;
BEGIN
  IF p_akun IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  SELECT s.peran, s.aktif
    INTO v_peran, v_aktif
    FROM public.staf s
   WHERE s.id = p_akun;
  IF FOUND THEN
    IF NOT v_aktif THEN
      RAISE EXCEPTION 'akun_nonaktif';
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.profil p WHERE p.id = p_akun) THEN
      RAISE EXCEPTION 'profil_tidak_ada';
    END IF;
    v_peran := 'customer';
  END IF;

  -- Visibilitas (O11): customer hanya miliknya, penjaga Disetujui ke atas, owner semua
  SELECT o.*
    INTO v_o
    FROM public."order" o
   WHERE o.id = p_order_id
     AND CASE v_peran
           WHEN 'customer' THEN o.pemesan = p_akun
           WHEN 'penjaga'  THEN o.status NOT IN ('Menunggu', 'Ditolak', 'Dibatalkan')
           WHEN 'owner'    THEN true
           ELSE false
         END;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  SELECT COALESCE(
           jsonb_agg(
             jsonb_build_object(
               'nama_menu',    i.nama_menu,
               'harga_satuan', i.harga_satuan,
               'jumlah',       i.jumlah,
               'subtotal',     i.subtotal,
               'pilihan',      to_jsonb(i.pilihan)
             )
             ORDER BY lower(i.nama_menu), array_to_string(i.pilihan, '|'), i.id
           ),
           '[]'::jsonb
         )
    INTO v_item
    FROM public.order_item i
   WHERE i.order_id = v_o.id;

  SELECT COALESCE(
           jsonb_agg(
             jsonb_build_object(
               'id',            c.id,
               'nama_penulis',  c.nama_penulis,
               'peran_penulis', c.peran_penulis,
               'isi',           c.isi,
               'waktu',         c.waktu
             )
             ORDER BY c.id
           ),
           '[]'::jsonb
         )
    INTO v_catatan
    FROM public.catatan_order c
   WHERE c.order_id = v_o.id;

  -- Riwayat status lengkap (siapa dan kapan, O10): hanya owner
  IF v_peran = 'owner' THEN
    SELECT COALESCE(
             jsonb_agg(
               jsonb_build_object(
                 'status_asal',   r.status_asal,
                 'status_tujuan', r.status_tujuan,
                 'oleh_nama',     COALESCE(sf.nama_tampilan, pr.nama_tampilan),
                 'waktu',         r.waktu,
                 'keterangan',    r.keterangan
               )
               ORDER BY r.id
             ),
             '[]'::jsonb
           )
      INTO v_riwayat
      FROM public.riwayat_status r
      LEFT JOIN public.staf   sf ON sf.id = r.oleh
      LEFT JOIN public.profil pr ON pr.id = r.oleh
     WHERE r.order_id = v_o.id;
  END IF;

  RETURN jsonb_build_object(
    'id',               v_o.id,
    'nomor',            v_o.nomor,
    'tipe',             v_o.tipe,
    'status',           v_o.status,
    'hari_target',      v_o.hari_target,
    'jam_permintaan',   to_char(v_o.jam_permintaan, 'HH24:MI'),
    'nama_pemesan',     v_o.nama_pemesan,
    'nomor_wa_pemesan', v_o.nomor_wa_pemesan,
    'alias_alamat',     v_o.alias_alamat,
    'isi_alamat',       v_o.isi_alamat,
    'total',            v_o.total,
    'alasan_tolak',     v_o.alasan_tolak,
    'dibuat_oleh_nama', v_o.dibuat_oleh_nama,
    'dibuat_pada',      v_o.dibuat_pada,
    'diputuskan_pada',  v_o.diputuskan_pada,
    'diubah_pada',      v_o.diubah_pada,
    'metode_bayar',     CASE WHEN v_peran IN ('owner', 'penjaga') THEN v_o.metode_bayar END,
    'pemutus_nama',     CASE WHEN v_peran = 'owner' THEN v_o.pemutus_nama END,
    'item',             v_item,
    'catatan',          v_catatan,
    'riwayat',          v_riwayat
  );
END;
$$;

-- ============================================================
-- 4. Hak EXECUTE: cabut semua dulu (termasuk bawaan Supabase), lalu beri hanya ke service_role.
--    anon dan authenticated nol (AGENTS.md bagian 7).
-- ============================================================
REVOKE ALL ON FUNCTION public.order_buat(uuid, text, uuid, text, text, jsonb, text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.order_daftar(uuid, text, text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.order_detail(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.order_buat(uuid, text, uuid, text, text, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.order_daftar(uuid, text, text)                        TO service_role;
GRANT EXECUTE ON FUNCTION public.order_detail(uuid, uuid)                              TO service_role;

COMMIT;
