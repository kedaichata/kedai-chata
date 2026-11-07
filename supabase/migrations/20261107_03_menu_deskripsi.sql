-- supabase/migrations/20261107_03_menu_deskripsi.sql
-- MNU.07 (giliran 1): kolom `deskripsi` di tabel menu, satu pengaturan baru, dan fungsi menu diperluas.
-- Aksi `kedai` (index.ts) dikerjakan di giliran 2, aplikasi (menu.js, index.html, style.css) di giliran 3.
-- Dijalankan MANUAL di SQL Editor (akun ketua). Pembatalan: 20261107_03_menu_deskripsi_batal.sql
-- Cek hasil: supabase/templates/20261107_03_menu_deskripsi_cek.sql
-- Tanpa data nyata.
--
-- Yang BARU:
--   - kolom `public.menu.deskripsi` (opsional; menu lama otomatis kosong, tidak ada data yang berubah)
--   - baris pengaturan `deskripsi_menu_maks` = 200
--   - fungsi `public.menu_simpan` versi 7 argumen (menambah p_deskripsi)
-- Yang DIGANTI di tempat (tanda tangan sama, hak EXECUTE sama):
--   - `public.menu_daftar(boolean)`: balasannya kini membawa field `deskripsi` tambahan.
--     Aplikasi dan `kedai` yang lama tidak terganggu oleh field tambahan itu.
-- Yang SENGAJA DIBIARKAN:
--   - `public.menu_simpan` versi 6 argumen (MNU.02). Dibiarkan supaya `kedai` yang sedang live tetap jalan
--     sampai giliran 2 dideploy. p_deskripsi sengaja TANPA nilai bawaan, jadi panggilan lama (6 argumen)
--     hanya cocok ke versi lama dan tidak ambigu. Versi lama dibersihkan di langkah terpisah setelah
--     `kedai` baru terpasang, dengan "OK" ketua.
--
-- Keputusan yang berlaku (menu.md bagian 9, blok "Deskripsi, sheet detail, dan pilihan menu", 7 Nov 2026):
--   - Deskripsi opsional, batas disimpan di database (pengaturan `deskripsi_menu_maks`, bukan ditulis mati).
--   - Keputusan ketua (7 Nov 2026, chat): deskripsi boleh BEBERAPA BARIS (Enter), misalnya daftar bergaya
--     bullet yang diketik owner dengan awalan "- ". Alasan: usulan owner, bacaan lebih jelas di sheet detail.
--
-- Aturan rapikan deskripsi (dilakukan fungsi sebelum simpan):
--   - Akhir baris Windows dan Mac lama (CR) dijadikan satu jenis baris baru.
--   - Karakter kontrol tak terlihat dibuang. Tab dan spasi berulang jadi satu spasi.
--   - Spasi di awal dan akhir tiap baris dibuang. Baris kosong beruntun jadi satu baris kosong saja.
--   - Baris kosong di awal dan akhir dibuang. Hasil kosong = disimpan NULL (tanpa deskripsi).
--   - Panjang dihitung SETELAH dirapikan; satu baris baru dihitung satu karakter.
--
-- Kode galat baru: deskripsi_tidak_valid. Yang lain tetap (lihat 20261107_02_menu_fungsi.sql).
--   `kedai` perlu memetakan kode baru ini ke pesan aman (giliran 2).
--
-- Catatan untuk giliran 2: bila `deskripsi` kosong atau tidak dikirim, fungsi menyimpannya sebagai tanpa
--   deskripsi (menghapus deskripsi lama). Karena itu `kedai` wajib selalu mengirim isian deskripsi apa adanya
--   saat mengubah menu, dan menolak permintaan yang tidak memuat field itu.

BEGIN;

-- ============================================================
-- 1. Kolom deskripsi (perubahan pada tabel yang sudah live)
--    Pagar kedua di tabel hanya soal bentuk (tidak kosong, tanpa spasi di tepi, tanpa CR).
--    Batas panjang atas dijaga fungsi dari pengaturan, sama seperti harga_maks_menu.
-- ============================================================
ALTER TABLE public.menu
  ADD COLUMN deskripsi text
    CONSTRAINT menu_deskripsi_cek CHECK (
      deskripsi IS NULL
      OR (
        char_length(deskripsi) >= 1
        AND deskripsi !~ '^\s'   -- tanpa spasi atau baris kosong di awal
        AND deskripsi !~ '\s$'   -- tanpa spasi atau baris kosong di akhir
        AND deskripsi !~ '\r'    -- hanya satu jenis baris baru
      )
    );

-- ============================================================
-- 2. Pengaturan baru (database.md bagian 4: angka yang bisa berubah ada di database)
-- ============================================================
INSERT INTO public.pengaturan (kunci, nilai, keterangan)
VALUES ('deskripsi_menu_maks', '200', 'Batas panjang deskripsi satu menu, karakter (MNU.07)');

-- ============================================================
-- 3. menu_daftar: digantikan di tempat, menambah field deskripsi
-- ============================================================
CREATE OR REPLACE FUNCTION public.menu_daftar(p_semua boolean)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',        m.id,
          'nama',      m.nama,
          'harga',     m.harga,
          'tersedia',  m.tersedia,
          'aktif',     m.aktif,
          'foto',      m.foto,
          'deskripsi', m.deskripsi
        )
        ORDER BY lower(m.nama), m.id
      )
      FROM public.menu m
      WHERE m.aktif OR COALESCE(p_semua, false)
    ),
    '[]'::jsonb
  );
END;
$$;

