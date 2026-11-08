-- supabase/migrations/20261108_03_order_batal_fungsi.sql
-- ORD.04 (giliran 1): melonggarkan 3 pagar di tabel `order` + fungsi SQL `order_batal`.
-- Aksi `order_batal` di `kedai` (index.ts) dikerjakan di giliran 2; layar Pesanan Saya di giliran 3.
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo.
-- Pembatalan: 20261108_03_order_batal_fungsi_batal.sql
-- Cek hasil: supabase/templates/20261108_03_order_batal_fungsi_cek.sql
-- Tanpa data nyata.
--
-- Yang BARU:
--   - fungsi `public.order_batal(uuid, uuid, text)`
-- Yang DIUBAH (tabel yang sudah ada, tanpa mengubah data):
--   - tiga pagar di `public."order"`: `order_metode_status_cek`, `order_pemutus_cek`, `order_alasan_cek`
--     (dilepas lalu dipasang ulang dengan aturan yang LEBIH LONGGAR; semua order yang sudah ada tetap lolos).
-- Yang SENGAJA TIDAK DISENTUH: `order_buat`, `order_daftar`, `order_detail`, semua tabel lain,
--   semua pengaturan, `kedai/index.ts`, dan berkas aplikasi.
--
-- Kenapa pagar harus dilonggarkan (temuan cek awal ORD.04, blok order.md 8 Nov "Owner boleh membatalkan"):
--   Pagar lama menyatakan order Dibatalkan TIDAK boleh punya metode bayar, pemutus, dan alasan. Padahal
--   owner kini boleh membatalkan order yang sudah Disetujui (order itu sudah punya metode bayar dan pemutus),
--   dan alasan batal harus tampil ke customer. Tanpa perubahan ini fungsi `order_batal` pasti ditolak tabel.
--
-- Aturan pagar yang baru:
--   - Metode bayar: kosong untuk Menunggu dan Ditolak; wajib untuk Disetujui ke atas dan Selesai.
--     Untuk Dibatalkan: ada bila order itu sudah pernah Disetujui, kosong bila dibatalkan saat Menunggu
--     (ditentukan lewat pemutus: metode dan pemutus harus sama-sama ada atau sama-sama kosong).
--   - Pemutus (nama dan waktu ikut): kosong untuk Menunggu; wajib untuk Ditolak dan Disetujui ke atas;
--     untuk Dibatalkan mengikuti aturan di atas.
--   - Alasan (kolom `alasan_tolak`): boleh ada pada Ditolak dan Dibatalkan, 1 sampai 200 karakter (O8).
--
-- Keputusan yang berlaku (order.md blok 8 Nov 2026, security.md blok 8 Nov 2026):
--   - Customer hanya boleh membatalkan order MILIKNYA saat Menunggu.
--   - Owner boleh membatalkan dari Disetujui, Diproses, Diantar, Siap diambil, Siap disajikan.
--     Order Menunggu ditolak lewat Tolak (ORD.05), bukan Batal. Selesai tidak bisa dibatalkan siapa pun.
--   - Penjaga tidak boleh membatalkan.
--   - Alasan batal oleh owner opsional, maksimal 200 karakter, tampil ke customer seperti alasan tolak.
--   - Batal dan Setujui bersamaan: satu yang menang (baris order dikunci di dalam fungsi, O7).
--     CATATAN UNTUK ORD.05: fungsi `order_setuju` dan `order_tolak` WAJIB mengunci baris order dengan
--     cara yang sama (SELECT ... FOR UPDATE), kalau tidak pagar ini tidak menjamin satu pemenang.
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   - Alasan batal disimpan di kolom `alasan_tolak` yang sudah ada (bukan kolom baru), sehingga
--     `order_daftar` dan `order_detail` tidak perlu diubah dan alasannya langsung tampil ke customer.
--     Nama kolomnya jadi agak kurang pas (isinya alasan tolak ATAU alasan batal).
--   - Order yang dibatalkan owner tetap menyimpan metode bayar dan pemutus (berguna untuk pengembalian
--     uang di luar aplikasi lewat WA). Siapa yang membatalkan dan dari status apa: di `riwayat_status`.
--   - Alasan dari customer diabaikan (customer tidak punya kolom alasan batal, O8 hanya untuk owner).
--   - Alasan batal oleh owner juga disalin ke `riwayat_status.keterangan`.
--   - Fungsi tidak mengembalikan id pemesan (bahan push NTF.06 ditambahkan nanti bila perlu).
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai` di giliran 2:
--   id_kosong, akun_nonaktif, profil_tidak_ada, peran_tidak_boleh (penjaga), alasan_terlalu_panjang,
--   order_tidak_ditemukan (tidak ada atau bukan milik customer itu), sudah_diproses (customer, status
--   bukan Menunggu), tidak_bisa_dibatalkan (owner, status di luar Disetujui sampai Siap).
--   Yang seharusnya tidak muncul dari aplikasi biasa: id_kosong.

BEGIN;

-- ============================================================
-- 1. Pagar tabel `order`: lepas tiga pagar lama, pasang ulang dengan aturan baru.
-- ============================================================
ALTER TABLE public."order"
  DROP CONSTRAINT order_metode_status_cek,
  DROP CONSTRAINT order_pemutus_cek,
  DROP CONSTRAINT order_alasan_cek;

ALTER TABLE public."order"
  ADD CONSTRAINT order_metode_status_cek CHECK (
    CASE
      WHEN status = 'Dibatalkan' THEN (metode_bayar IS NULL) = (pemutus IS NULL)
      ELSE (metode_bayar IS NULL) = (status IN ('Menunggu', 'Ditolak'))
    END
  ),
  ADD CONSTRAINT order_pemutus_cek CHECK (
    (pemutus IS NULL AND pemutus_nama IS NULL AND diputuskan_pada IS NULL
       AND status IN ('Menunggu', 'Dibatalkan'))
    OR (pemutus IS NOT NULL AND pemutus_nama IS NOT NULL AND diputuskan_pada IS NOT NULL
       AND status <> 'Menunggu')
  ),
  ADD CONSTRAINT order_alasan_cek CHECK (
    alasan_tolak IS NULL
    OR (status IN ('Ditolak', 'Dibatalkan')
        AND char_length(alasan_tolak) BETWEEN 1 AND 200
        AND alasan_tolak = btrim(alasan_tolak))
  );

-- ============================================================
-- 2. order_batal (customer dan owner): atomik. Kunci baris order, cek hak dan status,
--    ubah status ke Dibatalkan, catat riwayat. Mengembalikan {id, nomor, status, status_asal, oleh_peran}.
--    p_akun HARUS dari token login (diambil `kedai`), bukan dari aplikasi.
-- ============================================================
CREATE FUNCTION public.order_batal(
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

-- ============================================================
-- 3. Hak EXECUTE: cabut semua dulu, lalu beri hanya ke service_role (AGENTS.md bagian 7).
-- ============================================================
REVOKE ALL ON FUNCTION public.order_batal(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.order_batal(uuid, uuid, text) TO service_role;

COMMIT;
