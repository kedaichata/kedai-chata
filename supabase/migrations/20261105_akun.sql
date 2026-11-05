-- supabase/migrations/20261105_akun.sql
-- AKN.03: tabel pengaturan, profil, alamat, staf, hak, RLS, dan fungsi pembuat profil.
-- Dijalankan MANUAL di SQL Editor (akun ketua). Salinan pembatalan: 20261105_akun_batal.sql
-- Semua objek di sini BARU; tidak ada tabel atau data lama yang disentuh.
-- Tanpa data nyata. Satu-satunya data: baris awal pengaturan alamat_maks.

BEGIN;

-- ============================================================
-- 1. pengaturan (AK15): kunci-nilai, hanya dibaca server
-- ============================================================
CREATE TABLE public.pengaturan (
  kunci       text PRIMARY KEY,
  nilai       text NOT NULL,
  keterangan  text,
  diubah_pada timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. profil (AK6, AK7, AK8): hanya customer. Email TIDAK disalin (AK1).
--    Nomor WA disimpan seragam: 62 + 8xxxxxxxx (angka saja).
-- ============================================================
CREATE TABLE public.profil (
  id           uuid PRIMARY KEY REFERENCES auth.users (id),
  nama_tampilan text NOT NULL
    CONSTRAINT profil_nama_cek CHECK (
      char_length(nama_tampilan) BETWEEN 3 AND 20
      AND nama_tampilan ~ '^[A-Za-z0-9_ ]+$'
    ),
  nomor_wa     text NOT NULL
    CONSTRAINT profil_wa_cek CHECK (nomor_wa ~ '^628[0-9]{8,11}$'),
  dibuat_pada  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. alamat (AK9): tidak dihapus, hanya dinonaktifkan.
--    Batas jumlah aktif (alamat_maks) dijaga fungsi, bukan tabel.
-- ============================================================
CREATE TABLE public.alamat (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pemilik     uuid NOT NULL REFERENCES public.profil (id),
  alias       text NOT NULL
    CONSTRAINT alamat_alias_cek CHECK (char_length(alias) BETWEEN 3 AND 30),
  isi         text NOT NULL
    CONSTRAINT alamat_isi_cek CHECK (char_length(isi) BETWEEN 10 AND 200),
  aktif       boolean NOT NULL DEFAULT true,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX alamat_pemilik_aktif_idx ON public.alamat (pemilik) WHERE aktif;

-- ============================================================
-- 4. staf (AK4, AK5): ada baris = staf, tidak ada = customer.
--    Hanya ketua yang mengubah, lewat SQL Editor.
-- ============================================================
CREATE TABLE public.staf (
  id            uuid PRIMARY KEY REFERENCES auth.users (id),
  nama_tampilan text NOT NULL
    CONSTRAINT staf_nama_cek CHECK (
      char_length(nama_tampilan) BETWEEN 3 AND 20
      AND nama_tampilan ~ '^[A-Za-z0-9_ ]+$'
    ),
  peran         text NOT NULL
    CONSTRAINT staf_peran_cek CHECK (peran IN ('owner', 'penjaga')),
  aktif         boolean NOT NULL DEFAULT true,
  dibuat_pada   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. RLS aktif, TANPA policy untuk aplikasi (AGENTS.md bagian 7)
-- ============================================================
ALTER TABLE public.pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profil     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alamat     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staf       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. Hak: cabut SEMUA dulu (termasuk bawaan Supabase), lalu beri ulang
--    seminimal mungkin ke service_role. Tanpa DELETE. anon/authenticated nol.
-- ============================================================
REVOKE ALL ON TABLE public.pengaturan FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.profil     FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.alamat     FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.staf       FROM PUBLIC, anon, authenticated, service_role;

-- Hanya baca (perubahan oleh ketua di SQL Editor)
GRANT SELECT ON TABLE public.pengaturan TO service_role;
GRANT SELECT ON TABLE public.staf       TO service_role;

-- Baca, tambah, ubah (tanpa DELETE)
GRANT SELECT, INSERT, UPDATE ON TABLE public.profil TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.alamat TO service_role;

-- ============================================================
-- 7. Nilai awal pengaturan (AK15, database.md bagian 4)
-- ============================================================
INSERT INTO public.pengaturan (kunci, nilai, keterangan)
VALUES ('alamat_maks', '5', 'Batas alamat aktif per customer (AK9)');

-- ============================================================
-- 8. Fungsi pembuat profil (AK6): atomik, profil + alamat pertama
--    Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai` ke pesan aman:
--      id_kosong, nama_tidak_valid, wa_tidak_valid, alias_tidak_valid,
--      alamat_tidak_valid, pengaturan_rusak, akun_staf, profil_sudah_ada
--    Catatan: ID akun HARUS diambil `kedai` dari token login, bukan dari aplikasi.
-- ============================================================
CREATE FUNCTION public.buat_profil(
  p_id     uuid,
  p_nama   text,
  p_wa     text,
  p_alias  text,
  p_alamat text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_nama   text := btrim(p_nama);
  v_wa     text := btrim(p_wa);
  v_alias  text := btrim(p_alias);
  v_alamat text := btrim(p_alamat);
  v_maks   integer;
BEGIN
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Nama tampilan: 3-20, huruf/angka/spasi/garis bawah (AK7)
  IF coalesce(char_length(v_nama), 0) NOT BETWEEN 3 AND 20
     OR coalesce(v_nama, '') !~ '^[A-Za-z0-9_ ]+$' THEN
    RAISE EXCEPTION 'nama_tidak_valid';
  END IF;

  -- Nomor WA: boleh diawali +62, 62, atau 08; disimpan sebagai 62... (AK8)
  IF coalesce(v_wa, '') !~ '^(\+62|62|0)8[0-9]{8,11}$' THEN
    RAISE EXCEPTION 'wa_tidak_valid';
  END IF;
  v_wa := '62' || regexp_replace(v_wa, '^(\+62|62|0)', '');

  -- Alias 3-30 dan isi alamat 10-200 (AK9)
  IF coalesce(char_length(v_alias), 0) NOT BETWEEN 3 AND 30 THEN
    RAISE EXCEPTION 'alias_tidak_valid';
  END IF;
  IF coalesce(char_length(v_alamat), 0) NOT BETWEEN 10 AND 200 THEN
    RAISE EXCEPTION 'alamat_tidak_valid';
  END IF;

  -- Batas alamat dibaca dari pengaturan, tidak ditulis mati (AGENTS.md bagian 1)
  SELECT nilai::integer INTO v_maks
  FROM public.pengaturan
  WHERE kunci = 'alamat_maks';
  IF v_maks IS NULL OR v_maks < 1 THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;

  -- Akun staf tidak boleh punya profil customer (AK4: satu orang = dua akun)
  IF EXISTS (SELECT 1 FROM public.staf WHERE id = p_id) THEN
    RAISE EXCEPTION 'akun_staf';
  END IF;

  -- Buat profil; bila sudah ada (termasuk dua permintaan bersamaan), tolak
  INSERT INTO public.profil (id, nama_tampilan, nomor_wa)
  VALUES (p_id, v_nama, v_wa)
  ON CONFLICT (id) DO NOTHING;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profil_sudah_ada';
  END IF;

  -- Alamat pertama, satu transaksi dengan profil
  INSERT INTO public.alamat (pemilik, alias, isi)
  VALUES (p_id, v_alias, v_alamat);
END;
$$;

-- EXECUTE hanya untuk service_role (AGENTS.md bagian 7)
REVOKE ALL ON FUNCTION public.buat_profil(uuid, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.buat_profil(uuid, text, text, text, text)
  TO service_role;

COMMIT;
