-- supabase/migrations/20261111_05_inbox.sql
-- INB.01: tabel inbox, dua baris pengaturan inbox, hak minimal, dan RLS.
-- Dijalankan MANUAL di SQL Editor (akun ketua). Pembatalan: 20261111_05_inbox_batal.sql
-- Cek hasil: supabase/templates/20261111_05_inbox_cek.sql
-- Tanpa data nyata. Semua objek di sini BARU; tabel order, foto_bukti, dan tabel lain tidak disentuh.
-- Fungsi SQL (`inbox_tulis`, `inbox_daftar`), aksi `kedai`, dan layar Kotak masuk dikerjakan di
-- INB.02 sampai INB.05 (bukan di berkas ini). Template hapus inbox lama dikerjakan di INB.06.
--
-- Yang BARU:
--   - tabel `public.inbox`
--   - baris pengaturan `inbox_simpan_hari` dan `inbox_maks_tampil`
--
-- Keputusan yang berlaku (inbox.md dan database.md):
--   - Satu baris per kejadian per penerima (IB3). Teks umum tanpa data pribadi (IB4, aturan 16).
--   - Waktu dari jam server (IB5). Lama tampil dari pengaturan `inbox_simpan_hari` (IB6).
--   - `service_role` HANYA baca dan tambah: tanpa UPDATE (status dibaca ada di HP, IB8) dan
--     tanpa DELETE (pembersihan manual oleh ketua di dashboard, IB7). Tidak ada pengecualian DELETE baru.
--   - Nomor berjalan (`id`) naik terus dan dipakai penanda lokal di HP (IB8, IB10).
--
-- Keputusan ketua 11 Nov 2026:
--   - `inbox_maks_tampil` = 30 (nilai awal batas jumlah item per tampilan, IB15; sebelumnya "bawaan").
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   - Nama tabel `inbox`; nama kolom `penerima`, `teks`, `nomor_order`, `waktu`.
--   - `penerima` merujuk `auth.users` (penerima bisa customer atau staf; hanya customer punya profil),
--     sama seperti `penulis` di `catatan_order`.
--   - `nomor_order` menyimpan NOMOR berjalan order (bukan id), merujuk kolom unik `order.nomor`.
--     Kosong bila kabar tidak terkait order. Item tidak bisa diketuk (IB5), jadi tidak ada kolom id order.
--   - `teks` 1 sampai 200 karakter, tanpa spasi di tepi dan tanpa karakter kontrol.
--   - Batas jumlah tampil (`inbox_maks_tampil`) dijaga fungsi `inbox_daftar` (INB.02), bukan tabel.
--   - Catatan: nomor identity dibagi saat INSERT, bukan saat commit. Pada permintaan yang sangat
--     bersamaan, satu item bisa terlihat telat satu pembukaan. Dampaknya hanya tampilan, dan dianggap
--     wajar untuk skala warung.

BEGIN;

-- ============================================================
-- 1. Pengaturan baru (database.md bagian 4: angka yang bisa berubah ada di database)
-- ============================================================
INSERT INTO public.pengaturan (kunci, nilai, keterangan)
VALUES
  ('inbox_simpan_hari', '14', 'Lama item Kotak masuk tampil, dalam hari (IB6)'),
  ('inbox_maks_tampil', '30', 'Batas jumlah item Kotak masuk per tampilan; belum dibaca didahulukan (IB15)');

-- ============================================================
-- 2. inbox (IB1, IB3): satu baris per kejadian per penerima.
--    Tidak diubah dan tidak dihapus oleh aplikasi. Dibersihkan manual oleh ketua (IB7).
-- ============================================================
CREATE TABLE public.inbox (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  penerima    uuid        NOT NULL REFERENCES auth.users (id),
  teks        text        NOT NULL
    CONSTRAINT inbox_teks_cek CHECK (
      char_length(teks) BETWEEN 1 AND 200
      AND teks = btrim(teks)
      AND teks !~ '[[:cntrl:]]'
    ),
  nomor_order integer     REFERENCES public."order" (nomor),
  waktu       timestamptz NOT NULL DEFAULT now()
);

-- Untuk daftar per penerima (terbaru dulu) dan angka inbox terbaru saat aplikasi dibuka
CREATE INDEX inbox_penerima_idx
  ON public.inbox (penerima, id DESC);

-- ============================================================
-- 3. RLS aktif, TANPA policy untuk aplikasi (AGENTS.md bagian 7)
-- ============================================================
ALTER TABLE public.inbox ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. Hak: cabut SEMUA dulu (termasuk bawaan Supabase), lalu beri ulang
--    seminimal mungkin ke service_role. Tanpa UPDATE dan tanpa DELETE. anon/authenticated nol.
-- ============================================================
REVOKE ALL ON TABLE public.inbox FROM PUBLIC, anon, authenticated, service_role;

-- Baca dan tambah saja
GRANT SELECT, INSERT ON TABLE public.inbox TO service_role;

-- Urutan nomor otomatis (`id`): tidak ada hak untuk siapa pun.
-- Fungsi SQL (SECURITY DEFINER, dimiliki pemilik) yang mengisinya, bukan peran aplikasi.
DO $$
DECLARE
  v_seq text := pg_get_serial_sequence('public.inbox', 'id');
BEGIN
  EXECUTE format(
    'REVOKE ALL ON SEQUENCE %s FROM PUBLIC, anon, authenticated, service_role',
    v_seq
  );
END;
$$;

COMMIT;
