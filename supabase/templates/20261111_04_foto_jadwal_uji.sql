-- supabase/templates/20261111_04_foto_jadwal_uji.sql
-- FTO.05: uji manual SATU KALI, memakai perintah yang sama persis dengan isi jadwal mingguan.
-- Ini putaran NYATA (bukan simulasi): berkas foto yang layak dibersihkan akan benar-benar dihapus.
-- Aman diulang: putaran sebelumnya sudah membersihkan yang layak, jadi sisanya diharapkan 0.
-- Tidak memuat nilai rahasia; rahasia dan alamat dibaca dari Vault. Jalankan di SQL Editor (akun ketua).
--
-- LANGKAH A: jalankan BAGIAN A saja. Hasil: satu angka (nomor permintaan).
-- LANGKAH B: tunggu sekitar 30 detik, lalu jalankan BAGIAN B saja. Hasil dibaca dari catatan pg_net.

-- ===== BAGIAN A: kirim permintaan =====
select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name = 'url_project_bersihkan')
         || '/functions/v1/bersihkan',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-rahasia-penjadwal',
      (select decrypted_secret from vault.decrypted_secrets where name = 'rahasia_penjadwal_bersihkan')
  ),
  body := '{}'::jsonb,
  timeout_milliseconds := 150000
) as nomor_permintaan;

-- ===== BAGIAN B: baca balasan (hanya SELECT) =====
-- Harapan: baris teratas status_code 200, timed_out kosong atau false, error_msg kosong,
-- content berisi angka ringkasan dengan "ok":true dan "simulasi":false.
select id, status_code, timed_out, error_msg, content, created
from net._http_response
order by created desc
limit 3;
