-- supabase/migrations/20261110_06_order_wakil_fungsi.sql
-- ORD.12 (giliran 1): satu fungsi SQL `order_buat_wakil` (order wakil owner untuk pelanggan tanpa akun, order.md O15).
-- Aksi `kedai` (berkas baru `order_wakil.ts`) dikerjakan di giliran 2, SETELAH berkas ini dijalankan dan lulus cek.
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo.
-- Pembatalan: 20261110_06_order_wakil_fungsi_batal.sql
-- Cek hasil: supabase/templates/20261110_06_order_wakil_fungsi_cek.sql
-- Tanpa data nyata. Tidak ada data yang ditulis oleh berkas ini (fungsi baru hanya berjalan bila dipanggil).
--
-- Yang BARU: fungsi `public.order_buat_wakil(uuid, uuid, text, text, text, text, jsonb, text)`.
-- Yang SENGAJA TIDAK DISENTUH: semua tabel dan pagarnya, hak tabel, pengaturan, dan semua fungsi lain
--   (order_buat, order_setuju, order_tolak, order_batal, pelanggan_luar_*, opsi_periksa hanya DIPANGGIL),
--   `kedai/index.ts`, dan berkas aplikasi. Fungsi dibuat dengan CREATE FUNCTION (bukan OR REPLACE),
--   jadi tidak mungkin menimpa fungsi lama.
--
-- Pola keamanan (AGENTS.md bagian 7, security.md aturan 4): SECURITY DEFINER, search_path kosong, `public.`
-- eksplisit, tabel order ditulis public."order", EXECUTE hanya untuk service_role. `p_akun` HARUS diambil `kedai`
-- dari token login, bukan dari aplikasi (aturan 2 dan 5). Peran dicek ulang di fungsi (aturan 8).
--
-- Keputusan yang berlaku:
--   - O15: hanya owner aktif. Order langsung Disetujui, metode bayar WAJIB (Transfer, Tunai, QRIS), ditandai
--     "Dibuat oleh [nama owner]". Pemutus = owner pembuat (database.md, catatan ORD.01). Tanpa push (NTF).
--   - O16 dan Handoff #23: pelanggan harus ADA dan AKTIF (yang nonaktif ditolak). Nama, nomor WA, dan alamat
--     DISALIN ke order, bukan merujuk ke data pelanggan terbaru.
--   - O3: harga dihitung server dari menu; nama, harga satuan, dan pilihan disalin ke order_item. Aturan menu,
--     pilihan, dan batas item sama persis dengan `order_buat`.
--   - O2: hari "Hari ini" atau "Besok" dihitung server (WIB); jam bebas, hanya format dicek (aturan 6).
--   - Alamat (keputusan ketua 10 Nov 2026, menyesuaikan wizard langkah 3 di order.md): untuk tipe Diantar,
--     bila aplikasi mengirim alamat, itu yang dipakai (10 sampai 200 karakter), HANYA untuk order ini;
--     bila tidak dikirim, dipakai alamat tersimpan pelanggan; bila tidak ada keduanya: `alamat_wajib`.
--     Alamat tersimpan pelanggan TIDAK berubah (mengubahnya lewat `pelanggan_luar_simpan`).
--     Tipe Diambil dan Makan di warung: alamat yang terkirim diabaikan. Alias alamat selalu kosong
--     (pelanggan tanpa akun tidak punya alias; tabel mengizinkannya).
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   - Tanpa catatan awal: wizard 5 langkah tidak punya isian catatan. Owner menambah lewat `catatan_tambah`.
--   - Riwayat: SATU baris (status asal kosong, tujuan Disetujui), keterangan "Order wakil. Metode bayar: <metode>".
--   - Yang disalin dari pelanggan hanya nama (bukan keterangan): tabel `order` belum punya kolom keterangan.
--   - Baris pelanggan dikunci FOR SHARE selama transaksi, jadi `pelanggan_luar_nonaktif` yang bersamaan
--     menunggu sampai order ini selesai (tidak ada order untuk pelanggan yang baru saja dinonaktifkan).
--   - Tanpa penahan kirim ganda (sama seperti `order_buat`); tombol dikunci di layar (ORD.13).
--   - Nilai kembalian: id, nomor, status, total, hari_target, jam_permintaan, metode_bayar.
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai` di giliran 2:
--   id_kosong, akun_nonaktif, peran_tidak_boleh, pengaturan_rusak, tipe_tidak_valid, hari_tidak_valid,
--   jam_tidak_valid, metode_tidak_valid, pelanggan_tidak_ditemukan, pelanggan_tidak_aktif, alamat_wajib,
--   alamat_tidak_valid, item_tidak_valid, item_kosong, item_terlalu_banyak, jumlah_tidak_valid,
--   jumlah_terlalu_banyak, menu_tidak_ditemukan, menu_tidak_tersedia, opsi_tidak_valid, pilihan_rusak,
--   total_terlalu_besar
--   Yang seharusnya tidak muncul dari aplikasi biasa: id_kosong, pengaturan_rusak, pilihan_rusak, total_terlalu_besar.

BEGIN;

-- ============================================================
-- order_buat_wakil (owner): atomik. Cek akun, cek isian, cek pelanggan, cek menu dan pilihan, hitung harga
-- di server, simpan order (langsung Disetujui) + item + riwayat dalam satu transaksi.
--   p_pelanggan_id = id pelanggan tanpa akun (aktif).
--   p_alamat       = alamat untuk order ini (opsional; hanya dipakai bila tipe Diantar).
--   p_item         = [{"menu_id": "<uuid>", "jumlah": <angka>, "opsi_ids": ["<uuid>"]} (satu objek per baris)]
--                    ("opsi_ids" boleh tidak ada atau kosong: opsi bawaan dipakai).
--   p_metode       = Transfer, Tunai, atau QRIS.
-- Mengembalikan {id, nomor, status, total, hari_target, jam_permintaan, metode_bayar}.
-- ============================================================
CREATE FUNCTION public.order_buat_wakil(
  p_akun         uuid,
  p_pelanggan_id uuid,
  p_tipe         text,
  p_alamat       text,
  p_hari         text,
  p_jam          text,
  p_item         jsonb,
  p_metode       text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  c_uuid         CONSTANT text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
  v_staf_aktif   boolean;
  v_peran        text;
  v_nama_owner   text;
  v_pl           public.pelanggan_luar%ROWTYPE;
  v_tipe         text := btrim(p_tipe);
  v_hari_teks    text := btrim(p_hari);
  v_jam_teks     text := btrim(p_jam);
  v_metode       text;
  v_hari_ini     date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  v_hari         date;
  v_jam          time;
  v_isi_alamat   text;
  v_alamat_kirim text;
  v_item_maks    integer;
  v_jumlah_maks  integer;
  v_n_item       integer;
  v_elem         jsonb;
  v_opsi_json    jsonb;
  v_opsi         uuid[];
  v_menu_id      uuid;
  v_jumlah       integer;
  v_nama_menu    text;
  v_harga        integer;
  v_menu_aktif   boolean;
  v_tersedia     boolean;
  v_periksa      jsonb;
  v_pilihan      jsonb;
  v_baris        jsonb := '[]'::jsonb;
  v_total        bigint := 0;
  v_order_id     uuid;
  v_nomor        integer;
BEGIN
  IF p_akun IS NULL OR p_pelanggan_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Hanya owner aktif. Tidak ada baris staf = customer (aturan 8).
  SELECT s.aktif, s.peran, s.nama_tampilan
    INTO v_staf_aktif, v_peran, v_nama_owner
    FROM public.staf s
   WHERE s.id = p_akun;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;
  IF NOT v_staf_aktif THEN
    RAISE EXCEPTION 'akun_nonaktif';
  END IF;
  IF v_peran <> 'owner' THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;

  -- Batas dibaca dari pengaturan, tidak ditulis mati (AGENTS.md bagian 1)
  SELECT
    max(g.nilai::integer) FILTER (WHERE g.kunci = 'item_maks_per_order'),
    max(g.nilai::integer) FILTER (WHERE g.kunci = 'jumlah_maks_per_item')
    INTO v_item_maks, v_jumlah_maks
    FROM public.pengaturan g
   WHERE g.kunci IN ('item_maks_per_order', 'jumlah_maks_per_item');
  IF COALESCE(v_item_maks, 0) < 1 OR COALESCE(v_jumlah_maks, 0) < 1 THEN
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

  -- Metode bayar wajib dan hanya tiga nilai (O6, SEC-11). Huruf besar-kecil harus persis.
  v_metode := btrim(COALESCE(p_metode, ''), E' \t\r\n');
  IF v_metode NOT IN ('Transfer', 'Tunai', 'QRIS') THEN
    RAISE EXCEPTION 'metode_tidak_valid';
  END IF;

  -- Pelanggan: harus ada dan aktif (O16). Dikunci FOR SHARE sampai transaksi selesai.
  SELECT pl.*
    INTO v_pl
    FROM public.pelanggan_luar pl
   WHERE pl.id = p_pelanggan_id
     FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pelanggan_tidak_ditemukan';
  END IF;
  IF NOT v_pl.aktif THEN
    RAISE EXCEPTION 'pelanggan_tidak_aktif';
  END IF;

  -- Alamat: hanya tipe Diantar. Kiriman aplikasi (bila ada) dipakai untuk order ini saja;
  -- bila tidak ada, alamat tersimpan pelanggan; bila tidak ada keduanya, wajib (O4, O15).
  IF v_tipe = 'Diantar' THEN
    v_alamat_kirim := nullif(regexp_replace(COALESCE(p_alamat, ''), '^[[:space:]]+|[[:space:]]+$', '', 'g'), '');
    IF v_alamat_kirim IS NOT NULL THEN
      IF char_length(v_alamat_kirim) NOT BETWEEN 10 AND 200 THEN
        RAISE EXCEPTION 'alamat_tidak_valid';
      END IF;
      v_isi_alamat := v_alamat_kirim;
    ELSE
      v_isi_alamat := v_pl.alamat_antar;
    END IF;
    IF v_isi_alamat IS NULL THEN
      RAISE EXCEPTION 'alamat_wajib';
    END IF;
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

  -- Tiap baris: cek menu, harga dari server, pilihan lewat opsi_periksa (sama dengan order_buat)
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
      INTO v_nama_menu, v_harga, v_menu_aktif, v_tersedia
      FROM public.menu m
     WHERE m.id = v_menu_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'menu_tidak_ditemukan';
    END IF;
    IF NOT v_menu_aktif OR NOT v_tersedia THEN
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

  -- Simpan langsung Disetujui (pagar tabel order: metode bayar, pemutus, dan pembuat terisi konsisten).
  -- Pemesan akun kosong, pelanggan tanpa akun terisi. Nama dan WA adalah SALINAN dari pelanggan.
  INSERT INTO public."order" (
    pelanggan_luar_id, nama_pemesan, nomor_wa_pemesan, tipe, hari_target, jam_permintaan,
    alias_alamat, isi_alamat, total,
    status, metode_bayar, pemutus, pemutus_nama, diputuskan_pada,
    dibuat_oleh, dibuat_oleh_nama
  )
  VALUES (
    v_pl.id, v_pl.nama, v_pl.nomor_wa, v_tipe, v_hari, v_jam,
    NULL, v_isi_alamat, v_total::integer,
    'Disetujui', v_metode, p_akun, v_nama_owner, now(),
    p_akun, v_nama_owner
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

  -- Riwayat: satu baris, status asal kosong, tujuan Disetujui (O10, O15)
  INSERT INTO public.riwayat_status (order_id, status_asal, status_tujuan, oleh, keterangan)
  VALUES (v_order_id, NULL, 'Disetujui', p_akun, 'Order wakil. Metode bayar: ' || v_metode);

  RETURN jsonb_build_object(
    'id',             v_order_id,
    'nomor',          v_nomor,
    'status',         'Disetujui',
    'total',          v_total,
    'hari_target',    v_hari,
    'jam_permintaan', to_char(v_jam, 'HH24:MI'),
    'metode_bayar',   v_metode
  );
END;
$$;

-- ============================================================
-- Hak EXECUTE: cabut semua dulu (termasuk bawaan Supabase), lalu beri hanya ke service_role.
-- anon dan authenticated nol (AGENTS.md bagian 7).
-- ============================================================
REVOKE ALL ON FUNCTION public.order_buat_wakil(uuid, uuid, text, text, text, text, jsonb, text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.order_buat_wakil(uuid, uuid, text, text, text, text, jsonb, text)
  TO service_role;

COMMIT;
