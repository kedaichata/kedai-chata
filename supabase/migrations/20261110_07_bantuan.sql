-- supabase/migrations/20261110_07_bantuan.sql
-- BTN.01: tabel `bantuan` (isi layar Bantuan, bantuan.md BT2, BT3, BT6, BT8, BT10).
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo.
-- Pembatalan: 20261110_07_bantuan_batal.sql
-- Cek hasil:  supabase/templates/20261110_07_bantuan_cek.sql
-- Tabel BARU dan kosong. Tidak ada tabel, fungsi, atau data lama yang disentuh.
-- Tanpa data nyata. Aksi `bantuan_daftar` (BTN.02) dan layarnya (BTN.03) dikerjakan terpisah.
--
-- Hak: service_role HANYA SELECT (BT8). Isi diisi ketua lewat SQL Editor (impor dari lembar, BTN.04),
-- yang berjalan sebagai pemilik database, jadi tidak butuh hak tulis untuk service_role.
-- Tanpa DELETE: isi yang tidak dipakai ditandai aktif = false (BT6).
-- Impor dari lembar memakai tambah-atau-perbarui berdasarkan `kunci` (ON CONFLICT (kunci)).
--
-- Pilihan penulis (alasan belum tercatat dari ketua; boleh diubah sebelum dijalankan):
--   - `kunci`: huruf kecil, angka, dan strip, 3 sampai 50 karakter (contoh `memulai-01`).
--   - `bagian`: tidak kosong, maksimal 60 karakter. `urutan`: bilangan bulat 0 atau lebih.
--   - `judul` dan `isi` hanya dicek panjangnya (BT10), tanpa syarat spasi di tepi, supaya SQL dari lembar
--     tidak gagal karena baris baru di ujung sel.
--   - `diubah_pada` bawaan now(); SQL impor yang memperbaruinya saat baris berubah.
--   - Tanpa indeks tambahan: tabel kecil (sekitar 100 baris), `kunci` sudah punya indeks unik.

BEGIN;

CREATE TABLE public.bantuan (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kunci       text NOT NULL
    CONSTRAINT bantuan_kunci_unik UNIQUE
    CONSTRAINT bantuan_kunci_cek CHECK (
      char_length(kunci) BETWEEN 3 AND 50
      AND kunci ~ '^[a-z0-9-]+$'
    ),
  bagian      text NOT NULL
    CONSTRAINT bantuan_bagian_cek CHECK (
      char_length(btrim(bagian)) >= 1
      AND char_length(bagian) <= 60
    ),
  urutan      integer NOT NULL
    CONSTRAINT bantuan_urutan_cek CHECK (urutan >= 0),
  peran       text NOT NULL
    CONSTRAINT bantuan_peran_cek CHECK (peran IN ('semua', 'customer', 'owner', 'penjaga')),
  judul       text NOT NULL
    CONSTRAINT bantuan_judul_cek CHECK (char_length(judul) BETWEEN 5 AND 120),
  isi         text NOT NULL
    CONSTRAINT bantuan_isi_cek CHECK (char_length(isi) BETWEEN 1 AND 2000),
  aktif       boolean NOT NULL DEFAULT true,
  diubah_pada timestamptz NOT NULL DEFAULT now()
);

-- RLS aktif, TANPA policy untuk aplikasi (AGENTS.md bagian 7)
ALTER TABLE public.bantuan ENABLE ROW LEVEL SECURITY;

-- Cabut SEMUA dulu (termasuk bawaan Supabase), lalu beri ulang hanya baca ke service_role (BT8).
REVOKE ALL ON TABLE public.bantuan FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.bantuan TO service_role;

COMMIT;
