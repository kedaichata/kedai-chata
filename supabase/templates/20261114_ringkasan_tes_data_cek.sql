-- Berkas tujuan: supabase/templates/20261114_ringkasan_tes_data_cek.sql
-- RKS.04, langkah 1: lihat isi data dummy dan hitung manual ringkasan 7 hari.
-- HANYA SELECT (baca-saja). Tidak mengubah data. Tanpa nama, nomor WA, atau alamat.
-- Cara pakai: di SQL Editor (akun Supabase ketua, profil browser terpisah),
-- blok SATU query saja (dari "-- QUERY X" sampai tanda titik koma), lalu klik Run.
-- Ulangi untuk query berikutnya. Tempel hasilnya ke chat. Logout setelah selesai.
-- "Hari ini" dihitung dari jam server zona WIB, sama seperti fungsi ringkasan_7hari.

-- QUERY A: jumlah order dan nilai per hari target dan per status (hari ini - 6 sampai Besok)
select
  o.hari_target,
  o.status,
  count(*) as jumlah,
  sum(o.total) as nilai
from public."order" o
where o.hari_target between ((now() at time zone 'Asia/Jakarta')::date - 6)
                        and ((now() at time zone 'Asia/Jakarta')::date + 1)
group by o.hari_target, o.status
order by o.hari_target, o.status;

-- QUERY B: hitungan manual per hari (7 hari, hari kosong tetap tampil 0)
-- Dibandingkan dengan batang di layar Ringkasan. Order Ditolak dan Dibatalkan tidak ikut.
with h as (
  select d::date as tanggal
  from generate_series(
    (now() at time zone 'Asia/Jakarta')::date - 6,
    (now() at time zone 'Asia/Jakarta')::date,
    interval '1 day'
  ) d
)
select
  h.tanggal,
  count(o.id) as jumlah,
  coalesce(sum(o.total), 0) as nilai
from h
left join public."order" o
  on o.hari_target = h.tanggal
 and o.status not in ('Ditolak', 'Dibatalkan')
group by h.tanggal
order by h.tanggal;

-- QUERY C: total, nilai, dan rata-rata per hari (dibagi 7, satu angka di belakang koma)
select
  count(*) as total_order,
  coalesce(sum(o.total), 0) as total_nilai,
  round(count(*) / 7.0, 1) as rata_rata_order
from public."order" o
where o.hari_target between ((now() at time zone 'Asia/Jakarta')::date - 6)
                        and  (now() at time zone 'Asia/Jakarta')::date
  and o.status not in ('Ditolak', 'Dibatalkan');

-- QUERY D: order di luar rentang yang TIDAK boleh ikut (Besok atau lebih, dan lebih lama dari 6 hari lalu)
select
  case
    when o.hari_target > (now() at time zone 'Asia/Jakarta')::date then 'setelah hari ini (Besok dst)'
    else 'sebelum rentang 7 hari'
  end as posisi,
  count(*) as jumlah,
  coalesce(sum(o.total), 0) as nilai
from public."order" o
where o.hari_target > (now() at time zone 'Asia/Jakarta')::date
   or o.hari_target < ((now() at time zone 'Asia/Jakarta')::date - 6)
group by 1
order by 1;
