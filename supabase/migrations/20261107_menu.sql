-- supabase/migrations/20261107_menu.sql
-- MNU.01: tabel menu, hak minimal, RLS, dan satu baris pengaturan (harga_maks_menu).
-- Dijalankan MANUAL di SQL Editor (akun ketua). Pembatalan: 20261107_menu_batal.sql
-- Cek hasil: supabase/templates/20261107_menu_cek.sql
-- Semua objek di sini BARU; tidak ada tabel atau data lama yang disentuh.
-- Tanpa data nyata. Satu-satunya data: baris awal pengaturan harga_maks_menu.
-- Fungsi SQL menu (simpan, stok, nonaktif) TIDAK dibuat di sini; itu MNU.02.
--
-- Keputusan yang berlaku (menu.md bagian 9, 7 Nov 2026):
--   - Foto di public/img: kolom `foto` berisi NAMA BERKAS saja, bukan alamat Storage.
--   - Nama kembar ditolak di antara menu aktif (huruf besar/kecil dianggap sama).
--   - Pagar kedua di tabel: harga > 0, nama 3-40 karakter.
--   - Batas harga atas (harga_maks_menu) dijaga fungsi MNU.02, bukan tabel.
-- Catatan untuk MNU.02: `diubah_pada` dan `diubah_oleh` diisi fungsi (tidak ada trigger).
--   Pelanggaran indeks nama kembar (unique_violation) harus dipetakan ke satu kode galat
--   aman, termasuk saat menu nonaktif diaktifkan kembali dan namanya sudah dipakai menu aktif.

BEGIN;

-- ============================================================
-- 1. menu (MN2, MN3): tidak dihapus, hanya dinonaktifkan
-- ============================================================
CREATE TABLE public.menu (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        text NOT NULL
    CONSTRAINT menu_nama_cek CHECK (
      char_length(nama) BETWEEN 3 AND 40
      AND nama !~ '^\s'      -- tanpa spasi di awal
      AND nama !~ '\s$'      -- tanpa spasi di akhir
      AND nama !~ '\s\s'     -- tanpa spasi ganda (supaya cek nama kembar andal)
    ),
  harga       integer NOT NULL
    CONSTRAINT menu_harga_cek CHECK (harga > 0),
  tersedia    boolean NOT NULL DEFAULT true,
  aktif       boolean NOT NULL DEFAULT true,
  foto        text
    CONSTRAINT menu_foto_cek CHECK (
      foto IS NULL
      OR (
        char_length(foto) <= 60
        AND foto ~ '^[a-z0-9]+(-[a-z0-9]+)*\.(jpg|webp)$'
      )
    ),
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  diubah_pada timestamptz NOT NULL DEFAULT now(),
  diubah_oleh uuid NOT NULL REFERENCES public.staf (id)
);

-- Nama kembar ditolak hanya di antara menu AKTIF (menu nonaktif boleh sama).
-- Indeks ini juga dipakai untuk urutan bawaan daftar menu: nama A sampai Z.
CREATE UNIQUE INDEX menu_nama_aktif_uniq ON public.menu (lower(nama)) WHERE aktif;

-- ============================================================
-- 2. RLS aktif, TANPA policy untuk aplikasi (AGENTS.md bagian 7)
-- ============================================================
ALTER TABLE public.menu ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Hak: cabut SEMUA dulu (termasuk bawaan Supabase), lalu beri ulang
--    seminimal mungkin ke service_role. Tanpa DELETE. anon/authenticated nol.
-- ============================================================
REVOKE ALL ON TABLE public.menu FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.menu TO service_role;

-- ============================================================
-- 4. Nilai awal pengaturan (MN2 "batas wajar", database.md bagian 4)
-- ============================================================
INSERT INTO public.pengaturan (kunci, nilai, keterangan)
VALUES ('harga_maks_menu', '200000', 'Batas atas harga satu menu, rupiah (MN2)');

COMMIT;
