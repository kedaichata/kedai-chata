-- supabase/migrations/20261108_03_order_batal_fungsi_batal.sql
-- Membatalkan 20261108_03_order_batal_fungsi.sql: hapus fungsi `order_batal` dan pasang kembali
-- tiga pagar lama di tabel `order` (persis seperti di 20261108_order.sql).
-- PERINGATAN: bila sudah ada order Dibatalkan yang punya metode bayar, pemutus, atau alasan,
-- pemasangan pagar lama GAGAL dan seluruh pembatalan ini dibatalkan otomatis (tidak ada yang berubah).
-- Dalam keadaan itu, jangan hapus data; laporkan ke ketua.
-- Dijalankan MANUAL di SQL Editor (akun ketua), butuh "OK" ketua.

BEGIN;

DROP FUNCTION public.order_batal(uuid, uuid, text);

ALTER TABLE public."order"
  DROP CONSTRAINT order_metode_status_cek,
  DROP CONSTRAINT order_pemutus_cek,
  DROP CONSTRAINT order_alasan_cek;

ALTER TABLE public."order"
  ADD CONSTRAINT order_metode_status_cek CHECK (
    (metode_bayar IS NULL AND status IN ('Menunggu', 'Ditolak', 'Dibatalkan'))
    OR (metode_bayar IS NOT NULL AND status NOT IN ('Menunggu', 'Ditolak', 'Dibatalkan'))
  ),
  ADD CONSTRAINT order_pemutus_cek CHECK (
    (pemutus IS NULL AND pemutus_nama IS NULL AND diputuskan_pada IS NULL
       AND status IN ('Menunggu', 'Dibatalkan'))
    OR (pemutus IS NOT NULL AND pemutus_nama IS NOT NULL AND diputuskan_pada IS NOT NULL
       AND status NOT IN ('Menunggu', 'Dibatalkan'))
  ),
  ADD CONSTRAINT order_alasan_cek CHECK (
    alasan_tolak IS NULL
    OR (status = 'Ditolak'
        AND char_length(alasan_tolak) BETWEEN 1 AND 200
        AND alasan_tolak = btrim(alasan_tolak))
  );

COMMIT;
