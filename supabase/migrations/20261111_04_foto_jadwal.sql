-- supabase/migrations/20261111_04_foto_jadwal.sql
-- FTO.05: penjadwal mingguan yang memanggil Edge Function `bersihkan` (foto-bukti.md FT7, FT9).
-- Pembatal: 20261111_04_foto_jadwal_batal.sql. Cek: supabase/templates/20261111_04_foto_jadwal_cek.sql.
--
-- SYARAT: template 20261111_04_vault_rahasia.sql sudah dijalankan (dua isian ada di Vault).
-- Berkas ini TIDAK memuat nilai rahasia maupun alamat project; keduanya dibaca dari Vault saat jadwal berjalan.
--
-- Jadwal: Sabtu 19.00 UTC = Minggu 02.00 WIB (pg_cron memakai UTC). Disetujui ketua 11 Nov 2026.
-- Dampak: tiap minggu `bersihkan` menghapus berkas foto bukti yang lewat `foto_simpan_hari`, yang ditandai
-- diganti, dan berkas tanpa baris (tidak bisa dipulihkan). Order dan catatan tidak disentuh.
-- Batas tunggu 150 detik (bawaan pg_net 5 detik terlalu pendek; penyapuan fungsi sampai 90 detik).
-- Isi permintaan kosong `{}`: bukan mode simulasi, jadi jadwal benar-benar menghapus.
-- Hasil tiap panggilan tercatat di net._http_response (hanya sementara oleh pg_net).

-- Pagar: berhenti bila Vault belum berisi kedua isian.
do $$
begin
  if not exists (
    select 1 from vault.decrypted_secrets
    where name = 'rahasia_penjadwal_bersihkan' and length(decrypted_secret) >= 32
  ) then
    raise exception 'Rahasia penjadwal belum ada di Vault (jalankan template vault dulu)';
  end if;
  if not exists (
    select 1 from vault.decrypted_secrets
    where name = 'url_project_bersihkan' and length(decrypted_secret) > 0
  ) then
    raise exception 'Alamat project belum ada di Vault (jalankan template vault dulu)';
  end if;
end
$$;

-- Pasang jadwal. Nama yang sama tidak membuat jadwal ganda (menggantikan yang lama).
select cron.schedule(
  'bersihkan-foto-mingguan',
  '0 19 * * 6',
  $job$
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
  );
  $job$
);