-- ============================================================
-- 4. menu_simpan versi baru (7 argumen): owner. Tambah (p_id kosong) atau ubah (p_id terisi).
--    Sama seperti versi MNU.02, ditambah p_deskripsi.
--    p_deskripsi kosong atau NULL = tanpa deskripsi.
--    Mengembalikan id menu.
-- ============================================================
CREATE FUNCTION public.menu_simpan(
  p_oleh      uuid,
  p_id        uuid,
  p_nama      text,
  p_harga     integer,
  p_foto      text,
  p_deskripsi text,
  p_aktifkan  boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_nama      text;
  v_foto      text;
  v_desk      text;
  v_maks      bigint;
  v_maks_desk bigint;
  v_id        uuid;
BEGIN
  IF p_oleh IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.staf s
    WHERE s.id = p_oleh AND s.aktif AND s.peran = 'owner'
  ) THEN
    RAISE EXCEPTION 'bukan_owner';
  END IF;

  -- Rapikan nama: buang spasi di awal dan akhir, spasi ganda jadi satu (tabel menolaknya)
  v_nama := regexp_replace(
              regexp_replace(COALESCE(p_nama, ''), '^\s+|\s+$', '', 'g'),
              '\s+', ' ', 'g'
            );
  IF char_length(v_nama) < 3 OR char_length(v_nama) > 40 THEN
    RAISE EXCEPTION 'nama_tidak_valid';
  END IF;

  -- Harga: lebih dari 0 dan tidak melebihi harga_maks_menu (database.md bagian 4)
  SELECT CASE WHEN s.nilai::text ~ '^[0-9]{1,9}$' THEN s.nilai::text::bigint END
    INTO v_maks
    FROM public.pengaturan s
   WHERE s.kunci = 'harga_maks_menu';
  IF v_maks IS NULL THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;
  IF p_harga IS NULL OR p_harga <= 0 OR p_harga > v_maks THEN
    RAISE EXCEPTION 'harga_tidak_valid';
  END IF;

  -- Foto: kosong = tanpa foto; selain itu nama berkas saja (huruf kecil, angka, strip)
  v_foto := NULLIF(COALESCE(p_foto, ''), '');
  IF v_foto IS NOT NULL AND (
       char_length(v_foto) > 60
       OR v_foto !~ '^[a-z0-9]+(-[a-z0-9]+)*\.(jpg|webp)$'
     ) THEN
    RAISE EXCEPTION 'foto_tidak_valid';
  END IF;

  -- Deskripsi: boleh beberapa baris. Rapikan dulu, baru hitung panjangnya.
  v_desk := COALESCE(p_deskripsi, '');
  v_desk := replace(v_desk, E'\r\n', E'\n');
  v_desk := replace(v_desk, E'\r', E'\n');
  v_desk := regexp_replace(v_desk, '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g');
  v_desk := regexp_replace(v_desk, '[[:blank:]]+', ' ', 'g');
  v_desk := regexp_replace(v_desk, ' *\n *', E'\n', 'g');
  v_desk := regexp_replace(v_desk, '\n{3,}', E'\n\n', 'g');
  v_desk := regexp_replace(v_desk, '^\s+|\s+$', '', 'g');
  v_desk := NULLIF(v_desk, '');

  IF v_desk IS NOT NULL THEN
    SELECT CASE WHEN s.nilai::text ~ '^[0-9]{1,9}$' THEN s.nilai::text::bigint END
      INTO v_maks_desk
      FROM public.pengaturan s
     WHERE s.kunci = 'deskripsi_menu_maks';
    IF v_maks_desk IS NULL THEN
      RAISE EXCEPTION 'pengaturan_rusak';
    END IF;
    IF char_length(v_desk) > v_maks_desk THEN
      RAISE EXCEPTION 'deskripsi_tidak_valid';
    END IF;
  END IF;

  IF p_id IS NULL THEN
    -- Tambah menu baru
    BEGIN
      INSERT INTO public.menu (nama, harga, foto, deskripsi, diubah_pada, diubah_oleh)
      VALUES (v_nama, p_harga, v_foto, v_desk, now(), p_oleh)
      RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'nama_kembar';
    END;
    RETURN v_id;
  END IF;

  -- Ubah menu yang ada (dikunci supaya dua owner tidak bertabrakan)
  PERFORM 1 FROM public.menu m WHERE m.id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'menu_tidak_ditemukan';
  END IF;

  BEGIN
    UPDATE public.menu
       SET nama        = v_nama,
           harga       = p_harga,
           foto        = v_foto,
           deskripsi   = v_desk,
           aktif       = CASE WHEN COALESCE(p_aktifkan, false) THEN true ELSE aktif END,
           diubah_pada = now(),
           diubah_oleh = p_oleh
     WHERE id = p_id;
  EXCEPTION WHEN unique_violation THEN
    -- Termasuk saat mengaktifkan kembali menu yang namanya sudah dipakai menu aktif
    RAISE EXCEPTION 'nama_kembar';
  END;

  RETURN p_id;
END;
$$;

-- ============================================================
-- 5. Hak EXECUTE: cabut semua dulu (termasuk bawaan Supabase),
--    lalu beri hanya ke service_role. anon/authenticated nol.
--    (menu_daftar diulang supaya pasti sama; versi 6 argumen tidak disentuh.)
-- ============================================================
REVOKE ALL ON FUNCTION public.menu_daftar(boolean)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.menu_simpan(uuid, uuid, text, integer, text, text, boolean)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.menu_daftar(boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.menu_simpan(uuid, uuid, text, integer, text, text, boolean) TO service_role;

COMMIT;
