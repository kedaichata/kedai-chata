-- supabase/migrations/20261108_04_order_batal_pesan_batal.sql
-- PEMBATAL untuk 20261108_04_order_batal_pesan.sql: mengembalikan fungsi `public.order_batal`
-- ke versi lama (20261108_03_order_batal_fungsi.sql), yaitu semua status selain Menunggu
-- (customer) dibalas `sudah_diproses`, dan owner dibalas `tidak_bisa_dibatalkan`.
-- Dijalankan MANUAL di SQL Editor (akun ketua) HANYA bila migration 04 perlu dibatalkan.
-- Tidak menyentuh tabel, pagar tabel, atau data. `kedai/index.ts` boleh dibiarkan:
-- kode baru di pemetaannya tidak terpakai lagi dan tidak berbahaya.
-- Tanpa data nyata.

BEGIN;

CREATE OR REPLACE FUNCTION public.order_batal(
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
  v_o      public."order"%ROWTYPE;
  v_alasan text;
  v_asal   text;
BEGIN
  IF p_akun IS NULL OR p_order_id IS NULL THEN
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

  -- Penjaga tidak boleh membatalkan (O9, SEC-08)
  IF v_peran NOT IN ('customer', 'owner') THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;

  -- Alasan: hanya dari owner, opsional, maksimal 200 karakter (O8). Dari customer diabaikan.
  IF v_peran = 'owner' THEN
    v_alasan := nullif(btrim(COALESCE(p_alasan, ''), E' \t\r\n'), '');
    IF char_length(v_alasan) > 200 THEN
      RAISE EXCEPTION 'alasan_terlalu_panjang';
    END IF;
  ELSE
    v_alasan := NULL;
  END IF;

  -- Kunci baris order: Batal dan Setujui bersamaan hanya satu yang menang (O7)
  SELECT o.*
    INTO v_o
    FROM public."order" o
   WHERE o.id = p_order_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  v_asal := v_o.status;

  IF v_peran = 'customer' THEN
    -- Order milik orang lain: galat yang sama dengan "tidak ada" (SEC-05, SEC-09)
    IF v_o.pemesan IS DISTINCT FROM p_akun THEN
      RAISE EXCEPTION 'order_tidak_ditemukan';
    END IF;
    IF v_asal <> 'Menunggu' THEN
      RAISE EXCEPTION 'sudah_diproses';
    END IF;
  ELSE
    IF v_asal NOT IN ('Disetujui', 'Diproses', 'Diantar', 'Siap diambil', 'Siap disajikan') THEN
      RAISE EXCEPTION 'tidak_bisa_dibatalkan';
    END IF;
  END IF;

  UPDATE public."order"
     SET status      = 'Dibatalkan',
         alasan_tolak = v_alasan,
         diubah_pada = now()
   WHERE id = v_o.id;

  INSERT INTO public.riwayat_status (order_id, status_asal, status_tujuan, oleh, keterangan)
  VALUES (v_o.id, v_asal, 'Dibatalkan', p_akun, v_alasan);

  RETURN jsonb_build_object(
    'id',          v_o.id,
    'nomor',       v_o.nomor,
    'status',      'Dibatalkan',
    'status_asal', v_asal,
    'oleh_peran',  v_peran
  );
END;
$$;

REVOKE ALL ON FUNCTION public.order_batal(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.order_batal(uuid, uuid, text) TO service_role;

COMMIT;
