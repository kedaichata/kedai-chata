-- supabase/migrations/20261118_02_belanja.sql
-- BLJ.01: tabel belanja dan belanja_item, lima baris pengaturan baru, RLS, dan hak minimal.
-- Dijalankan MANUAL di SQL Editor (akun ketua). Pembatalan: 20261118_02_belanja_batal.sql
-- Cek hasil: supabase/templates/20261118_02_belanja_cek.sql
-- Tanpa data nyata. Semua objek di sini BARU; tabel lain, fungsi, dan data lama tidak disentuh.
-- Fungsi SQL dan aksi `kedai` untuk belanja dikerjakan di BLJ.02 dan BLJ.03 (bukan di berkas ini).
-- Berkas ini berdiri sendiri: tidak perlu deploy `kedai` lebih dulu.
--
-- Yang BARU:
--   - tabel `public.belanja` (satu catatan belanja) dan `public.belanja_item` (item di dalamnya)
--   - baris pengaturan `belanja_harga_maks`, `belanja_nama_maks`, `belanja_judul_maks`,
--     `belanja_item_maks`, `belanja_terkunci_tampil`
--
-- Keputusan yang berlaku (belanja.md):
--   - BL1/BL7: hanya owner, dan hanya penginput yang mengubah catatannya. Dicek di fungsi (BLJ.02),
--     bukan di tabel.
--   - BL3/BL4: item = nama + harga. Harga bilangan bulat rupiah, minimal 1. Total tidak disimpan;
--     server selalu menghitungnya dari item yang tidak dibatalkan.
--   - BL5: judul tidak boleh kosong DI TABEL. Judul kosong dari layar diisi fungsi (tanggal dan nama
--     penginput) sebelum disimpan.
--   - BL8: tanpa DELETE. Item yang salah ditandai `dibatalkan`.
--   - BL9: kunci satu arah. `dikunci_pada` kosong = belum terkunci. Aturan "terkunci tidak bisa
--     diubah" dijaga fungsi; tabel hanya memastikan waktu kunci tidak lebih awal dari waktu dibuat.
--   - Batas panjang nama/judul, harga atas, jumlah item, dan jumlah terkunci tampil ada di
--     `pengaturan` dan dijaga fungsi, bukan tabel (database.md bagian 4).
--
-- Pilihan penulis (alasan belum tercatat dari ketua; "OK" ketua 18 Nov 2026 untuk rancangan ini):
--   - Nama penginput DISALIN ke `belanja` (seperti `order` menyalin nama pemesan), 3 sampai 30 karakter.
--   - Tanda dibatalkan cukup satu boolean, tanpa mencatat siapa dan kapan.
--   - Id memakai uuid, tanpa nomor urut otomatis.

BEGIN;

-- ============================================================
-- 1. Pengaturan baru (angka yang bisa berubah ada di database)
-- ============================================================
INSERT INTO public.pengaturan (kunci, nilai, keterangan)
VALUES
  ('belanja_harga_maks',      '5000000', 'Batas harga satu item belanja, rupiah (BL4)'),
  ('belanja_nama_maks',       '60',      'Batas karakter nama item belanja (BL3)'),
  ('belanja_judul_maks',      '60',      'Batas karakter judul catatan belanja (BL5)'),
  ('belanja_item_maks',       '50',      'Batas jumlah item dalam satu catatan belanja (BL2)'),
  ('belanja_terkunci_tampil', '10',      'Jumlah catatan terkunci yang ditampilkan bila saklar dinyalakan (BL12)');

-- ============================================================
-- 2. belanja: satu catatan = wadah belanja (BL2). Tidak dihapus.
-- ============================================================
CREATE TABLE public.belanja (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  judul         text        NOT NULL
    CONSTRAINT belanja_judul_cek CHECK (
      judul <> ''
      AND judul = btrim(judul)
      AND judul !~ '[[:cntrl:]]'
    ),
  penginput     uuid        NOT NULL REFERENCES public.staf (id),
  nama_penginput text       NOT NULL
    CONSTRAINT belanja_nama_penginput_cek CHECK (
      char_length(nama_penginput) BETWEEN 3 AND 30
      AND nama_penginput = btrim(nama_penginput)
      AND nama_penginput !~ '[[:cntrl:]]'
    ),
  dibuat_pada   timestamptz NOT NULL DEFAULT now(),
  dikunci_pada  timestamptz,
  CONSTRAINT belanja_kunci_cek CHECK (dikunci_pada IS NULL OR dikunci_pada >= dibuat_pada)
);

CREATE INDEX belanja_penginput_idx ON public.belanja (penginput);
CREATE INDEX belanja_belum_kunci_idx ON public.belanja (dibuat_pada DESC) WHERE dikunci_pada IS NULL;
CREATE INDEX belanja_terkunci_idx ON public.belanja (dikunci_pada DESC) WHERE dikunci_pada IS NOT NULL;

-- ============================================================
-- 3. belanja_item: isi catatan (BL3). Salah input = dibatalkan, bukan dihapus (BL8).
-- ============================================================
CREATE TABLE public.belanja_item (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  belanja_id    uuid        NOT NULL REFERENCES public.belanja (id),
  nama          text        NOT NULL
    CONSTRAINT belanja_item_nama_cek CHECK (
      nama <> ''
      AND nama = btrim(nama)
      AND nama !~ '[[:cntrl:]]'
    ),
  harga         integer     NOT NULL
    CONSTRAINT belanja_item_harga_cek CHECK (harga >= 1),
  dibatalkan    boolean     NOT NULL DEFAULT false,
  ditambah_pada timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX belanja_item_belanja_idx ON public.belanja_item (belanja_id, ditambah_pada);

-- ============================================================
-- 4. RLS aktif, TANPA policy untuk aplikasi (AGENTS.md bagian 7)
-- ============================================================
ALTER TABLE public.belanja      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belanja_item ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. Hak: cabut SEMUA dulu (termasuk bawaan Supabase), lalu beri ulang
--    seminimal mungkin ke service_role. Tanpa DELETE. anon/authenticated nol.
-- ============================================================
REVOKE ALL ON TABLE public.belanja      FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.belanja_item FROM PUBLIC, anon, authenticated, service_role;

-- Baca, tambah, ubah (tanpa DELETE)
GRANT SELECT, INSERT, UPDATE ON TABLE public.belanja      TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.belanja_item TO service_role;

COMMIT;
