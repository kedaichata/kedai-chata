-- supabase/migrations/20261114_gelar.sql
-- GLR.01: tabel gelar (aturan gelar), hak baca saja, RLS, dan satu baris pengaturan (gelar_apresiasi).
-- Dijalankan MANUAL di SQL Editor (akun ketua). Pembatalan: 20261114_gelar_batal.sql
-- Cek hasil: supabase/templates/20261114_gelar_cek.sql
-- Semua objek di sini BARU; tabel order, order_item, menu, dan data lama tidak disentuh.
-- Tabel dibuat KOSONG. Isi aturan (set demo, lalu angka asli) masuk lewat impor lembar `gelar-isi`
-- di SQL Editor (GLR.04); SQL impor itu adalah data dan tidak disimpan di repo (gelar.md GL14).
-- Fungsi SQL `gelar_saya` TIDAK dibuat di sini; itu GLR.02.
--
-- Keputusan yang berlaku (gelar.md):
--   - Tabel hanya menyimpan ATURAN, bukan hasil. Gelar customer dihitung server tiap diminta (GL8).
--   - Dua jenis: `tingkat` (dari total order Selesai) dan `menu` (dari order Selesai yang memuat menu itu) (GL1).
--   - Gelar menu merujuk ID menu (bukan nama), jadi mengganti nama menu tidak merusak gelar (GL12).
--     Terbukti di database hidup 14 Nov 2026: order_item.menu_id uuid, wajib terisi.
--   - Urutan tingkat ditentukan angka ambang; ambang tingkat AKTIF tidak boleh kembar (GL10).
--   - Tidak dihapus; yang tidak dipakai ditandai aktif = false (GL11).
--   - Pagar bentuk data di tabel (GL13) sebagai pagar kedua di samping kolom Cek lembar.
--   - service_role hanya BACA. Impor dari lembar dijalankan ketua di SQL Editor (peran pemilik),
--     jadi tidak butuh hak tulis (GL8, GL14).
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   - Kolom `kunci` format huruf kecil, angka, dan strip, 3 sampai 40 karakter, unik se-tabel
--     (dasar impor "tambah atau perbarui berdasarkan kunci", GL11).
--   - Nama dan deskripsi tanpa spasi di tepi dan tanpa karakter kontrol.
--   - `diubah_pada` diisi SQL impor (tidak ada trigger), mengikuti pola tabel menu.
--   - Tidak ada aturan "satu gelar aktif per menu"; GL5 hanya menyebut menu dan ambang, jadi dibiarkan terbuka.

BEGIN;

-- ============================================================
-- 1. gelar (GL8, GL10, GL12, GL13)
-- ============================================================
CREATE TABLE public.gelar (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  kunci       text        NOT NULL
    CONSTRAINT gelar_kunci_cek CHECK (
      char_length(kunci) BETWEEN 3 AND 40
      AND kunci ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ),
  jenis       text        NOT NULL
    CONSTRAINT gelar_jenis_cek CHECK (jenis IN ('tingkat', 'menu')),
  ambang      integer     NOT NULL
    CONSTRAINT gelar_ambang_cek CHECK (ambang >= 1),
  menu_id     uuid        REFERENCES public.menu (id),
  nama        text        NOT NULL
    CONSTRAINT gelar_nama_cek CHECK (
      char_length(nama) BETWEEN 3 AND 40
      AND nama = btrim(nama)
      AND nama !~ '[[:cntrl:]]'
    ),
  deskripsi   text        NOT NULL
    CONSTRAINT gelar_deskripsi_cek CHECK (
      char_length(deskripsi) BETWEEN 1 AND 120
      AND deskripsi = btrim(deskripsi)
      AND deskripsi !~ '[[:cntrl:]]'
    ),
  aktif       boolean     NOT NULL DEFAULT true,
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  diubah_pada timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT gelar_kunci_unik UNIQUE (kunci),

  -- Menu wajib terisi untuk jenis menu, dan kosong untuk jenis tingkat (GL13)
  CONSTRAINT gelar_jenis_menu_cek CHECK (
    (jenis = 'menu'    AND menu_id IS NOT NULL)
    OR (jenis = 'tingkat' AND menu_id IS NULL)
  )
);

-- Ambang tingkat AKTIF tidak boleh kembar (GL10). Tingkat nonaktif dan gelar menu tidak kena aturan ini.
CREATE UNIQUE INDEX gelar_tingkat_ambang_aktif_uniq
  ON public.gelar (ambang) WHERE jenis = 'tingkat' AND aktif;

-- Dipakai fungsi gelar_saya (GLR.02) untuk mencari gelar menu aktif per menu
CREATE INDEX gelar_menu_aktif_idx
  ON public.gelar (menu_id) WHERE jenis = 'menu' AND aktif;

-- ============================================================
-- 2. RLS aktif, TANPA policy untuk aplikasi (AGENTS.md bagian 7)
-- ============================================================
ALTER TABLE public.gelar ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Hak: cabut SEMUA dulu (termasuk bawaan Supabase), lalu beri ulang
--    seminimal mungkin ke service_role. Hanya BACA. Tanpa DELETE. anon/authenticated nol.
-- ============================================================
REVOKE ALL ON TABLE public.gelar FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT ON TABLE public.gelar TO service_role;

-- ============================================================
-- 4. Satu baris pengaturan: kalimat apresiasi untuk semua gelar (GL16).
--    Diubah ketua lewat SQL Editor; banner lama tidak ikut berubah.
-- ============================================================
INSERT INTO public.pengaturan (kunci, nilai, keterangan)
VALUES (
  'gelar_apresiasi',
  'Terima kasih sudah jadi bagian dari keluarga Kedai ChATA. Sampai jumpa di pesanan berikutnya!',
  'Kalimat apresiasi di banner gelar, satu untuk semua gelar (GL16)'
);

COMMIT;
