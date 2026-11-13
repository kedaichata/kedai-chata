-- supabase/migrations/20261113_inbox_tulis_penerima_batal.sql
-- Pembatal untuk 20261113_inbox_tulis_penerima.sql (NTF.06, langkah SQL).
-- Dijalankan MANUAL di SQL Editor (akun ketua), hanya bila migration itu perlu dibatalkan.
--
-- Isi: membuang `push_langganan_ambil` dan `push_hasil_catat`, lalu mengembalikan `inbox_tulis` ke versi
-- 20261111_06_inbox_fungsi.sql (kembalian integer = jumlah baris). Tabel, data, dan fungsi lain tidak disentuh.
--
-- URUTAN AMAN: sebelum menjalankan berkas ini, pastikan `kedai` yang live BUKAN versi pengirim push
-- (deploy `kedai` versi sebelumnya lebih dulu). Versi pengirim push mengharapkan `inbox_tulis` mengembalikan daftar.
-- Bila DROP gagal karena ada objek lain yang bergantung, BERHENTI dan laporkan. Jangan pakai CASCADE.
-- Belum pernah dicoba.

BEGIN;

DROP FUNCTION public.push_hasil_catat(uuid[], uuid[]);
DROP FUNCTION public.push_langganan_ambil(uuid[]);
DROP FUNCTION public.inbox_tulis(uuid, text, uuid);

-- ============================================================
-- inbox_tulis versi lama (salinan dari 20261111_06_inbox_fungsi.sql, bagian 1)
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

REVOKE ALL ON FUNCTION public.inbox_tulis(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.inbox_tulis(uuid, text, uuid) TO service_role;

COMMIT;
