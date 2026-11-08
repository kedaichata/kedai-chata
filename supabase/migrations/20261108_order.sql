-- supabase/migrations/20261108_order.sql
-- ORD.01: tabel order dan turunannya (order, order_item, riwayat_status, catatan_order, baca_catatan,
-- pelanggan_luar), empat baris pengaturan baru, hak minimal, dan RLS.
-- Dijalankan MANUAL di SQL Editor (akun ketua). Pembatalan: 20261108_order_batal.sql
-- Cek hasil: supabase/templates/20261108_order_cek.sql
-- Tanpa data nyata. Semua objek di sini BARU; tabel akun, menu, dan grup pilihan tidak disentuh.
-- Fungsi SQL dan aksi `kedai` untuk order dikerjakan di ORD.02 dan seterusnya (bukan di berkas ini).
--
-- Yang BARU:
--   - tabel `public.pelanggan_luar`, `public."order"`, `public.order_item`, `public.riwayat_status`,
--     `public.catatan_order`, `public.baca_catatan`
--   - baris pengaturan `item_maks_per_order`, `jumlah_maks_per_item`, `catatan_maks_karakter`,
--     `catatan_maks_per_order`
--
-- Catatan nama tabel: `order` adalah kata yang dipakai SQL sendiri, jadi di SQL selalu ditulis
-- dengan tanda kutip ganda: public."order". Nama tabelnya tetap `order` sesuai dokumen. Fungsi ORD.02
-- dan seterusnya wajib menulisnya begitu juga.
--
-- Keputusan yang berlaku (order.md dan database.md):
--   - Nomor order berjalan terus, tidak di-reset (O18). Dibuat otomatis oleh database.
--   - Order, item, catatan, dan riwayat TIDAK dihapus (O17); `service_role` tanpa DELETE.
--   - Nama, harga, alamat, dan pilihan menu DISALIN ke order, bukan merujuk data terbaru (O3, O4).
--   - Pilihan menu disimpan sebagai SATU kolom daftar teks di `order_item` (blok order.md 7 Nov 2026
--     "Item order menyimpan pilihan menu"; bentuk kolom disetujui ketua 8 Nov 2026).
--     Tiap isi berformat "Nama grup: Nama opsi". Item sama dengan pilihan beda = baris terpisah,
--     jadi tidak ada aturan unik pada (order, menu).
--   - Hari antar dan jam dihitung/diperiksa fungsi (jam server), bukan tabel (aturan 6).
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   - Nomor order mulai dari 1. Order uji ikut memakai nomor; mereset nomor sebelum peluncuran
--     menjadi bagian pembersihan LNC.01 (butuh "OK" ketua).
--   - Pelanggan tanpa akun: nama 3 sampai 30 karakter, keterangan 3 sampai 100 (opsional).
--   - Jam permintaan wajib diisi (NOT NULL), disimpan sebagai jam saja. Melonggarkannya kelak mudah;
--     mengetatkannya kelak yang sulit, karena itu dimulai ketat.
--   - Pagar bentuk antar-kolom (misalnya: order yang belum Disetujui tidak boleh punya metode bayar,
--     order wakil harus punya pembuat, alamat hanya untuk tipe Diantar) dipasang di tabel sebagai
--     pagar kedua di samping fungsi.
--   - Batas panjang atas catatan TIDAK ada di tabel; dijaga fungsi dari pengaturan.
--   - Kolom pemutus dan waktu diputuskan juga diisi untuk order wakil (owner pembuat = pemutus).
--
-- Kode galat baru dan fungsi: tidak ada di berkas ini.

BEGIN;

-- ============================================================
-- 1. Pengaturan baru (database.md bagian 4: angka yang bisa berubah ada di database)
-- ============================================================
INSERT INTO public.pengaturan (kunci, nilai, keterangan)
VALUES
  ('item_maks_per_order',    '10',  'Batas baris item dalam satu order (O3)'),
  ('jumlah_maks_per_item',   '10',  'Batas jumlah per baris item (O3)'),
  ('catatan_maks_karakter',  '200', 'Batas karakter satu catatan order (O12)'),
  ('catatan_maks_per_order', '10',  'Batas banyak catatan dalam satu order (O12)');

