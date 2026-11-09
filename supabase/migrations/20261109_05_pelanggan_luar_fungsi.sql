-- supabase/migrations/20261109_05_pelanggan_luar_fungsi.sql
-- ORD.11 (giliran 1): tiga fungsi SQL untuk pelanggan tanpa akun (order.md O16).
--   public.pelanggan_luar_daftar   (baca daftar, hanya owner)
--   public.pelanggan_luar_simpan   (tambah, ubah, dan aktifkan lagi, hanya owner)
--   public.pelanggan_luar_nonaktif (nonaktifkan, hanya owner)
-- Dijalankan MANUAL di SQL Editor (akun ketua). Pembatalan: 20261109_05_pelanggan_luar_fungsi_batal.sql
-- Cek hasil: supabase/templates/20261109_05_pelanggan_luar_fungsi_cek.sql
-- Aksi `kedai` (berkas baru `pelanggan_luar.ts`) dikerjakan di giliran 2, SETELAH berkas ini dijalankan dan lulus cek.
-- Tanpa data nyata. Semua objek di sini BARU: tabel `pelanggan_luar` (dari ORD.01), hak tabel, dan fungsi lain
-- TIDAK diubah. Tidak ada data yang ditulis oleh berkas ini.
--
-- Keputusan yang berlaku:
--   - Hanya owner aktif (cek ulang di fungsi, lapis kedua ada di `kedai`). Customer, penjaga, dan staf nonaktif ditolak.
--   - Tidak ada penghapusan. Pelanggan hanya dinonaktifkan (O16, security.md aturan 15). Aktifkan lagi lewat
--     `pelanggan_luar_simpan` dengan `p_aktifkan` = true (pola sama dengan `menu_simpan`). Keputusan ketua 9 Nov 2026.
--   - Satu alamat antar per pelanggan (database.md; keputusan ketua 9 Nov 2026).
--   - Pelanggan yang diubah atau dinonaktifkan TIDAK mengubah order lama: order menyimpan salinan (O16).
--
-- Aturan isian (mengikuti pagar tabel `pelanggan_luar` di 20261108_order.sql):
--   - nama wajib, 3 sampai 30 karakter, tanpa karakter kontrol (tab, baris baru).
--   - keterangan opsional, 3 sampai 100 karakter, tanpa karakter kontrol. Kosong = tanpa keterangan.
--   - nomor WA opsional. Boleh ditulis +62, 62, atau 08 (aturan sama dengan `buat_profil`), disimpan sebagai 62...
--   - alamat antar opsional, 10 sampai 200 karakter. Kosong = tanpa alamat.
--   - spasi dan tab di tepi semua isian dipangkas. Isian kosong (atau hanya spasi) dianggap tidak diisi.
--   - UBAH: aplikasi wajib mengirim semua kolom; kolom kosong berarti dikosongkan (disamakan dengan deskripsi menu).
--   - Nama kembar BOLEH. Yang ditolak hanya nama DAN keterangan yang sama persis (huruf besar-kecil dianggap
--     sama) di antara pelanggan AKTIF. Berlaku juga saat mengaktifkan lagi.
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai` ke pesan aman:
--   id_kosong, akun_nonaktif, peran_tidak_boleh, nama_tidak_valid, keterangan_tidak_valid, wa_tidak_valid,
--   alamat_tidak_valid, pelanggan_sudah_ada, pelanggan_tidak_ditemukan
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   - Nomor WA: spasi dan tanda hubung dibuang dulu sebelum dicek ("0812 3456 7890" diterima). Ini sedikit lebih
--     longgar daripada `buat_profil`, supaya owner yang mengetik cepat tidak ditolak karena spasi.
--   - `pelanggan_luar_simpan` mengembalikan baris pelanggan hasil simpan (id, nama, keterangan, nomor_wa,
--     alamat_antar, aktif), supaya wizard "tambah baru di tempat" (ORD.13) langsung memakai id barunya.
--   - Penulisan (tambah dan ubah) diserialkan dengan kunci penasihat (`pg_advisory_xact_lock`), supaya dua owner yang
--     menyimpan nama sama bersamaan tidak lolos keduanya dari cek nama kembar. Dilepas otomatis di akhir transaksi.
--   - `pelanggan_luar_nonaktif` pada pelanggan yang sudah nonaktif tidak galat: hasilnya sama, tidak ada yang berubah.
--   - `pelanggan_luar_daftar`: urut abjad nama (huruf besar-kecil dianggap sama), lalu keterangan; bila ikut
--     menampilkan nonaktif, yang aktif di atas. Tanpa pembagian halaman (sekitar 100 pelanggan).
--   - Isian yang tidak ikut dikembalikan: `dibuat_oleh` dan `dibuat_pada`.
--
-- Pola keamanan (AGENTS.md bagian 7): SECURITY DEFINER, `search_path` kosong, skema `public.` eksplisit,
-- EXECUTE hanya untuk service_role.

BEGIN;

-- ============================================================
-- 1. pelanggan_luar_daftar: daftar pelanggan tanpa akun (hanya owner)
--    p_semua = true: ikut menampilkan yang nonaktif. Selain itu hanya yang aktif.
--    Mengembalikan daftar (jsonb) berisi: id, nama, keterangan, nomor_wa, alamat_antar, aktif.
-- ============================================================
CREATE FUNCTION public.pelanggan_luar_daftar(
  p_akun  uuid,
  p_semua boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_staf_aktif boolean;
  v_peran      text;
  v_hasil      jsonb;
BEGIN
  IF p_akun IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Hanya owner aktif. Tidak ada baris staf = customer.
  SELECT aktif, peran INTO v_staf_aktif, v_peran
  FROM public.staf
  WHERE id = p_akun;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;
  IF NOT v_staf_aktif THEN
    RAISE EXCEPTION 'akun_nonaktif';
  END IF;
  IF v_peran <> 'owner' THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;

  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',           pl.id,
        'nama',         pl.nama,
        'keterangan',   pl.keterangan,
        'nomor_wa',     pl.nomor_wa,
        'alamat_antar', pl.alamat_antar,
        'aktif',        pl.aktif
      )
      ORDER BY (NOT pl.aktif), lower(pl.nama), lower(coalesce(pl.keterangan, '')), pl.id
    ),
    '[]'::jsonb
  )
  INTO v_hasil
  FROM public.pelanggan_luar pl
  WHERE pl.aktif OR coalesce(p_semua, false);

  RETURN v_hasil;
END;
$$;

-- ============================================================
-- 2. pelanggan_luar_simpan: tambah, ubah, atau aktifkan lagi (hanya owner)
--    p_id kosong = tambah baru (p_aktifkan diabaikan, pelanggan baru selalu aktif).
--    p_id terisi = ubah pelanggan itu; p_aktifkan = true mengaktifkannya lagi bila nonaktif.
--    Mengembalikan baris pelanggan hasil simpan (jsonb).
-- ============================================================
CREATE FUNCTION public.pelanggan_luar_simpan(
  p_akun       uuid,
  p_id         uuid,
  p_nama       text,
  p_keterangan text,
  p_wa         text,
  p_alamat     text,
  p_aktifkan   boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_staf_aktif boolean;
  v_peran      text;
  v_nama       text;
  v_ket        text;
  v_wa         text;
  v_alamat     text;
  v_ada        public.pelanggan_luar%ROWTYPE;
  v_aktif_baru boolean;
  v_id         uuid;
  v_hasil      jsonb;
BEGIN
  IF p_akun IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Hanya owner aktif. Tidak ada baris staf = customer.
  SELECT aktif, peran INTO v_staf_aktif, v_peran
  FROM public.staf
  WHERE id = p_akun;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;
  IF NOT v_staf_aktif THEN
    RAISE EXCEPTION 'akun_nonaktif';
  END IF;
  IF v_peran <> 'owner' THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;

  -- Nama: wajib, 3-30, tanpa karakter kontrol
  v_nama := regexp_replace(coalesce(p_nama, ''), '^[[:space:]]+|[[:space:]]+$', '', 'g');
  IF char_length(v_nama) NOT BETWEEN 3 AND 30 OR v_nama ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION 'nama_tidak_valid';
  END IF;

  -- Keterangan: opsional, 3-100, tanpa karakter kontrol; kosong = tanpa keterangan
  v_ket := nullif(regexp_replace(coalesce(p_keterangan, ''), '^[[:space:]]+|[[:space:]]+$', '', 'g'), '');
  IF v_ket IS NOT NULL
     AND (char_length(v_ket) NOT BETWEEN 3 AND 100 OR v_ket ~ '[[:cntrl:]]') THEN
    RAISE EXCEPTION 'keterangan_tidak_valid';
  END IF;

  -- Nomor WA: opsional. Spasi dan tanda hubung dibuang; boleh +62, 62, atau 08; disimpan 62... (AK8)
  v_wa := nullif(regexp_replace(coalesce(p_wa, ''), '[[:space:]-]', '', 'g'), '');
  IF v_wa IS NOT NULL THEN
    IF v_wa !~ '^(\+62|62|0)8[0-9]{8,11}$' THEN
      RAISE EXCEPTION 'wa_tidak_valid';
    END IF;
    v_wa := '62' || regexp_replace(v_wa, '^(\+62|62|0)', '');
  END IF;

  -- Alamat antar: opsional, 10-200; kosong = tanpa alamat (satu alamat per pelanggan)
  v_alamat := nullif(regexp_replace(coalesce(p_alamat, ''), '^[[:space:]]+|[[:space:]]+$', '', 'g'), '');
  IF v_alamat IS NOT NULL AND char_length(v_alamat) NOT BETWEEN 10 AND 200 THEN
    RAISE EXCEPTION 'alamat_tidak_valid';
  END IF;

  -- Penulisan diserialkan: dua penyimpanan bersamaan tidak bisa sama-sama lolos cek nama kembar.
  PERFORM pg_advisory_xact_lock(hashtext('pelanggan_luar_simpan'));

  IF p_id IS NULL THEN
    -- TAMBAH BARU (selalu aktif)
    IF EXISTS (
      SELECT 1
      FROM public.pelanggan_luar pl
      WHERE pl.aktif
        AND lower(pl.nama) = lower(v_nama)
        AND coalesce(lower(pl.keterangan), '') = coalesce(lower(v_ket), '')
    ) THEN
      RAISE EXCEPTION 'pelanggan_sudah_ada';
    END IF;

    INSERT INTO public.pelanggan_luar (nama, keterangan, nomor_wa, alamat_antar, aktif, dibuat_oleh)
    VALUES (v_nama, v_ket, v_wa, v_alamat, true, p_akun)
    RETURNING id INTO v_id;
  ELSE
    -- UBAH (dan, bila diminta, AKTIFKAN LAGI)
    SELECT * INTO v_ada
    FROM public.pelanggan_luar
    WHERE id = p_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'pelanggan_tidak_ditemukan';
    END IF;

    v_aktif_baru := v_ada.aktif OR coalesce(p_aktifkan, false);

    -- Cek nama kembar hanya bila hasil akhirnya aktif (pelanggan lain yang aktif, bukan dirinya sendiri)
    IF v_aktif_baru AND EXISTS (
      SELECT 1
      FROM public.pelanggan_luar pl
      WHERE pl.aktif
        AND pl.id <> p_id
        AND lower(pl.nama) = lower(v_nama)
        AND coalesce(lower(pl.keterangan), '') = coalesce(lower(v_ket), '')
    ) THEN
      RAISE EXCEPTION 'pelanggan_sudah_ada';
    END IF;

    UPDATE public.pelanggan_luar
    SET nama         = v_nama,
        keterangan   = v_ket,
        nomor_wa     = v_wa,
        alamat_antar = v_alamat,
        aktif        = v_aktif_baru
    WHERE id = p_id;

    v_id := p_id;
  END IF;

  SELECT jsonb_build_object(
    'id',           pl.id,
    'nama',         pl.nama,
    'keterangan',   pl.keterangan,
    'nomor_wa',     pl.nomor_wa,
    'alamat_antar', pl.alamat_antar,
    'aktif',        pl.aktif
  )
  INTO v_hasil
  FROM public.pelanggan_luar pl
  WHERE pl.id = v_id;

  RETURN v_hasil;
END;
$$;

-- ============================================================
-- 3. pelanggan_luar_nonaktif: nonaktifkan pelanggan (hanya owner). Tidak ada penghapusan.
--    Pelanggan yang sudah nonaktif: sukses tanpa perubahan.
--    Mengembalikan baris pelanggan (jsonb), bentuk sama dengan pelanggan_luar_simpan.
-- ============================================================
CREATE FUNCTION public.pelanggan_luar_nonaktif(
  p_akun uuid,
  p_id   uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_staf_aktif boolean;
  v_peran      text;
  v_ada        public.pelanggan_luar%ROWTYPE;
  v_hasil      jsonb;
BEGIN
  IF p_akun IS NULL OR p_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Hanya owner aktif. Tidak ada baris staf = customer.
  SELECT aktif, peran INTO v_staf_aktif, v_peran
  FROM public.staf
  WHERE id = p_akun;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;
  IF NOT v_staf_aktif THEN
    RAISE EXCEPTION 'akun_nonaktif';
  END IF;
  IF v_peran <> 'owner' THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;

  SELECT * INTO v_ada
  FROM public.pelanggan_luar
  WHERE id = p_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pelanggan_tidak_ditemukan';
  END IF;

  IF v_ada.aktif THEN
    UPDATE public.pelanggan_luar
    SET aktif = false
    WHERE id = p_id;
  END IF;

  SELECT jsonb_build_object(
    'id',           pl.id,
    'nama',         pl.nama,
    'keterangan',   pl.keterangan,
    'nomor_wa',     pl.nomor_wa,
    'alamat_antar', pl.alamat_antar,
    'aktif',        pl.aktif
  )
  INTO v_hasil
  FROM public.pelanggan_luar pl
  WHERE pl.id = p_id;

  RETURN v_hasil;
END;
$$;

-- ============================================================
-- 4. EXECUTE hanya untuk service_role (AGENTS.md bagian 7)
-- ============================================================
REVOKE ALL ON FUNCTION public.pelanggan_luar_daftar(uuid, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pelanggan_luar_daftar(uuid, boolean)
  TO service_role;

REVOKE ALL ON FUNCTION public.pelanggan_luar_simpan(uuid, uuid, text, text, text, text, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pelanggan_luar_simpan(uuid, uuid, text, text, text, text, boolean)
  TO service_role;

REVOKE ALL ON FUNCTION public.pelanggan_luar_nonaktif(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pelanggan_luar_nonaktif(uuid, uuid)
  TO service_role;

COMMIT;
