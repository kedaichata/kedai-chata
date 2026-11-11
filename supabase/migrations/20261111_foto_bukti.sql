-- supabase/migrations/20261111_foto_bukti.sql
-- FTO.01: tabel foto_bukti, dua baris pengaturan foto, satu bucket Storage privat (foto-bukti),
-- hak minimal, dan RLS.
-- Dijalankan MANUAL di SQL Editor (akun ketua). Pembatalan: 20261111_foto_bukti_batal.sql
-- Cek hasil: supabase/templates/20261111_foto_bukti_cek.sql
-- Tanpa data nyata. Semua objek di sini BARU; tabel order dan tabel lain tidak disentuh.
-- Aksi `kedai` untuk foto (foto_minta_unggah, foto_catat, foto_lihat), kompres di HP, dan fungsi
-- `bersihkan` dikerjakan di FTO.02 sampai FTO.05 (bukan di berkas ini).
--
-- Yang BARU:
--   - tabel `public.foto_bukti`
--   - baris pengaturan `foto_simpan_hari` dan `foto_maks_kb`
--   - bucket Storage `foto-bukti` (privat)
--
-- Keputusan yang berlaku (foto-bukti.md dan database.md):
--   - Satu bucket saja, yaitu foto bukti. Tidak ada bucket foto menu (blok foto-bukti.md 11 Nov 2026).
--   - Bucket privat TANPA policy untuk aplikasi (FT5). Unggah dan lihat lewat server.
--   - Baris foto_bukti TIDAK dihapus (FT10); yang dihapus hanya berkas, oleh `bersihkan` (FT8).
--     `service_role` tanpa DELETE.
--   - Satu foto aktif per order; pengunggah boleh mengganti, foto lama ditandai `diganti` (FT2).
--
-- Keputusan ketua 11 Nov 2026 yang MENIMPA angka lama (yang paling akhir menang):
--   - `foto_maks_kb` = 150 (sebelumnya 300 di database.md bagian 4).
--   - Batas ukuran bucket = 256 KB (262144 byte), sebagai pagar kedua di bawah pengecekan server.
--   - Alasan dari ketua: foto hanya untuk menunjukkan posisi barang ditaruh. Target kompres sekitar
--     50 KB (dikerjakan di FTO.03). Blok catatan susulan untuk foto-bukti.md dan database.md menyusul.
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   - Nama bucket `foto-bukti`. Jenis berkas yang diterima bucket: image/jpeg dan image/webp saja.
--   - `diunggah_oleh` merujuk `staf` (pengunggah selalu penjaga atau owner), sama seperti `pemutus` di order.
--   - Pagar "satu foto aktif per order" dipasang di tabel (indeks unik sebagian). Akibatnya fungsi FTO.02
--     wajib menandai foto lama `diganti = true` LEBIH DULU, baru menambah baris foto baru, dalam satu
--     langkah atomik.
--   - Angka batas ukuran bucket tertulis di SQL ini (bukan di pengaturan). Bila `foto_maks_kb` kelak
--     dinaikkan melebihi 256, batas bucket ikut diubah (butuh "OK" ketua).
--   - Bucket sengaja dibuat TANPA "ON CONFLICT": bila nama bucket sudah ada, migration berhenti dan
--     tidak menimpa apa pun.

BEGIN;

-- ============================================================
-- 1. Pengaturan baru (database.md bagian 4: angka yang bisa berubah ada di database)
-- ============================================================
INSERT INTO public.pengaturan (kunci, nilai, keterangan)
VALUES
  ('foto_simpan_hari', '14',  'Lama simpan berkas foto bukti sebelum dibersihkan, dalam hari (FT6)'),
  ('foto_maks_kb',     '150', 'Batas ukuran foto bukti yang diterima server, dalam KB (FT4)');

-- ============================================================
-- 2. foto_bukti (FT10): satu baris per foto yang pernah dicatat. Tidak dihapus.
--    `diganti` = foto ini sudah digantikan foto yang lebih baru.
--    `dibersihkan_pada` kosong selama berkas masih ada di Storage.
-- ============================================================
CREATE TABLE public.foto_bukti (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid        NOT NULL REFERENCES public."order" (id),
  lokasi_berkas    text        NOT NULL
    CONSTRAINT foto_bukti_lokasi_cek CHECK (
      char_length(lokasi_berkas) BETWEEN 1 AND 200
      AND lokasi_berkas = btrim(lokasi_berkas)
      AND lokasi_berkas !~ '[[:cntrl:]]'
      AND lokasi_berkas !~ '^/'
    ),
  diunggah_pada    timestamptz NOT NULL DEFAULT now(),
  diunggah_oleh    uuid        NOT NULL REFERENCES public.staf (id),
  diganti          boolean     NOT NULL DEFAULT false,
  dibersihkan_pada timestamptz,

  CONSTRAINT foto_bukti_lokasi_unik UNIQUE (lokasi_berkas),
  CONSTRAINT foto_bukti_bersih_cek CHECK (
    dibersihkan_pada IS NULL OR dibersihkan_pada >= diunggah_pada
  )
);

-- Satu foto aktif (belum diganti) per order (FT2)
CREATE UNIQUE INDEX foto_bukti_aktif_unik
  ON public.foto_bukti (order_id) WHERE diganti = false;

-- Untuk daftar foto per order (tampilan detail) dan penyapuan `bersihkan` (berkas yang belum dibersihkan)
CREATE INDEX foto_bukti_order_idx
  ON public.foto_bukti (order_id, diunggah_pada DESC);
CREATE INDEX foto_bukti_belum_bersih_idx
  ON public.foto_bukti (diunggah_pada) WHERE dibersihkan_pada IS NULL;

-- ============================================================
-- 3. Bucket Storage privat (FT5, aturan keamanan 13).
--    Tanpa policy untuk aplikasi: tabel storage.objects tidak diubah di sini.
--    Batas ukuran 256 KB = 262144 byte; hanya JPEG dan WebP.
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('foto-bukti', 'foto-bukti', false, 262144, ARRAY['image/jpeg', 'image/webp']);

-- ============================================================
-- 4. RLS aktif, TANPA policy untuk aplikasi (AGENTS.md bagian 7)
-- ============================================================
ALTER TABLE public.foto_bukti ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. Hak: cabut SEMUA dulu (termasuk bawaan Supabase), lalu beri ulang
--    seminimal mungkin ke service_role. Tanpa DELETE. anon/authenticated nol.
-- ============================================================
REVOKE ALL ON TABLE public.foto_bukti FROM PUBLIC, anon, authenticated, service_role;

-- Baca, tambah, ubah (ubah dipakai untuk tanda `diganti` dan `dibersihkan_pada`)
GRANT SELECT, INSERT, UPDATE ON TABLE public.foto_bukti TO service_role;

COMMIT;
