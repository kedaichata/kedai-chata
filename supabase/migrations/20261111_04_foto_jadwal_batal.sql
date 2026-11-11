-- supabase/migrations/20261111_04_foto_jadwal_batal.sql
-- Pembatal FTO.05 penjadwal: mematikan jadwal mingguan `bersihkan`.
-- Yang TIDAK dilakukan: tidak menghapus fungsi `bersihkan`, tidak menyentuh foto atau data, dan tidak
-- menghapus dua isian di Vault (rahasia_penjadwal_bersihkan dan url_project_bersihkan). Bila rahasia
-- perlu dibuang juga, itu langkah terpisah dengan penjelasan dampak dan "OK" ketua.
-- Aman dijalankan berulang: bila jadwal tidak ada, tidak terjadi apa-apa.

do $$
begin
  if exists (select 1 from cron.job where jobname = 'bersihkan-foto-mingguan') then
    perform cron.unschedule('bersihkan-foto-mingguan');
  end if;
end
$$;
