-- supabase/migrations/20261108_04_order_batal_pesan.sql
-- ORD.04 (perbaikan pesan 409): fungsi SQL `order_batal` diganti versi baru supaya order yang sudah
-- Dibatalkan atau Ditolak tidak lagi dibalas "sudah diproses".
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo.
-- `kedai/index.ts` yang memetakan kode baru SUDAH dideploy lebih dulu (commit 9ea7cc9).
-- Pembatalan (kembali ke fungsi versi lama): 20261108_04_order_batal_pesan_batal.sql
-- Cek hasil: supabase/templates/20261108_04_order_batal_pesan_cek.sql
-- Tanpa data nyata.
--
-- Yang DIUBAH: hanya isi fungsi `public.order_batal(uuid, uuid, text)` (CREATE OR REPLACE, tanda tangan sama).
-- Yang SENGAJA TIDAK DISENTUH: semua tabel, pagar tabel, data order, fungsi lain, pengaturan, dan berkas aplikasi.
--
-- Perubahan perilaku (hanya kode galat yang dikirim; siapa boleh membatalkan tidak berubah):
--   - Customer, order Dibatalkan: kode baru `sudah_dibatalkan` (dulu `sudah_diproses`).
--   - Customer, order Ditolak: kode baru `sudah_ditolak` (dulu `sudah_diproses`).
--   - Customer, status lain selain Menunggu: tetap `sudah_diproses`.
--   - Owner, order Dibatalkan: kode baru `sudah_dibatalkan` (dulu `tidak_bisa_dibatalkan`).
--   - Owner, status lain di luar Disetujui sampai Siap: tetap `tidak_bisa_dibatalkan`.
-- Urutan pengecekan tetap: order tidak ada atau milik orang lain (customer) dicek PALING DULU,
--   jadi customer lain tidak bisa mengintip status order orang (SEC-05, SEC-09).
-- Penguncian baris `FOR UPDATE` (O7), riwayat status, dan hak EXECUTE tidak berubah.
--
-- Keputusan ketua (8 Nov 2026): wording pesan final; urutan daftar customer dibiarkan seperti sekarang.
-- Pilihan penulis (alasan belum tercatat): nama kode galat `sudah_dibatalkan` dan `sudah_ditolak`.

BEGIN;

-- ============================================================
-- 1. order_batal versi baru. Isi sama dengan versi 20261108_03, kecuali dua blok cek status
--    (baris lama dijadikan komentar, tidak dihapus).
-- ============================================================
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
    -- (lama, 20261108_03) IF v_asal <> 'Menunggu' THEN
    -- (lama, 20261108_03)   RAISE EXCEPTION 'sudah_diproses';
    -- (lama, 20261108_03) END IF;
    -- Baru: pesan dibedakan menurut status (hanya order milik customer ini yang sampai sini).
    IF v_asal = 'Dibatalkan' THEN
      RAISE EXCEPTION 'sudah_dibatalkan';
    ELSIF v_asal = 'Ditolak' THEN
      RAISE EXCEPTION 'sudah_ditolak';
    ELSIF v_asal <> 'Menunggu' THEN
      RAISE EXCEPTION 'sudah_diproses';
    END IF;
  ELSE
    -- (lama, 20261108_03) IF v_asal NOT IN ('Disetujui', 'Diproses', 'Diantar', 'Siap diambil', 'Siap disajikan') THEN
    -- (lama, 20261108_03)   RAISE EXCEPTION 'tidak_bisa_dibatalkan';
    -- (lama, 20261108_03) END IF;
    -- Baru: order yang sudah Dibatalkan punya kode sendiri.
    IF v_asal = 'Dibatalkan' THEN
      RAISE EXCEPTION 'sudah_dibatalkan';
    ELSIF v_asal NOT IN ('Disetujui', 'Diproses', 'Diantar', 'Siap diambil', 'Siap disajikan') THEN
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

-- ============================================================
-- 2. Hak EXECUTE: ditegaskan ulang (tidak berubah): hanya service_role.
-- ============================================================
REVOKE ALL ON FUNCTION public.order_batal(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.order_batal(uuid, uuid, text) TO service_role;

COMMIT;