-- ============================================================
-- 2. pelanggan_luar (O16): pelanggan tanpa akun, dikelola owner.
--    Tidak dihapus, hanya dinonaktifkan. Data pribadi.
-- ============================================================
CREATE TABLE public.pelanggan_luar (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nama         text        NOT NULL
    CONSTRAINT pelanggan_luar_nama_cek CHECK (
      char_length(nama) BETWEEN 3 AND 30
      AND nama = btrim(nama)
      AND nama !~ '[[:cntrl:]]'
    ),
  keterangan   text
    CONSTRAINT pelanggan_luar_keterangan_cek CHECK (
      keterangan IS NULL
      OR (char_length(keterangan) BETWEEN 3 AND 100 AND keterangan = btrim(keterangan))
    ),
  nomor_wa     text
    CONSTRAINT pelanggan_luar_wa_cek CHECK (
      nomor_wa IS NULL OR nomor_wa ~ '^628[0-9]{8,11}$'
    ),
  alamat_antar text
    CONSTRAINT pelanggan_luar_alamat_cek CHECK (
      alamat_antar IS NULL OR char_length(alamat_antar) BETWEEN 10 AND 200
    ),
  aktif        boolean     NOT NULL DEFAULT true,
  dibuat_oleh  uuid        NOT NULL REFERENCES public.staf (id),
  dibuat_pada  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. order (O1 sampai O23): satu baris per order. Status hanya diubah fungsi SQL.
--    Pemesan = akun customer (pemesan) ATAU pelanggan tanpa akun (pelanggan_luar_id), tepat salah satu.
-- ============================================================
CREATE TABLE public."order" (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor            integer     GENERATED ALWAYS AS IDENTITY,
  pemesan          uuid        REFERENCES public.profil (id),
  pelanggan_luar_id uuid       REFERENCES public.pelanggan_luar (id),
  nama_pemesan     text        NOT NULL,
  nomor_wa_pemesan text,
  tipe             text        NOT NULL,
  hari_target      date        NOT NULL,
  jam_permintaan   time        NOT NULL,
  alias_alamat     text,
  isi_alamat       text,
  total            integer     NOT NULL,
  status           text        NOT NULL DEFAULT 'Menunggu',
  metode_bayar     text,
  pemutus          uuid        REFERENCES public.staf (id),
  pemutus_nama     text,
  diputuskan_pada  timestamptz,
  alasan_tolak     text,
  dibuat_oleh      uuid        REFERENCES public.staf (id),
  dibuat_oleh_nama text,
  dibuat_pada      timestamptz NOT NULL DEFAULT now(),
  diubah_pada      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT order_nomor_unik UNIQUE (nomor),

  -- Tepat satu jenis pemesan (akun atau pelanggan tanpa akun)
  CONSTRAINT order_pemesan_cek CHECK ((pemesan IS NULL) <> (pelanggan_luar_id IS NULL)),

  -- Order wakil (pelanggan tanpa akun) wajib punya pembuat owner; order customer tidak (O15)
  CONSTRAINT order_wakil_cek CHECK (
    (pelanggan_luar_id IS NULL AND dibuat_oleh IS NULL AND dibuat_oleh_nama IS NULL)
    OR (pelanggan_luar_id IS NOT NULL AND dibuat_oleh IS NOT NULL AND dibuat_oleh_nama IS NOT NULL)
  ),

  CONSTRAINT order_nama_cek   CHECK (char_length(nama_pemesan) BETWEEN 3 AND 30),
  CONSTRAINT order_wa_cek     CHECK (nomor_wa_pemesan IS NULL OR nomor_wa_pemesan ~ '^628[0-9]{8,11}$'),
  CONSTRAINT order_tipe_cek   CHECK (tipe IN ('Diantar', 'Diambil', 'Makan di warung')),
  CONSTRAINT order_status_cek CHECK (status IN (
    'Menunggu', 'Disetujui', 'Diproses', 'Diantar', 'Siap diambil', 'Siap disajikan',
    'Selesai', 'Ditolak', 'Dibatalkan'
  )),
  CONSTRAINT order_metode_nilai_cek CHECK (metode_bayar IS NULL OR metode_bayar IN ('Transfer', 'Tunai', 'QRIS')),
  CONSTRAINT order_total_cek  CHECK (total >= 0),

  -- Alamat hanya untuk tipe Diantar (O4); alias boleh kosong (order wakil tidak punya alias)
  CONSTRAINT order_alamat_cek CHECK (
    (tipe = 'Diantar' AND isi_alamat IS NOT NULL)
    OR (tipe <> 'Diantar' AND isi_alamat IS NULL AND alias_alamat IS NULL)
  ),
  CONSTRAINT order_alias_cek  CHECK (alias_alamat IS NULL OR char_length(alias_alamat) BETWEEN 3 AND 30),
  CONSTRAINT order_isi_cek    CHECK (isi_alamat IS NULL OR char_length(isi_alamat) BETWEEN 10 AND 200),

  -- Metode bayar ada tepat saat order sudah Disetujui ke atas (O6)
  CONSTRAINT order_metode_status_cek CHECK (
    (metode_bayar IS NULL AND status IN ('Menunggu', 'Ditolak', 'Dibatalkan'))
    OR (metode_bayar IS NOT NULL AND status NOT IN ('Menunggu', 'Ditolak', 'Dibatalkan'))
  ),

  -- Pemutus (owner yang memutuskan) ada tepat saat order sudah diputuskan: Ditolak atau Disetujui ke atas (O7)
  CONSTRAINT order_pemutus_cek CHECK (
    (pemutus IS NULL AND pemutus_nama IS NULL AND diputuskan_pada IS NULL
       AND status IN ('Menunggu', 'Dibatalkan'))
    OR (pemutus IS NOT NULL AND pemutus_nama IS NOT NULL AND diputuskan_pada IS NOT NULL
       AND status NOT IN ('Menunggu', 'Dibatalkan'))
  ),

  -- Alasan tolak hanya pada order Ditolak, maksimal 200 karakter (O8)
  CONSTRAINT order_alasan_cek CHECK (
    alasan_tolak IS NULL
    OR (status = 'Ditolak'
        AND char_length(alasan_tolak) BETWEEN 1 AND 200
        AND alasan_tolak = btrim(alasan_tolak))
  )
);

CREATE INDEX order_pemesan_idx
  ON public."order" (pemesan, dibuat_pada DESC) WHERE pemesan IS NOT NULL;
CREATE INDEX order_hari_status_idx
  ON public."order" (hari_target, status);
CREATE INDEX order_pelanggan_luar_idx
  ON public."order" (pelanggan_luar_id) WHERE pelanggan_luar_id IS NOT NULL;

-- ============================================================
-- 4. order_item (O3): isi order. Tidak diubah setelah dibuat.
--    Nama, harga, dan pilihan adalah SALINAN. `pilihan` berisi teks "Nama grup: Nama opsi".
-- ============================================================
CREATE TABLE public.order_item (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid    NOT NULL REFERENCES public."order" (id),
  menu_id       uuid    NOT NULL REFERENCES public.menu (id),
  nama_menu     text    NOT NULL
    CONSTRAINT order_item_nama_cek CHECK (char_length(nama_menu) BETWEEN 1 AND 100),
  harga_satuan  integer NOT NULL
    CONSTRAINT order_item_harga_cek CHECK (harga_satuan >= 0),
  jumlah        integer NOT NULL
    CONSTRAINT order_item_jumlah_cek CHECK (jumlah >= 1),
  subtotal      integer NOT NULL,
  pilihan       text[]  NOT NULL DEFAULT '{}',
  CONSTRAINT order_item_subtotal_cek CHECK (subtotal = harga_satuan * jumlah),
  CONSTRAINT order_item_pilihan_cek CHECK (array_position(pilihan, NULL) IS NULL)
);

CREATE INDEX order_item_order_idx ON public.order_item (order_id);

-- ============================================================
-- 5. riwayat_status (O10): hanya tambah. Mencatat status dan koreksi metode bayar.
--    status_asal kosong pada baris pertama (order baru). `oleh` = id akun (customer atau staf).
-- ============================================================
CREATE TABLE public.riwayat_status (
  id            bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id      uuid        NOT NULL REFERENCES public."order" (id),
  status_asal   text,
  status_tujuan text        NOT NULL,
  oleh          uuid        NOT NULL REFERENCES auth.users (id),
  waktu         timestamptz NOT NULL DEFAULT now(),
  keterangan    text,
  CONSTRAINT riwayat_asal_cek CHECK (status_asal IS NULL OR status_asal IN (
    'Menunggu', 'Disetujui', 'Diproses', 'Diantar', 'Siap diambil', 'Siap disajikan',
    'Selesai', 'Ditolak', 'Dibatalkan'
  )),
  CONSTRAINT riwayat_tujuan_cek CHECK (status_tujuan IN (
    'Menunggu', 'Disetujui', 'Diproses', 'Diantar', 'Siap diambil', 'Siap disajikan',
    'Selesai', 'Ditolak', 'Dibatalkan'
  )),
  CONSTRAINT riwayat_keterangan_cek CHECK (keterangan IS NULL OR char_length(keterangan) BETWEEN 1 AND 200)
);

CREATE INDEX riwayat_status_order_idx ON public.riwayat_status (order_id, id);

-- ============================================================
-- 6. catatan_order (O12): catatan berlapis, hanya tambah, tidak bisa diedit atau dihapus.
--    Batas panjang atas dijaga fungsi dari pengaturan `catatan_maks_karakter`, bukan tabel.
-- ============================================================
CREATE TABLE public.catatan_order (
  id           bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id     uuid        NOT NULL REFERENCES public."order" (id),
  penulis      uuid        NOT NULL REFERENCES auth.users (id),
  nama_penulis text        NOT NULL
    CONSTRAINT catatan_nama_cek CHECK (char_length(nama_penulis) BETWEEN 3 AND 30),
  peran_penulis text       NOT NULL
    CONSTRAINT catatan_peran_cek CHECK (peran_penulis IN ('customer', 'owner')),
  isi          text        NOT NULL
    CONSTRAINT catatan_isi_cek CHECK (isi <> '' AND isi = btrim(isi)),
  waktu        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX catatan_order_order_idx ON public.catatan_order (order_id, id);

-- ============================================================
-- 7. baca_catatan (O14): catatan terakhir yang sudah dibaca per akun per order.
--    Dasar tanda "Catatan baru" di kartu order. Satu baris per (akun, order).
-- ============================================================
CREATE TABLE public.baca_catatan (
  akun                uuid        NOT NULL REFERENCES auth.users (id),
  order_id            uuid        NOT NULL REFERENCES public."order" (id),
  catatan_terakhir_id bigint      NOT NULL REFERENCES public.catatan_order (id),
  waktu               timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (akun, order_id)
);

-- ============================================================
-- 8. RLS aktif, TANPA policy untuk aplikasi (AGENTS.md bagian 7)
-- ============================================================
ALTER TABLE public.pelanggan_luar  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."order"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riwayat_status  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catatan_order   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baca_catatan    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. Hak: cabut SEMUA dulu (termasuk bawaan Supabase), lalu beri ulang
--    seminimal mungkin ke service_role. Tanpa DELETE. anon/authenticated nol.
-- ============================================================
REVOKE ALL ON TABLE public.pelanggan_luar FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."order"        FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.order_item     FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.riwayat_status FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.catatan_order  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.baca_catatan   FROM PUBLIC, anon, authenticated, service_role;

-- Baca dan tambah (tanpa hak ubah)
GRANT SELECT, INSERT ON TABLE public.order_item     TO service_role;
GRANT SELECT, INSERT ON TABLE public.riwayat_status TO service_role;
GRANT SELECT, INSERT ON TABLE public.catatan_order  TO service_role;

-- Baca, tambah, ubah (tanpa DELETE)
GRANT SELECT, INSERT, UPDATE ON TABLE public."order"        TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.baca_catatan   TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.pelanggan_luar TO service_role;

-- Urutan nomor otomatis (nomor order, id riwayat, id catatan): tidak ada hak untuk siapa pun.
-- Fungsi SQL (SECURITY DEFINER, dimiliki pemilik) yang mengisinya, bukan peran aplikasi.
DO $$
DECLARE
  v_seq text;
BEGIN
  FOREACH v_seq IN ARRAY ARRAY[
    pg_get_serial_sequence('public."order"', 'nomor'),
    pg_get_serial_sequence('public.riwayat_status', 'id'),
    pg_get_serial_sequence('public.catatan_order', 'id')
  ]
  LOOP
    EXECUTE format(
      'REVOKE ALL ON SEQUENCE %s FROM PUBLIC, anon, authenticated, service_role',
      v_seq
    );
  END LOOP;
END;
$$;

COMMIT;
