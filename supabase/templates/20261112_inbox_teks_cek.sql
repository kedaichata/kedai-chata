-- supabase/templates/20261112_inbox_teks_cek.sql
-- Cek BACA-SAJA: daftar teks inbox yang berbeda (nomor order disamakan jadi "#N"),
-- untuk dicocokkan dengan tabel 4.1 di docs/notifikasi.md (bukti SEC-35).
-- Hanya SELECT. Tidak mengubah data. Tanpa ID akun (penerima tidak ditampilkan).
-- Jalankan di SQL Editor (akun ketua), tempel hasilnya ke chat, lalu logout.
--
-- Cara membaca hasil:
--   * Satu baris = satu kalimat kabar yang berbeda.
--   * jumlah          = berapa baris inbox memakai kalimat itu.
--   * tanpa_nomor     = berapa baris yang kolom nomor_order-nya kosong.
--   * ada_angka_lain  = true bila setelah "#N" masih ada angka (curiga: nomor WA, harga, jam).
--   * ada_kurung_sudut= true bila ada tanda < atau > (curiga: tag HTML ikut masuk).
--   * Hasil yang benar: kedua tanda itu false di semua baris, dan tiap kalimat
--     ada di tabel 4.1 notifikasi.md (termasuk tambahan 8 Nov: batal owner dan alih hari).

SELECT
  regexp_replace(i.teks, '#[0-9]+', '#N', 'g')                       AS teks_umum,
  count(*)                                                           AS jumlah,
  count(*) FILTER (WHERE i.nomor_order IS NULL)                      AS tanpa_nomor,
  bool_or(regexp_replace(i.teks, '#[0-9]+', '#N', 'g') ~ '[0-9]')    AS ada_angka_lain,
  bool_or(i.teks ~ '[<>]')                                           AS ada_kurung_sudut,
  max(length(i.teks))                                                AS panjang_terbesar
FROM public.inbox i
GROUP BY regexp_replace(i.teks, '#[0-9]+', '#N', 'g')
ORDER BY teks_umum;
