-- supabase/migrations/20261111_06_inbox_fungsi.sql
-- INB.02: tiga fungsi SQL inbox: `inbox_tulis`, `inbox_daftar`, `inbox_terbaru`.
-- Aksi `kedai` (inbox.ts, index.ts) dikerjakan di INB.03 dan INB.04, dan baru dideploy SETELAH migration ini
-- dijalankan dan lulus cek.
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo dan SETELAH "OK" ketua.
-- Pembatalan: supabase/migrations/20261111_06_inbox_fungsi_batal.sql
-- Cek hasil: supabase/templates/20261111_06_inbox_fungsi_cek.sql
-- Tanpa data nyata.
--
-- Yang BARU:
--   - fungsi `public.inbox_tulis(uuid, text, uuid)`
--   - fungsi `public.inbox_daftar(uuid, bigint)`
--   - fungsi `public.inbox_terbaru(uuid)`
-- Yang SENGAJA TIDAK DISENTUH: semua tabel dan hak tabel (termasuk `inbox`), data, semua fungsi lama
--   (fungsi order TIDAK diubah, IB12), pengaturan, dan berkas aplikasi.
-- Semua fungsi BARU (CREATE FUNCTION, bukan OR REPLACE), jadi tidak mungkin menimpa fungsi lama.
-- Tidak ada data yang berubah sampai `inbox_tulis` dipanggil.
--
-- Pola keamanan (AGENTS.md bagian 7, security.md aturan 4): SECURITY DEFINER, search_path kosong,
-- `public.` eksplisit, tabel order ditulis public."order", EXECUTE hanya untuk service_role.
-- `p_akun` dan `p_pelaku` HARUS diambil `kedai` dari token login, bukan dari aplikasi (aturan 2 dan 5).
-- Tidak ada DELETE dan tidak ada UPDATE (hak tabel `inbox` hanya SELECT dan INSERT).
--
-- PENGECUALIAN TULIS (AGENTS.md blok 11 Nov 2026): `inbox_tulis` dipanggil `kedai` SETELAH aksi order
-- berhasil, sebagai panggilan terpisah. Kegagalannya TIDAK membatalkan aksi (IB12). Pengecualian ini hanya
-- untuk `inbox_tulis`, tidak untuk aksi lain.
--
-- Keputusan yang berlaku (inbox.md IB1 sampai IB15; notifikasi.md 4.1):
--   - Penerima dihitung SERVER dari order dan tabel `staf` yang aktif, persis tabel 4.1 notifikasi.md
--     termasuk tambahan 8 Nov (batal owner dan alih hari). Tidak ada daftar penerima kedua (IB3).
--   - Pelaku tidak dikabari atas aksinya sendiri. Penjaga tidak dikabari untuk order Menunggu, Ditolak,
--     atau Dibatalkan (O11), KECUALI kejadian `batal_owner` (tambahan 8 Nov). Pemesan tanpa akun
--     (order wakil) dilewati karena tidak punya akun.
--   - Teks inbox sama dengan teks push: umum, tanpa nama, alamat, nomor WA, isi catatan, nama menu, atau
--     alasan (IB4, aturan 16). Nomor order boleh, diambil dari order itu sendiri (bukan dari aplikasi).
--   - Waktu dari jam server (IB5). Lama tampil dan batas jumlah dari tabel pengaturan (IB6, IB15).
--   - Urutan tampil: belum dibaca di atas (id lebih besar dari penanda HP), lalu terbaru dulu (IB9).
--   - Mundur satu langkah TIDAK dikabari: `kedai` jangan memanggil `inbox_tulis` untuk mundur (INB.04).
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   1. Kode kejadian: order_baru, catatan_customer, catatan_owner, batal_customer, batal_owner, setujui,
--      tolak, status, foto_setelah_selesai, order_wakil, alih_hari. Untuk `status`, fungsi membaca status
--      order saat itu untuk memilih teks (Diproses, Diantar, Siap diambil, Siap disajikan, Selesai).
--   2. Fungsi memeriksa kecocokan status order dengan kejadian. Bila tidak cocok, fungsi melempar
--      `status_tidak_cocok` (menulis nol baris), supaya salah pasang di INB.04 kelihatan di log `kedai`.
--   3. Catatan baru dari owner: customer "Ada catatan baru di pesananmu.", penjaga "Ada catatan baru di
--      order #N." (notifikasi.md hanya menulis "idem" untuk penjaga).
--   4. `inbox_terbaru` adalah fungsi tambahan di luar teks sheet: nomor item terbaru dalam masa tampil,
--      dipakai titik merah (IB10) di INB.03 TANPA mengubah fungsi `status` yang sudah live.
--   5. Batas pengaturan yang diterima: `inbox_simpan_hari` bilangan bulat 1 sampai 365, `inbox_maks_tampil`
--      bilangan bulat 1 sampai 200; di luar itu galat `pengaturan_rusak` (galat umum 500).
--   6. `inbox_daftar` juga mengembalikan `terbaru` (nomor item terbaru dalam masa tampil) supaya HP
--      menggeser penanda dengan angka dari server, bukan dari tebakan.
--   7. Staf nonaktif ditolak `akun_nonaktif` di `inbox_daftar` dan `inbox_terbaru` (tanpa baris staf =
--      customer, tidak dicek).
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai` (inbox.ts), usulan status HTTP di dalam kurung:
--   inbox_tulis:    id_kosong (tidak dipetakan), kejadian_tidak_dikenal (tidak dipetakan),
--                   order_tidak_ditemukan (tidak dipetakan), status_tidak_cocok (tidak dipetakan)
--                   (semua kegagalan inbox_tulis hanya dicatat di log `kedai`, tidak sampai ke layar, IB12)
--   inbox_daftar / inbox_terbaru: id_kosong (400), akun_nonaktif (403), pengaturan_rusak (tidak dipetakan,
--                   galat umum 500)

BEGIN;

-- ============================================================
-- 1. inbox_tulis: tulis satu baris inbox per penerima untuk satu kejadian order.
--    p_pelaku  : akun yang melakukan aksi (dari token login; tidak dikabari).
--    p_kejadian: salah satu kode kejadian (lihat header).
--    p_order_id: order yang terkait.
--    Mengembalikan jumlah baris yang ditulis (bisa 0).
-- ============================================================
CREATE FUNCTION public.inbox_tulis(
  p_pelaku    uuid,
  p_kejadian  text,
  p_order_id  uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_o          public."order"%ROWTYPE;
  v_nomor      text;
  v_t_owner    text;
  v_t_penjaga  text;
  v_t_customer text;
  v_penjaga_ok boolean;
  v_n          integer := 0;
  v_c          integer;
BEGIN
  IF p_pelaku IS NULL OR p_kejadian IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  IF p_kejadian NOT IN (
    'order_baru', 'catatan_customer', 'catatan_owner', 'batal_customer', 'batal_owner',
    'setujui', 'tolak', 'status', 'foto_setelah_selesai', 'order_wakil', 'alih_hari'
  ) THEN
    RAISE EXCEPTION 'kejadian_tidak_dikenal';
  END IF;

  SELECT o.*
    INTO v_o
    FROM public."order" o
   WHERE o.id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  v_nomor := v_o.nomor::text;

  -- Teks dan penerima per kejadian (notifikasi.md 4.1). NULL = kelompok itu tidak dikabari.
  IF p_kejadian = 'order_baru' THEN
    IF v_o.status <> 'Menunggu' THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_owner := 'Ada order baru.';

  ELSIF p_kejadian = 'catatan_customer' THEN
    IF v_o.status NOT IN ('Menunggu', 'Disetujui') THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_owner   := 'Ada catatan baru di order #' || v_nomor || '.';
    v_t_penjaga := v_t_owner;  -- dibuang di bawah bila order masih Menunggu

  ELSIF p_kejadian = 'catatan_owner' THEN
    IF v_o.status NOT IN ('Menunggu', 'Disetujui') THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_customer := 'Ada catatan baru di pesananmu.';
    v_t_penjaga  := 'Ada catatan baru di order #' || v_nomor || '.';  -- dibuang di bawah bila Menunggu

  ELSIF p_kejadian = 'batal_customer' THEN
    IF v_o.status <> 'Dibatalkan' THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_owner := 'Order #' || v_nomor || ' dibatalkan pemesan.';

  ELSIF p_kejadian = 'batal_owner' THEN
    IF v_o.status <> 'Dibatalkan' THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_customer := 'Pesananmu dibatalkan. Buka aplikasi untuk detailnya.';
    v_t_penjaga  := 'Order #' || v_nomor || ' dibatalkan.';

  ELSIF p_kejadian = 'setujui' THEN
    IF v_o.status IN ('Menunggu', 'Ditolak', 'Dibatalkan') THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_customer := 'Pesananmu sudah disetujui.';
    v_t_penjaga  := 'Ada order disetujui.';

  ELSIF p_kejadian = 'tolak' THEN
    IF v_o.status <> 'Ditolak' THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_customer := 'Pesananmu belum bisa diterima. Buka aplikasi untuk detailnya.';

  ELSIF p_kejadian = 'status' THEN
    v_t_customer := CASE v_o.status
      WHEN 'Diproses'       THEN 'Pesananmu sedang diproses.'
      WHEN 'Diantar'        THEN 'Pesananmu sedang diantar.'
      WHEN 'Siap diambil'   THEN 'Pesananmu siap diambil.'
      WHEN 'Siap disajikan' THEN 'Pesananmu siap disajikan.'
      WHEN 'Selesai'        THEN 'Pesananmu selesai. Foto bukti (bila ada) dibuka di aplikasi.'
      ELSE NULL
    END;
    IF v_t_customer IS NULL THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;

  ELSIF p_kejadian = 'foto_setelah_selesai' THEN
    IF v_o.status <> 'Selesai' THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_customer := 'Foto bukti antar sudah tersedia.';

  ELSIF p_kejadian = 'order_wakil' THEN
    IF v_o.pemesan IS NOT NULL OR v_o.status IN ('Menunggu', 'Ditolak', 'Dibatalkan') THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_penjaga := 'Ada order disetujui.';

  ELSIF p_kejadian = 'alih_hari' THEN
    IF v_o.status <> 'Disetujui' THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_customer := 'Pesananmu dialihkan ke besok. Buka aplikasi untuk detailnya.';
    v_t_penjaga  := 'Order #' || v_nomor || ' dialihkan ke besok.';
  END IF;

  -- O11: penjaga tidak dikabari untuk order Menunggu, Ditolak, Dibatalkan; pengecualian: batal_owner (8 Nov)
  v_penjaga_ok := (p_kejadian = 'batal_owner')
                  OR v_o.status NOT IN ('Menunggu', 'Ditolak', 'Dibatalkan');

  -- Owner aktif (pelaku tidak dikabari)
  IF v_t_owner IS NOT NULL THEN
    INSERT INTO public.inbox (penerima, teks, nomor_order)
    SELECT s.id, v_t_owner, v_o.nomor
      FROM public.staf s
     WHERE s.peran = 'owner'
       AND s.aktif
       AND s.id <> p_pelaku;
    GET DIAGNOSTICS v_c = ROW_COUNT;
    v_n := v_n + v_c;
  END IF;

  -- Penjaga aktif (pelaku tidak dikabari)
  IF v_t_penjaga IS NOT NULL AND v_penjaga_ok THEN
    INSERT INTO public.inbox (penerima, teks, nomor_order)
    SELECT s.id, v_t_penjaga, v_o.nomor
      FROM public.staf s
     WHERE s.peran = 'penjaga'
       AND s.aktif
       AND s.id <> p_pelaku;
    GET DIAGNOSTICS v_c = ROW_COUNT;
    v_n := v_n + v_c;
  END IF;

  -- Customer pemilik order (kosong untuk order wakil; pelaku tidak dikabari)
  IF v_t_customer IS NOT NULL
     AND v_o.pemesan IS NOT NULL
     AND v_o.pemesan <> p_pelaku THEN
    INSERT INTO public.inbox (penerima, teks, nomor_order)
    VALUES (v_o.pemesan, v_t_customer, v_o.nomor);
    v_n := v_n + 1;
  END IF;

  RETURN v_n;
END;
$$;

-- ============================================================
-- 2. inbox_daftar: isi Kotak masuk milik p_akun (hanya miliknya), dalam masa tampil, maksimal batas tampil.
--    p_penanda: nomor item terakhir yang sudah dilihat di HP ini (dari localStorage); hanya untuk
--    mengurutkan dan menandai. Kosong atau negatif dianggap 0 (semua belum dibaca). Bukan identitas.
--    Mengembalikan {butir: [{id, teks, nomor_order, waktu, belum}], terbaru, maks}.
--    Urutan: belum dibaca dulu, lalu terbaru dulu (IB9).
-- ============================================================
CREATE FUNCTION public.inbox_daftar(
  p_akun     uuid,
  p_penanda  bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_aktif     boolean;
  v_ada_staf  boolean;
  v_penanda   bigint := greatest(coalesce(p_penanda, 0), 0);
  v_hari_txt  text;
  v_hari      integer;
  v_maks_txt  text;
  v_maks      integer;
  v_butir     jsonb;
  v_terbaru   bigint;
BEGIN
  IF p_akun IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Staf nonaktif ditolak; tanpa baris staf = customer
  SELECT s.aktif
    INTO v_aktif
    FROM public.staf s
   WHERE s.id = p_akun;
  v_ada_staf := FOUND;
  IF v_ada_staf AND NOT v_aktif THEN
    RAISE EXCEPTION 'akun_nonaktif';
  END IF;

  -- Pengaturan (aturan 19): lama tampil dan batas jumlah
  SELECT nullif(btrim(g.nilai::text), '')
    INTO v_hari_txt
    FROM public.pengaturan g
   WHERE g.kunci = 'inbox_simpan_hari';
  IF v_hari_txt IS NULL OR v_hari_txt !~ '^[0-9]{1,3}$' THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;
  v_hari := v_hari_txt::integer;
  IF v_hari < 1 OR v_hari > 365 THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;

  SELECT nullif(btrim(g.nilai::text), '')
    INTO v_maks_txt
    FROM public.pengaturan g
   WHERE g.kunci = 'inbox_maks_tampil';
  IF v_maks_txt IS NULL OR v_maks_txt !~ '^[0-9]{1,3}$' THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;
  v_maks := v_maks_txt::integer;
  IF v_maks < 1 OR v_maks > 200 THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;

  -- Daftar: hanya milik p_akun, dalam masa tampil dari jam server; belum dibaca dulu, lalu terbaru dulu
  SELECT coalesce(jsonb_agg(x.j ORDER BY x.belum DESC, x.id DESC), '[]'::jsonb)
    INTO v_butir
    FROM (
      SELECT i.id,
             (i.id > v_penanda) AS belum,
             jsonb_build_object(
               'id',          i.id,
               'teks',        i.teks,
               'nomor_order', i.nomor_order,
               'waktu',       to_char(i.waktu AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI'),
               'belum',       (i.id > v_penanda)
             ) AS j
        FROM public.inbox i
       WHERE i.penerima = p_akun
         AND i.waktu >= now() - make_interval(days => v_hari)
       ORDER BY (i.id > v_penanda) DESC, i.id DESC
       LIMIT v_maks
    ) x;

  -- Nomor item terbaru dalam masa tampil (kosong bila tidak ada), untuk menggeser penanda di HP
  SELECT max(i.id)
    INTO v_terbaru
    FROM public.inbox i
   WHERE i.penerima = p_akun
     AND i.waktu >= now() - make_interval(days => v_hari);

  RETURN jsonb_build_object(
    'butir',   v_butir,
    'terbaru', v_terbaru,
    'maks',    v_maks
  );
END;
$$;

-- ============================================================
-- 3. inbox_terbaru: nomor item inbox terbaru milik p_akun dalam masa tampil (kosong bila tidak ada).
--    Dipakai titik merah (IB10): `kedai` menambahkannya ke balasan panggilan buka aplikasi.
-- ============================================================
CREATE FUNCTION public.inbox_terbaru(
  p_akun uuid
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_aktif    boolean;
  v_ada_staf boolean;
  v_hari_txt text;
  v_hari     integer;
  v_terbaru  bigint;
BEGIN
  IF p_akun IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  SELECT s.aktif
    INTO v_aktif
    FROM public.staf s
   WHERE s.id = p_akun;
  v_ada_staf := FOUND;
  IF v_ada_staf AND NOT v_aktif THEN
    RAISE EXCEPTION 'akun_nonaktif';
  END IF;

  SELECT nullif(btrim(g.nilai::text), '')
    INTO v_hari_txt
    FROM public.pengaturan g
   WHERE g.kunci = 'inbox_simpan_hari';
  IF v_hari_txt IS NULL OR v_hari_txt !~ '^[0-9]{1,3}$' THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;
  v_hari := v_hari_txt::integer;
  IF v_hari < 1 OR v_hari > 365 THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;

  SELECT max(i.id)
    INTO v_terbaru
    FROM public.inbox i
   WHERE i.penerima = p_akun
     AND i.waktu >= now() - make_interval(days => v_hari);

  RETURN v_terbaru;
END;
$$;

-- ============================================================
-- 4. Hak EXECUTE: cabut semua dulu, lalu beri hanya ke service_role (AGENTS.md bagian 7).
-- ============================================================
REVOKE ALL ON FUNCTION public.inbox_tulis(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.inbox_daftar(uuid, bigint)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.inbox_terbaru(uuid)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.inbox_tulis(uuid, text, uuid)  TO service_role;
GRANT EXECUTE ON FUNCTION public.inbox_daftar(uuid, bigint)     TO service_role;
GRANT EXECUTE ON FUNCTION public.inbox_terbaru(uuid)            TO service_role;

COMMIT;
