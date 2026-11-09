-- supabase/migrations/20261109_01_order_status_alih_hari.sql
-- ORD.07 (giliran 1): tiga fungsi SQL order: `order_status`, `order_metode_koreksi`, `order_alih_hari`.
-- Aksi `kedai` (index.ts) dan pemetaan kode galat dikerjakan di giliran 2.
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo dan SETELAH "OK" ketua.
-- Pembatalan: supabase/migrations/20261109_01_order_status_alih_hari_batal.sql
-- Cek hasil: supabase/templates/20261109_01_order_status_alih_hari_cek.sql
-- Tanpa data nyata.
--
-- Yang BARU:
--   - fungsi `public.order_status(uuid, uuid, text, text)`
--   - fungsi `public.order_metode_koreksi(uuid, uuid, text)`
--   - fungsi `public.order_alih_hari(uuid, uuid, text, text)`
-- Yang SENGAJA TIDAK DISENTUH: semua tabel dan pagarnya (dicek dari 20261108_order.sql dan
--   20261108_03_order_batal_fungsi.sql), data order, semua fungsi lama (order_buat, order_daftar, order_detail,
--   order_batal, order_setuju, order_tolak), pengaturan, `kedai/index.ts`, dan berkas aplikasi.
-- Semua fungsi BARU (CREATE FUNCTION, bukan OR REPLACE), jadi tidak mungkin menimpa fungsi lama.
-- Tidak ada data order yang berubah: fungsi baru hanya berjalan bila dipanggil.
--
-- Pola keamanan (AGENTS.md bagian 7, security.md aturan 4): SECURITY DEFINER, search_path kosong,
-- `public.` eksplisit, nama tabel order ditulis public."order", EXECUTE hanya untuk service_role.
-- `p_akun` HARUS diambil `kedai` dari token login, bukan dari aplikasi (aturan 2 dan 5).
-- Peran dibaca fungsi sendiri dari tabel `staf` sebagai pagar kedua di samping `kedai` (aturan 8).
-- Ketiganya mengunci baris order dengan SELECT ... FOR UPDATE (O7, SEC-10), sama seperti
-- order_batal, order_setuju, dan order_tolak: dua permintaan bersamaan, hanya satu yang menang.
--
-- Keputusan yang berlaku (order.md O5, O10, O11, O23; blok 8 Nov 2026 "Owner boleh membatalkan setelah
-- Disetujui, dan aksi Alih hari"; Handoff #9; security.md blok 8 Nov 2026):
--   - order_status: penjaga dan owner aktif. Jalur per tipe: Disetujui, Diproses, (Diantar | Siap diambil |
--     Siap disajikan), Selesai. Tanpa loncat. Mundur hanya satu langkah (Diproses ke Disetujui, atau
--     Diantar/Siap ke Diproses) dan tidak dari Selesai. Tiap perubahan tercatat di riwayat_status.
--     Mundur tidak mengirim push (push belum ada di sini; NTF).
--     Dari Diantar/Siap, Disetujui TIDAK bisa dicapai lewat order_status (dua langkah); hanya lewat alih hari.
--   - order_metode_koreksi: hanya owner aktif (O23). Penjaga ditolak.
--   - order_alih_hari: hanya owner aktif. Dari Disetujui, Diproses, Diantar/Siap. Hari tujuan hanya Besok
--     (dihitung dari tanggal server WIB). Status kembali ke Disetujui. Nomor order dan pembayaran tetap.
--     Jam boleh diisi owner; kosong = memakai jam yang sudah ada. Tidak dari Selesai, Menunggu, Ditolak,
--     atau Dibatalkan.
--   - Keputusan ketua 9 Nov 2026: "hanya Besok" dihitung dari tanggal server saat aksi; order yang hari
--     targetnya sudah Besok (atau lebih) tidak bisa dialihkan lagi.
--   - Keputusan ketua 9 Nov 2026: pilihan C. Alasan alih hari HANYA masuk riwayat_status.keterangan dulu
--     (tidak masuk `alasan_tolak`, karena pagar order_alasan_cek hanya mengizinkan Ditolak dan Dibatalkan).
--     Tampil ke customer jadi butir baru di sheet ("Tampilkan alasan alih hari ke customer"), bersama ORD.15.
--
-- Pilihan penulis (ketua menyetujui lima butir pertama pada 9 Nov 2026; sisanya alasan belum tercatat):
--   1. Alasan alih hari maksimal 100 karakter (bentuk data, bukan pengaturan). Sebabnya:
--      riwayat_status.keterangan dibatasi 1 sampai 200 karakter, dan keterangan memuat hari lama, hari baru,
--      jam, dan alasan. Terpanjang: 64 karakter awalan + 100 alasan = 164, muat.
--      Format: "Alih hari 2026-11-09 ke 2026-11-10, jam 11:00 ke 12:30. Alasan: ..."
--      Bagian jam hanya ada bila jam berubah; bagian alasan hanya ada bila alasan diisi.
--   2. Koreksi metode: keterangan "Metode bayar: QRIS (sebelumnya Tunai)". Awalannya sama dengan format
--      Setujui (Handoff #9). Koreksi ke metode yang sama ditolak. Baris riwayatnya memakai status asal dan
--      tujuan yang sama, karena status tidak berubah.
--   3. Alih hari ditolak bila hari target sudah Besok atau lebih. Hari ini atau sudah lewat boleh dialihkan.
--   4. Penjaga tidak mundur ke Disetujui dari Diantar/Siap lewat order_status (lihat di atas).
--      CATATAN: mundur Diproses ke Disetujui oleh penjaga dan owner TETAP boleh (O10). Butir 4 yang disetujui
--      ketua pada 9 Nov 2026 sempat tertulis terlalu luas; yang berlaku di fungsi ini mengikuti O10.
--   5. order_status menerima status yang sedang dilihat di layar (`p_status_dilihat`) hanya sebagai
--      PEMBANDING. Bila berbeda dengan status di server: ditolak (`status_berubah`). Status tujuan selalu
--      ditentukan server dari jalur tipe order. Tujuannya mencegah dobel pencet meloncatkan dua langkah.
--   6. Mundur memakai keterangan riwayat "Mundur satu langkah"; maju tanpa keterangan.
--   7. Penjaga yang memanggil order_status untuk order Menunggu, Ditolak, atau Dibatalkan dibalas
--      `order_tidak_ditemukan` (O11: penjaga tidak melihat order itu). Dicek SEBELUM pembanding status.
--   8. Koreksi metode hanya untuk Disetujui, Diproses, Diantar/Siap. Order Dibatalkan, Selesai, Menunggu,
--      dan Ditolak ditolak. (O23 menyebut "selama belum Selesai"; order Dibatalkan sengaja dikecualikan:
--      metode dan pemutusnya dibiarkan apa adanya sebagai bahan pengembalian uang lewat WA.)
--   9. Alih hari boleh untuk order wakil owner (pemesan tanpa akun); yang dilarang hanya membuat order baru.
--  10. Fungsi tidak mengembalikan id pemesan (bahan push ditambahkan nanti di NTF bila perlu).
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai` di giliran 2 (usulan status HTTP di dalam kurung):
--   Umum:          id_kosong (tidak dipetakan, galat umum), akun_nonaktif (403), peran_tidak_boleh (403),
--                  order_tidak_ditemukan (404)
--   order_status:  arah_tidak_valid (400), status_dilihat_tidak_valid (400), status_berubah (409),
--                  belum_disetujui (409), sudah_ditolak (409), sudah_dibatalkan (409), sudah_selesai (409),
--                  tidak_bisa_mundur (409), status_tidak_cocok (409; seharusnya tidak muncul)
--   order_metode_koreksi: metode_tidak_valid (400), metode_sama (400), belum_disetujui, sudah_ditolak,
--                  sudah_dibatalkan, sudah_selesai (semuanya 409)
--   order_alih_hari: jam_tidak_valid (400), alasan_alih_terlalu_panjang (400), sudah_besok (409),
--                  belum_disetujui, sudah_ditolak, sudah_dibatalkan, sudah_selesai (semuanya 409)

BEGIN;

-- ============================================================
-- 1. order_status: maju atau mundur satu langkah sesuai jalur tipe order. Atomik.
--    p_arah: persis 'maju' atau 'mundur'. p_status_dilihat: status yang sedang tampil di layar (pembanding).
--    Mengembalikan {id, nomor, status, status_asal, arah, oleh_peran}.
-- ============================================================
CREATE FUNCTION public.order_status(
  p_akun           uuid,
  p_order_id       uuid,
  p_arah           text,
  p_status_dilihat text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_peran   text;
  v_aktif   boolean;
  v_arah    text := btrim(COALESCE(p_arah, ''), E' \t\r\n');
  v_dilihat text := btrim(COALESCE(p_status_dilihat, ''), E' \t\r\n');
  v_o       public."order"%ROWTYPE;
  v_jalur   text[];
  v_idx     integer;
  v_tujuan  text;
BEGIN
  IF p_akun IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Peran dari tabel staf; tidak ada baris = customer, bukan penjaga atau owner
  SELECT s.peran, s.aktif
    INTO v_peran, v_aktif
    FROM public.staf s
   WHERE s.id = p_akun;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;
  IF NOT v_aktif THEN
    RAISE EXCEPTION 'akun_nonaktif';
  END IF;
  IF v_peran NOT IN ('owner', 'penjaga') THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;

  IF v_arah NOT IN ('maju', 'mundur') THEN
    RAISE EXCEPTION 'arah_tidak_valid';
  END IF;
  IF v_dilihat NOT IN ('Menunggu', 'Disetujui', 'Diproses', 'Diantar', 'Siap diambil',
                       'Siap disajikan', 'Selesai', 'Ditolak', 'Dibatalkan') THEN
    RAISE EXCEPTION 'status_dilihat_tidak_valid';
  END IF;

  -- Kunci baris order: dua pencet bersamaan hanya satu yang menang (O7, SEC-10)
  SELECT o.*
    INTO v_o
    FROM public."order" o
   WHERE o.id = p_order_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  -- O11: penjaga tidak melihat order Menunggu, Ditolak, Dibatalkan (SEC-08)
  IF v_peran = 'penjaga' AND v_o.status IN ('Menunggu', 'Ditolak', 'Dibatalkan') THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  -- Pembanding: status di layar harus sama dengan status di server (cegah loncat karena dobel pencet)
  IF v_o.status <> v_dilihat THEN
    RAISE EXCEPTION 'status_berubah';
  END IF;

  -- Status di luar jalur pengerjaan
  IF v_o.status = 'Menunggu' THEN
    RAISE EXCEPTION 'belum_disetujui';
  ELSIF v_o.status = 'Ditolak' THEN
    RAISE EXCEPTION 'sudah_ditolak';
  ELSIF v_o.status = 'Dibatalkan' THEN
    RAISE EXCEPTION 'sudah_dibatalkan';
  ELSIF v_o.status = 'Selesai' THEN
    -- Tidak maju dan tidak mundur dari Selesai (O10)
    RAISE EXCEPTION 'sudah_selesai';
  END IF;

  -- Jalur sesuai tipe (O5). Tipe dijaga pagar tabel (order_tipe_cek): hanya tiga nilai.
  v_jalur := ARRAY[
    'Disetujui',
    'Diproses',
    CASE v_o.tipe
      WHEN 'Diantar' THEN 'Diantar'
      WHEN 'Diambil' THEN 'Siap diambil'
      ELSE 'Siap disajikan'
    END,
    'Selesai'
  ];
  v_idx := array_position(v_jalur, v_o.status);
  IF v_idx IS NULL THEN
    -- Status tidak cocok dengan tipe (seharusnya tidak pernah terjadi)
    RAISE EXCEPTION 'status_tidak_cocok';
  END IF;

  IF v_arah = 'maju' THEN
    v_tujuan := v_jalur[v_idx + 1];
  ELSE
    -- Mundur satu langkah; dari Disetujui tidak ada langkah mundur
    IF v_idx = 1 THEN
      RAISE EXCEPTION 'tidak_bisa_mundur';
    END IF;
    v_tujuan := v_jalur[v_idx - 1];
  END IF;

  UPDATE public."order"
     SET status      = v_tujuan,
         diubah_pada = now()
   WHERE id = v_o.id;

  INSERT INTO public.riwayat_status (order_id, status_asal, status_tujuan, oleh, keterangan)
  VALUES (
    v_o.id,
    v_o.status,
    v_tujuan,
    p_akun,
    CASE WHEN v_arah = 'mundur' THEN 'Mundur satu langkah' ELSE NULL END
  );

  RETURN jsonb_build_object(
    'id',          v_o.id,
    'nomor',       v_o.nomor,
    'status',      v_tujuan,
    'status_asal', v_o.status,
    'arah',        v_arah,
    'oleh_peran',  v_peran
  );
END;
$$;

-- ============================================================
-- 2. order_metode_koreksi: owner mengoreksi metode bayar (O23). Atomik.
--    Mengembalikan {id, nomor, status, metode_bayar, metode_sebelumnya}.
-- ============================================================
CREATE FUNCTION public.order_metode_koreksi(
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
  v_metode text;
  v_o      public."order"%ROWTYPE;
BEGIN
  IF p_akun IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Hanya owner aktif (O23, SEC-07, SEC-08, SEC-11)
  SELECT s.peran, s.aktif
    INTO v_peran, v_aktif
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

  -- Metode wajib dan hanya tiga nilai (O6, SEC-11); dicocokkan persis setelah dipangkas spasi
  v_metode := btrim(COALESCE(p_metode, ''), E' \t\r\n');
  IF v_metode NOT IN ('Transfer', 'Tunai', 'QRIS') THEN
    RAISE EXCEPTION 'metode_tidak_valid';
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

  -- Hanya selama dikerjakan: Disetujui sampai Diantar/Siap
  IF v_o.status = 'Menunggu' THEN
    RAISE EXCEPTION 'belum_disetujui';
  ELSIF v_o.status = 'Ditolak' THEN
    RAISE EXCEPTION 'sudah_ditolak';
  ELSIF v_o.status = 'Dibatalkan' THEN
    RAISE EXCEPTION 'sudah_dibatalkan';
  ELSIF v_o.status = 'Selesai' THEN
    RAISE EXCEPTION 'sudah_selesai';
  END IF;

  IF v_o.metode_bayar IS NOT DISTINCT FROM v_metode THEN
    RAISE EXCEPTION 'metode_sama';
  END IF;

  UPDATE public."order"
     SET metode_bayar = v_metode,
         diubah_pada  = now()
   WHERE id = v_o.id;

  -- Status tidak berubah, jadi asal dan tujuan sama. Metode lama dan baru ada di keterangan.
  INSERT INTO public.riwayat_status (order_id, status_asal, status_tujuan, oleh, keterangan)
  VALUES (
    v_o.id,
    v_o.status,
    v_o.status,
    p_akun,
    'Metode bayar: ' || v_metode || ' (sebelumnya ' || v_o.metode_bayar || ')'
  );

  RETURN jsonb_build_object(
    'id',                v_o.id,
    'nomor',             v_o.nomor,
    'status',            v_o.status,
    'metode_bayar',      v_metode,
    'metode_sebelumnya', v_o.metode_bayar
  );
END;
$$;

-- ============================================================
-- 3. order_alih_hari: owner memindahkan order ke Besok; status kembali ke Disetujui. Atomik.
--    p_jam: HH:MM, opsional (kosong = jam lama). p_alasan: opsional, maksimal 100 karakter,
--    hanya masuk riwayat_status.keterangan (pilihan C).
--    Mengembalikan {id, nomor, status, status_asal, hari_lama, hari_baru, jam_permintaan, oleh_peran}.
-- ============================================================
CREATE FUNCTION public.order_alih_hari(
  p_akun     uuid,
  p_order_id uuid,
  p_jam      text,
  p_alasan   text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_peran     text;
  v_aktif     boolean;
  v_jam_teks  text := nullif(btrim(COALESCE(p_jam, ''), E' \t\r\n'), '');
  v_alasan    text := nullif(btrim(COALESCE(p_alasan, ''), E' \t\r\n'), '');
  v_jam       time;
  v_jam_baru  time;
  v_besok     date := ((now() AT TIME ZONE 'Asia/Jakarta')::date) + 1;
  v_o         public."order"%ROWTYPE;
  v_asal      text;
  v_ket       text;
BEGIN
  IF p_akun IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Hanya owner aktif (SEC-07, SEC-08)
  SELECT s.peran, s.aktif
    INTO v_peran, v_aktif
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

  -- Jam opsional; bila diisi hanya format yang dicek, jam yang sudah lewat tidak ditolak (O2)
  IF v_jam_teks IS NOT NULL THEN
    IF v_jam_teks !~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$' THEN
      RAISE EXCEPTION 'jam_tidak_valid';
    END IF;
    v_jam := left(v_jam_teks, 5)::time;
  END IF;

  -- Alasan opsional, maksimal 100 karakter (muat di keterangan riwayat yang maksimal 200)
  IF char_length(v_alasan) > 100 THEN
    RAISE EXCEPTION 'alasan_alih_terlalu_panjang';
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

  v_asal := v_o.status;

  -- Hanya dari Disetujui, Diproses, Diantar/Siap
  IF v_asal = 'Menunggu' THEN
    RAISE EXCEPTION 'belum_disetujui';
  ELSIF v_asal = 'Ditolak' THEN
    RAISE EXCEPTION 'sudah_ditolak';
  ELSIF v_asal = 'Dibatalkan' THEN
    RAISE EXCEPTION 'sudah_dibatalkan';
  ELSIF v_asal = 'Selesai' THEN
    RAISE EXCEPTION 'sudah_selesai';
  END IF;

  -- Hari tujuan hanya Besok, dari tanggal server WIB (aturan 6): order yang sudah Besok atau lebih tidak bisa
  IF v_o.hari_target >= v_besok THEN
    RAISE EXCEPTION 'sudah_besok';
  END IF;

  v_jam_baru := COALESCE(v_jam, v_o.jam_permintaan);

  -- Keterangan riwayat: hari lama dan baru, jam bila berubah, alasan bila ada (maksimal 164 karakter)
  v_ket := 'Alih hari ' || to_char(v_o.hari_target, 'YYYY-MM-DD') || ' ke ' || to_char(v_besok, 'YYYY-MM-DD');
  IF to_char(v_jam_baru, 'HH24:MI') <> to_char(v_o.jam_permintaan, 'HH24:MI') THEN
    v_ket := v_ket || ', jam ' || to_char(v_o.jam_permintaan, 'HH24:MI') || ' ke ' || to_char(v_jam_baru, 'HH24:MI');
  END IF;
  IF v_alasan IS NOT NULL THEN
    v_ket := v_ket || '. Alasan: ' || v_alasan;
  END IF;

  -- Nomor order dan pembayaran tetap; pemutus dan waktu diputuskan tidak disentuh
  UPDATE public."order"
     SET hari_target    = v_besok,
         jam_permintaan = v_jam_baru,
         status         = 'Disetujui',
         diubah_pada    = now()
   WHERE id = v_o.id;

  INSERT INTO public.riwayat_status (order_id, status_asal, status_tujuan, oleh, keterangan)
  VALUES (v_o.id, v_asal, 'Disetujui', p_akun, v_ket);

  RETURN jsonb_build_object(
    'id',             v_o.id,
    'nomor',          v_o.nomor,
    'status',         'Disetujui',
    'status_asal',    v_asal,
    'hari_lama',      to_char(v_o.hari_target, 'YYYY-MM-DD'),
    'hari_baru',      to_char(v_besok, 'YYYY-MM-DD'),
    'jam_permintaan', to_char(v_jam_baru, 'HH24:MI'),
    'oleh_peran',     v_peran
  );
END;
$$;

-- ============================================================
-- 4. Hak EXECUTE: cabut semua dulu, lalu beri hanya ke service_role (AGENTS.md bagian 7).
-- ============================================================
REVOKE ALL ON FUNCTION public.order_status(uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.order_metode_koreksi(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.order_alih_hari(uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.order_status(uuid, uuid, text, text)       TO service_role;
GRANT EXECUTE ON FUNCTION public.order_metode_koreksi(uuid, uuid, text)     TO service_role;
GRANT EXECUTE ON FUNCTION public.order_alih_hari(uuid, uuid, text, text)    TO service_role;

COMMIT;
