-- supabase/migrations/20261111_02_foto_fungsi.sql
-- FTO.02: tiga fungsi SQL foto bukti: `foto_cek_unggah`, `foto_catat`, `foto_lihat_cek`, dan satu baris pengaturan
-- baru `foto_tautan_detik`. Aksi `kedai` (foto.ts, index.ts) dikerjakan bersama di giliran yang sama dan baru
-- dideploy SETELAH migration ini dijalankan dan lulus cek.
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo dan SETELAH "OK" ketua.
-- Pembatalan: supabase/migrations/20261111_02_foto_fungsi_batal.sql
-- Cek hasil: supabase/templates/20261111_02_foto_fungsi_cek.sql
-- Tanpa data nyata.
--
-- Yang BARU:
--   - fungsi `public.foto_cek_unggah(uuid, uuid)`
--   - fungsi `public.foto_catat(uuid, uuid, text, bigint)`
--   - fungsi `public.foto_lihat_cek(uuid, uuid)`
--   - baris `pengaturan`: `foto_tautan_detik` = 300 (lama hidup tautan lihat, dalam detik)
-- Yang SENGAJA TIDAK DISENTUH: semua tabel dan pagarnya (termasuk `foto_bukti`, hak tabelnya, dan bucket),
--   data order, semua fungsi lama, baris pengaturan lain, dan berkas aplikasi.
-- Semua fungsi BARU (CREATE FUNCTION, bukan OR REPLACE), jadi tidak mungkin menimpa fungsi lama.
-- Tidak ada data yang berubah sampai fungsi dipanggil.
--
-- Pola keamanan (AGENTS.md bagian 7, security.md aturan 4): SECURITY DEFINER, search_path kosong,
-- `public.` eksplisit, nama tabel order ditulis public."order", EXECUTE hanya untuk service_role.
-- `p_akun` HARUS diambil `kedai` dari token login, bukan dari aplikasi (aturan 2 dan 5).
-- Peran dibaca fungsi sendiri dari tabel `staf` sebagai pagar kedua di samping `kedai` (aturan 8).
-- Tidak ada DELETE di sini (aturan 12). Berkas di Storage tidak disentuh fungsi SQL; pembuatan alamat unggah dan
-- tautan lihat dikerjakan `kedai` lewat jalur resmi Storage.
--
-- Keputusan yang berlaku (foto-bukti.md FT1 sampai FT5, FT10; Handoff #1; keputusan ketua 11 Nov 2026):
--   - Foto hanya untuk order tipe Diantar, diunggah saat status Diantar atau Selesai, oleh penjaga atau owner aktif.
--   - Satu foto aktif per order. Pengunggah asli boleh mengganti: foto lama ditandai diganti = true LEBIH DULU,
--     baru baris baru ditambah (pagar indeks unik sebagian di tabel), semuanya dalam satu langkah atomik.
--   - Dilihat oleh customer pemilik order, owner, dan penjaga. Penjaga tidak melihat order Menunggu, Ditolak, atau
--     Dibatalkan (O11, SEC-08), jadi tidak melihat fotonya juga.
--   - Format lokasi berkas: `<id order>/<uuid acak>.jpg` atau `.webp`, DIBUAT SERVER (kedai). Fungsi SQL menolak
--     lokasi yang bentuknya lain atau yang tidak berawalan id order itu.
--   - Ukuran: `kedai` membaca ukuran berkas dari Storage (bukan dari aplikasi) dan meneruskannya ke `foto_catat`;
--     batasnya `foto_maks_kb` dari tabel pengaturan (aturan 19).
--
-- Pilihan penulis (ketua menyetujui empat butir di sesi 11 Nov 2026: format lokasi, hak lihat, hanya pengunggah asli
-- mengganti, tautan 300 detik di pengaturan; sisanya alasan belum tercatat):
--   1. `foto_cek_unggah` adalah pemeriksa hak unggah TANPA mengunci order; dipakai `kedai` sebelum membuat alamat
--      unggah. `foto_catat` mengunci order lalu memanggil pemeriksa yang sama, jadi aturannya hanya ada di satu tempat.
--   2. Pengunggah asli yang sudah dinonaktifkan tidak bisa mengganti (ia ditolak `akun_nonaktif`); tidak ada orang
--      lain yang bisa mengganti. Dapat diterima (disetujui ketua).
--   3. `foto_lihat_cek` mengembalikan salah satu status: `ada` (disertai lokasi dan lama tautan), `dibersihkan`
--      (berkas sudah dihapus pembersihan, layar menampilkan "Foto sudah dihapus"), atau `tidak_ada`.
--      Foto yang sudah ditandai diganti tidak pernah dikembalikan.
--   4. `foto_tautan_detik` harus bilangan bulat 1 sampai 3600; di luar itu galat `pengaturan_rusak` (tidak dipetakan,
--      jadi galat umum 500). Batas atas 3600 adalah pilihan penulis.
--   5. Kolom `id` dan `diunggah_pada` di `foto_bukti`: `id` memakai nilai bawaan tabel (tidak diisi fungsi);
--      `diunggah_pada` diisi now(). ASUMSI: `id` punya nilai bawaan. Bila migration FTO.01 ternyata tanpa nilai
--      bawaan, penambahan foto gagal dengan galat umum dan perlu perbaikan.
--   6. Penambahan baris pengaturan hanya mengisi kolom `kunci` dan `nilai` (nilai ditulis '300'). ASUMSI: kolom lain
--      (misalnya keterangan) boleh kosong. Bila tidak, migration ini GAGAL UTUH (tidak ada yang tersimpan) dan
--      isinya diperbaiki dulu.
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai` (foto.ts), usulan status HTTP di dalam kurung:
--   Umum:           id_kosong (tidak dipetakan, galat umum), pengaturan_rusak (tidak dipetakan, galat umum),
--                   akun_nonaktif (403), peran_tidak_boleh (403), order_tidak_ditemukan (404)
--   foto_cek_unggah / foto_catat: bukan_antar (409), status_tidak_boleh (409), bukan_pengunggah (403)
--   foto_catat:     lokasi_tidak_valid (400), ukuran_tidak_valid (400), ukuran_terlalu_besar (400),
--                   foto_sudah_dicatat (409)

BEGIN;

-- ============================================================
-- 0. Pengaturan baru: lama hidup tautan lihat (detik). Hanya MENAMBAH baris.
-- ============================================================
INSERT INTO public.pengaturan (kunci, nilai)
VALUES ('foto_tautan_detik', '300');

-- ============================================================
-- 1. foto_cek_unggah: boleh atau tidak p_akun mengunggah (atau mengganti) foto untuk order ini. TIDAK mengunci.
--    Mengembalikan {order_id, nomor, mengganti, maks_kb}.
-- ============================================================
CREATE FUNCTION public.foto_cek_unggah(
  p_akun     uuid,
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_peran    text;
  v_aktif    boolean;
  v_o        public."order"%ROWTYPE;
  v_oleh     uuid;
  v_ada      boolean := false;
  v_maks_txt text;
  v_maks     integer;
BEGIN
  IF p_akun IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Hanya penjaga atau owner aktif. Tidak ada baris staf = customer = tidak boleh.
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

  SELECT o.*
    INTO v_o
    FROM public."order" o
   WHERE o.id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  -- O11: penjaga tidak melihat order Menunggu, Ditolak, Dibatalkan (SEC-08)
  IF v_peran = 'penjaga' AND v_o.status IN ('Menunggu', 'Ditolak', 'Dibatalkan') THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  -- FT1: hanya tipe Diantar
  IF v_o.tipe <> 'Diantar' THEN
    RAISE EXCEPTION 'bukan_antar';
  END IF;

  -- FT2: hanya saat Diantar atau Selesai
  IF v_o.status NOT IN ('Diantar', 'Selesai') THEN
    RAISE EXCEPTION 'status_tidak_boleh';
  END IF;

  -- Sudah ada foto aktif? Bila ya, hanya pengunggah asli yang boleh mengganti (FT2, SEC-29)
  SELECT f.diunggah_oleh
    INTO v_oleh
    FROM public.foto_bukti f
   WHERE f.order_id = p_order_id
     AND f.diganti = false;
  IF FOUND THEN
    v_ada := true;
    IF v_oleh IS DISTINCT FROM p_akun THEN
      RAISE EXCEPTION 'bukan_pengunggah';
    END IF;
  END IF;

  -- Batas ukuran dari pengaturan (aturan 19), diteruskan supaya aplikasi tahu batasnya
  SELECT nullif(btrim(g.nilai::text), '')
    INTO v_maks_txt
    FROM public.pengaturan g
   WHERE g.kunci = 'foto_maks_kb';
  IF v_maks_txt IS NULL OR v_maks_txt !~ '^[0-9]{1,6}$' THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;
  v_maks := v_maks_txt::integer;
  IF v_maks < 1 THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;

  RETURN jsonb_build_object(
    'order_id',  v_o.id,
    'nomor',     v_o.nomor,
    'mengganti', v_ada,
    'maks_kb',   v_maks
  );
END;
$$;

-- ============================================================
-- 2. foto_catat: mencatat foto yang sudah diunggah ke Storage. Atomik.
--    p_lokasi: lokasi berkas yang dibuat server. p_ukuran_byte: ukuran berkas dibaca server dari Storage.
--    Bila order sudah punya foto aktif: foto lama ditandai diganti DULU, baru baris baru ditambah.
--    Mengembalikan {id (order), nomor, mengganti}.
-- ============================================================
CREATE FUNCTION public.foto_catat(
  p_akun        uuid,
  p_order_id    uuid,
  p_lokasi      text,
  p_ukuran_byte bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_peran    text;
  v_aktif    boolean;
  v_lokasi   text := btrim(COALESCE(p_lokasi, ''), E' \t\r\n');
  v_cek      jsonb;
  v_maks_kb  integer;
  v_mengganti boolean;
  v_nomor    bigint;
BEGIN
  IF p_akun IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Pagar kedua peran sebelum mengunci apa pun (SEC-07, SEC-08)
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

  -- Bentuk lokasi: <id order>/<uuid>.jpg atau .webp, dan harus milik order ini
  IF v_lokasi !~ ('^' || p_order_id::text
                  || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$') THEN
    RAISE EXCEPTION 'lokasi_tidak_valid';
  END IF;

  IF p_ukuran_byte IS NULL OR p_ukuran_byte < 1 THEN
    RAISE EXCEPTION 'ukuran_tidak_valid';
  END IF;

  -- Kunci baris order: dua unggahan bersamaan untuk order yang sama, satu per satu (SEC-10 untuk foto)
  PERFORM 1
     FROM public."order" o
    WHERE o.id = p_order_id
      FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  -- Semua aturan hak dan status di satu tempat (order sudah terkunci, jadi hasilnya stabil)
  v_cek := public.foto_cek_unggah(p_akun, p_order_id);
  v_mengganti := (v_cek ->> 'mengganti')::boolean;
  v_nomor := (v_cek ->> 'nomor')::bigint;
  v_maks_kb := (v_cek ->> 'maks_kb')::integer;

  IF p_ukuran_byte > (v_maks_kb::bigint * 1024) THEN
    RAISE EXCEPTION 'ukuran_terlalu_besar';
  END IF;

  IF EXISTS (SELECT 1 FROM public.foto_bukti f WHERE f.lokasi_berkas = v_lokasi) THEN
    RAISE EXCEPTION 'foto_sudah_dicatat';
  END IF;

  -- Foto lama ditandai diganti LEBIH DULU, baru baris baru (pagar satu foto aktif per order)
  IF v_mengganti THEN
    UPDATE public.foto_bukti
       SET diganti = true
     WHERE order_id = p_order_id
       AND diganti = false;
  END IF;

  INSERT INTO public.foto_bukti (order_id, lokasi_berkas, diunggah_pada, diunggah_oleh)
  VALUES (p_order_id, v_lokasi, now(), p_akun);

  RETURN jsonb_build_object(
    'id',        p_order_id,
    'nomor',     v_nomor,
    'mengganti', v_mengganti
  );
END;
$$;

-- ============================================================
-- 3. foto_lihat_cek: hak lihat foto aktif sebuah order, dan lokasinya untuk dibuatkan tautan sementara oleh kedai.
--    Customer: hanya order miliknya. Owner: semua. Penjaga: tidak untuk Menunggu, Ditolak, Dibatalkan.
--    Mengembalikan {order_id, status: 'ada' | 'dibersihkan' | 'tidak_ada', lokasi, detik, diunggah_pada}
--    (lokasi, detik, diunggah_pada hanya bila status = 'ada').
-- ============================================================
CREATE FUNCTION public.foto_lihat_cek(
  p_akun     uuid,
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_peran     text;
  v_aktif     boolean;
  v_ada_staf  boolean;
  v_o         public."order"%ROWTYPE;
  v_f         public.foto_bukti%ROWTYPE;
  v_detik_txt text;
  v_detik     integer;
BEGIN
  IF p_akun IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Peran dari tabel staf; tidak ada baris = customer
  SELECT s.peran, s.aktif
    INTO v_peran, v_aktif
    FROM public.staf s
   WHERE s.id = p_akun;
  v_ada_staf := FOUND;
  IF v_ada_staf AND NOT v_aktif THEN
    RAISE EXCEPTION 'akun_nonaktif';
  END IF;

  SELECT o.*
    INTO v_o
    FROM public."order" o
   WHERE o.id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  -- Hak lihat (FT3, O11, SEC-05, SEC-20): yang tidak berhak dibalas "tidak ditemukan", bukan "dilarang"
  IF NOT v_ada_staf THEN
    IF v_o.pemesan IS DISTINCT FROM p_akun THEN
      RAISE EXCEPTION 'order_tidak_ditemukan';
    END IF;
  ELSIF v_peran = 'penjaga' THEN
    IF v_o.status IN ('Menunggu', 'Ditolak', 'Dibatalkan') THEN
      RAISE EXCEPTION 'order_tidak_ditemukan';
    END IF;
  ELSIF v_peran <> 'owner' THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  -- Foto aktif (yang belum ditandai diganti); paling banyak satu (pagar indeks unik sebagian)
  SELECT f.*
    INTO v_f
    FROM public.foto_bukti f
   WHERE f.order_id = p_order_id
     AND f.diganti = false;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('order_id', v_o.id, 'status', 'tidak_ada');
  END IF;

  IF v_f.dibersihkan_pada IS NOT NULL THEN
    RETURN jsonb_build_object('order_id', v_o.id, 'status', 'dibersihkan');
  END IF;

  -- Lama hidup tautan dari pengaturan (aturan 19)
  SELECT nullif(btrim(g.nilai::text), '')
    INTO v_detik_txt
    FROM public.pengaturan g
   WHERE g.kunci = 'foto_tautan_detik';
  IF v_detik_txt IS NULL OR v_detik_txt !~ '^[0-9]{1,4}$' THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;
  v_detik := v_detik_txt::integer;
  IF v_detik < 1 OR v_detik > 3600 THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;

  RETURN jsonb_build_object(
    'order_id',       v_o.id,
    'status',         'ada',
    'lokasi',         v_f.lokasi_berkas,
    'detik',          v_detik,
    'diunggah_pada',  to_char(v_f.diunggah_pada AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI')
  );
END;
$$;

-- ============================================================
-- 4. Hak EXECUTE: cabut semua dulu, lalu beri hanya ke service_role (AGENTS.md bagian 7).
-- ============================================================
REVOKE ALL ON FUNCTION public.foto_cek_unggah(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.foto_catat(uuid, uuid, text, bigint)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.foto_lihat_cek(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.foto_cek_unggah(uuid, uuid)               TO service_role;
GRANT EXECUTE ON FUNCTION public.foto_catat(uuid, uuid, text, bigint)      TO service_role;
GRANT EXECUTE ON FUNCTION public.foto_lihat_cek(uuid, uuid)                TO service_role;

COMMIT;
