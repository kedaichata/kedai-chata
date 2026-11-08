-- supabase/migrations/20261108_05_order_setuju_tolak.sql
-- ORD.05 (giliran 1): fungsi SQL `order_setuju` dan `order_tolak` (aksi owner).
-- Aksi `order_setuju` dan `order_tolak` di `kedai` (index.ts) dikerjakan di giliran 2.
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo.
-- "OK" ketua untuk rencana dua giliran ini sudah diberikan lewat PIC (8 Nov 2026).
-- Pembatalan: 20261108_05_order_setuju_tolak_batal.sql
-- Cek hasil: supabase/templates/20261108_05_order_setuju_tolak_cek.sql
-- Tanpa data nyata.
--
-- Yang BARU: fungsi `public.order_setuju(uuid, uuid, text)` dan `public.order_tolak(uuid, uuid, text)`.
-- Yang SENGAJA TIDAK DISENTUH: semua tabel dan pagarnya, data order, fungsi lain
--   (order_buat, order_daftar, order_detail, order_batal), pengaturan, `kedai/index.ts`, berkas aplikasi.
--   Pagar tabel `order` versi 20261108_03 sudah cocok untuk dua fungsi ini (dicek dari berkasnya).
--
-- Keputusan yang berlaku (order.md O6, O7, O8, O11; security.md SEC-07, SEC-08, SEC-10, SEC-11):
--   - Hanya OWNER aktif. Customer (tanpa baris staf) dan penjaga ditolak.
--   - Hanya dari status Menunggu. Baris order dikunci `FOR UPDATE` (sama seperti order_batal):
--     dua owner bersamaan, atau Batal dan Setujui bersamaan, hanya satu yang menang.
--   - Setujui: metode bayar WAJIB dan harus Transfer, Tunai, atau QRIS. Status jadi Disetujui,
--     server mengisi pemutus, nama pemutus, dan waktu diputuskan (jam server).
--   - Tolak: alasan opsional, maksimal 200 karakter, disimpan di `alasan_tolak`, tampil ke customer.
--     Status jadi Ditolak. Metode bayar tetap kosong.
--   - Tiap keputusan dicatat di `riwayat_status`.
--   - Push tidak ada di sini (NTF).
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   - Order yang bukan Menunggu dibedakan galatnya: Disetujui ke atas = `sudah_diproses`
--     (sesuai SEC-10), Ditolak = `sudah_ditolak`, Dibatalkan = `sudah_dibatalkan`. Alasannya sama
--     dengan perbaikan pesan order_batal: "sudah diproses" menyesatkan untuk order yang dibatalkan customer.
--   - `riwayat_status.keterangan` pada Setujui berisi "Metode bayar: <metode>" (bahan audit dan
--     pembanding untuk koreksi metode O23 kelak). Pada Tolak berisi alasan (bila ada).
--   - Nama pemutus disalin dari `staf.nama_tampilan` saat itu (salinan, seperti nama menu di order).
--   - Fungsi tidak mengembalikan id pemesan (bahan push ditambahkan nanti di NTF bila perlu).
--   - Metode bayar diperiksa setelah dipangkas spasi; huruf besar-kecil harus persis.
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai` di giliran 2:
--   id_kosong (tidak dipetakan, jadi galat umum), akun_nonaktif, peran_tidak_boleh (customer dan penjaga),
--   metode_tidak_valid (setujui), alasan_terlalu_panjang (tolak), order_tidak_ditemukan,
--   sudah_diproses, sudah_ditolak, sudah_dibatalkan.

BEGIN;

-- ============================================================
-- 1. order_setuju: atomik. p_akun HARUS dari token login (diambil `kedai`), bukan dari aplikasi.
--    Mengembalikan {id, nomor, status, status_asal, metode_bayar}.
-- ============================================================
CREATE FUNCTION public.order_setuju(
  p_akun     uuid,
  p_order_id uuid,
  p_metode   text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_peran  text;
  v_aktif  boolean;
  v_nama   text;
  v_metode text;
  v_o      public."order"%ROWTYPE;
BEGIN
  IF p_akun IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Peran dari tabel staf; tidak ada baris = customer, bukan owner
  SELECT s.peran, s.aktif, s.nama_tampilan
    INTO v_peran, v_aktif, v_nama
    FROM public.staf s
   WHERE s.id = p_akun;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;
  IF NOT v_aktif THEN
    RAISE EXCEPTION 'akun_nonaktif';
  END IF;
  IF v_peran <> 'owner' THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;

  -- Metode bayar wajib dan hanya tiga nilai (O6, SEC-11)
  v_metode := btrim(COALESCE(p_metode, ''), E' \t\r\n');
  IF v_metode NOT IN ('Transfer', 'Tunai', 'QRIS') THEN
    RAISE EXCEPTION 'metode_tidak_valid';
  END IF;

  -- Kunci baris order: dua keputusan bersamaan hanya satu yang menang (O7, SEC-10)
  SELECT o.*
    INTO v_o
    FROM public."order" o
   WHERE o.id = p_order_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  IF v_o.status = 'Ditolak' THEN
    RAISE EXCEPTION 'sudah_ditolak';
  ELSIF v_o.status = 'Dibatalkan' THEN
    RAISE EXCEPTION 'sudah_dibatalkan';
  ELSIF v_o.status <> 'Menunggu' THEN
    RAISE EXCEPTION 'sudah_diproses';
  END IF;

  UPDATE public."order"
     SET status          = 'Disetujui',
         metode_bayar    = v_metode,
         pemutus         = p_akun,
         pemutus_nama    = v_nama,
         diputuskan_pada = now(),
         diubah_pada     = now()
   WHERE id = v_o.id;

  INSERT INTO public.riwayat_status (order_id, status_asal, status_tujuan, oleh, keterangan)
  VALUES (v_o.id, 'Menunggu', 'Disetujui', p_akun, 'Metode bayar: ' || v_metode);

  RETURN jsonb_build_object(
    'id',           v_o.id,
    'nomor',        v_o.nomor,
    'status',       'Disetujui',
    'status_asal',  'Menunggu',
    'metode_bayar', v_metode
  );
END;
$$;

-- ============================================================
-- 2. order_tolak: atomik. Alasan opsional, maksimal 200 karakter (O8).
--    Mengembalikan {id, nomor, status, status_asal}.
-- ============================================================
CREATE FUNCTION public.order_tolak(
  p_akun     uuid,
  p_order_id uuid,
  p_alasan   text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_peran  text;
  v_aktif  boolean;
  v_nama   text;
  v_alasan text;
  v_o      public."order"%ROWTYPE;
BEGIN
  IF p_akun IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  SELECT s.peran, s.aktif, s.nama_tampilan
    INTO v_peran, v_aktif, v_nama
    FROM public.staf s
   WHERE s.id = p_akun;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;
  IF NOT v_aktif THEN
    RAISE EXCEPTION 'akun_nonaktif';
  END IF;
  IF v_peran <> 'owner' THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;

  -- Alasan opsional, maksimal 200 karakter; kosong disimpan sebagai NULL
  v_alasan := nullif(btrim(COALESCE(p_alasan, ''), E' \t\r\n'), '');
  IF char_length(v_alasan) > 200 THEN
    RAISE EXCEPTION 'alasan_terlalu_panjang';
  END IF;

  -- Kunci baris order (O7, SEC-10)
  SELECT o.*
    INTO v_o
    FROM public."order" o
   WHERE o.id = p_order_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  IF v_o.status = 'Ditolak' THEN
    RAISE EXCEPTION 'sudah_ditolak';
  ELSIF v_o.status = 'Dibatalkan' THEN
    RAISE EXCEPTION 'sudah_dibatalkan';
  ELSIF v_o.status <> 'Menunggu' THEN
    RAISE EXCEPTION 'sudah_diproses';
  END IF;

  UPDATE public."order"
     SET status          = 'Ditolak',
         alasan_tolak    = v_alasan,
         pemutus         = p_akun,
         pemutus_nama    = v_nama,
         diputuskan_pada = now(),
         diubah_pada     = now()
   WHERE id = v_o.id;

  INSERT INTO public.riwayat_status (order_id, status_asal, status_tujuan, oleh, keterangan)
  VALUES (v_o.id, 'Menunggu', 'Ditolak', p_akun, v_alasan);

  RETURN jsonb_build_object(
    'id',          v_o.id,
    'nomor',       v_o.nomor,
    'status',      'Ditolak',
    'status_asal', 'Menunggu'
  );
END;
$$;

-- ============================================================
-- 3. Hak EXECUTE: cabut semua dulu, lalu beri hanya ke service_role (AGENTS.md bagian 7).
-- ============================================================
REVOKE ALL ON FUNCTION public.order_setuju(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.order_tolak(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.order_setuju(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.order_tolak(uuid, uuid, text)  TO service_role;

COMMIT;
