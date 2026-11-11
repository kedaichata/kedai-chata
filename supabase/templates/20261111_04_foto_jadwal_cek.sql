-- supabase/templates/20261111_04_foto_jadwal_cek.sql
-- FTO.05: cek baca-saja setelah migration 20261111_04_foto_jadwal.sql. Hanya SELECT.
-- Tidak ada query yang menampilkan nilai rahasia atau alamat project.
-- Jalankan di SQL Editor (akun ketua). Bila hasilnya tampil satu per satu (tab), tempel semuanya ke chat.

-- 1. Ekstensi terpasang. Harapan: tiga baris (pg_cron, pg_net, supabase_vault).
select extname
from pg_extension
where extname in ('pg_cron', 'pg_net', 'supabase_vault')
order by extname;

-- 2. Dua isian ada di Vault (hanya nama). Harapan: dua baris.
select name
from vault.secrets
where name in ('rahasia_penjadwal_bersihkan', 'url_project_bersihkan')
order by name;

-- 3. Rahasia cukup panjang dan alamat tidak kosong (hanya benar atau salah). Harapan: keduanya true.
select name,
       case name
         when 'rahasia_penjadwal_bersihkan' then length(decrypted_secret) >= 32
         else length(decrypted_secret) > 0
       end as memenuhi_syarat
from vault.decrypted_secrets
where name in ('rahasia_penjadwal_bersihkan', 'url_project_bersihkan')
order by name;

-- 4. Jadwal terpasang. Harapan: satu baris, jadwal '0 19 * * 6', aktif true,
--    memakai_vault true (perintahnya mengambil nilai dari Vault), tanpa_nilai_tertulis true.
select jobname,
       schedule,
       active,
       command like '%vault.decrypted_secrets%' as memakai_vault,
       command not like '%supabase.co%' as tanpa_nilai_tertulis
from cron.job
where jobname = 'bersihkan-foto-mingguan';
