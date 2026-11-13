-- supabase/migrations/20261113_02_ringkasan_7hari.sql
-- RKS.01: satu fungsi SQL BACA-SAJA `ringkasan_7hari` untuk fitur Ringkasan Order 7 Hari (docs/ringkasan.md).
-- Aksi `kedai` (ringkasan.ts) dikerjakan di RKS.02, layar di RKS.03.
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo dan SETELAH "OK" ketua (sudah ada, 13 Nov 2026).
-- Pembatalan: supabase/migrations/20261113_02_ringkasan_7hari_batal.sql
-- Cek hasil: supabase/templates/20261113_02_ringkasan_7hari_cek.sql
-- Tanpa data nyata.
--
-- Yang BARU:
--   - fungsi `public.ringkasan_7hari(uuid)`
-- Yang SENGAJA TIDAK DISENTUH: semua tabel dan hak tabel, semua data, semua fungsi lama (termasuk fungsi order dan
--   inbox), pengaturan, `kedai`, dan berkas aplikasi. Fungsi ini CREATE FUNCTION biasa (bukan OR REPLACE), jadi tidak
--   mungkin menimpa fungsi lama. Tidak ada tulis-database, tidak ada DELETE. Belum dipanggil siapa pun sampai RKS.02.
--
-- Pola keamanan (AGENTS.md bagian 7, security.md aturan 4): SECURITY DEFINER, search_path kosong, `public.` eksplisit,
-- tabel order ditulis public."order", EXECUTE hanya untuk service_role.
-- `p_akun` HARUS diambil `kedai` dari token login, bukan dari aplikasi (aturan 2 dan 5).
-- Peran dibaca fungsi sendiri dari tabel `staf` sebagai pagar kedua di samping `kedai` (RK1, aturan 8): hanya owner aktif.
--
-- Keputusan yang berlaku (ringkasan.md RK1, RK4 sampai RK10, RK14, RK15):
--   - RK4: 7 hari = hari ini plus 6 hari sebelumnya, "hari ini" dari jam server WIB. Hari tanpa order tetap ada (nilai 0).
--   - RK5: order dikelompokkan menurut hari_target (hari antar), bukan tanggal dibuat.
--   - RK6: dihitung semua status KECUALI Ditolak dan Dibatalkan.
--   - RK7: nilai uang = jumlah `total` order yang dihitung (rupiah bulat). Order wakil owner dan pelanggan tanpa akun ikut.
--   - RK8: rata-rata order per hari = total order dibagi 7, satu angka di belakang koma.
--   - RK9: terlaris dan tersepi dinilai dari 6 hari yang SUDAH LEWAT (hari ini tidak dinilai). Urutan penentu:
--          jumlah order, bila seri nilai uang (terlaris: lebih besar, tersepi: lebih kecil), bila masih seri hari yang lebih baru.
--          Bila keenam hari itu sama persis (jumlah DAN nilai uang sama di semua hari, termasuk semuanya 0) tidak ada
--          terlaris dan tersepi: kembalian `belum_ada_perbedaan` = true dan keduanya null.
--   - RK14: angka 7 tetap di fungsi ini (pengecualian dari aturan angka di database, AGENTS.md blok 13 Nov 2026).
--   - RK15: kembalian hanya angka dan tanggal. Tanpa nama, nomor WA, alamat, atau isi catatan.
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   1. Kembalian jsonb. Tiap hari membawa `hari` (angka 1 sampai 7, 1 = Senin) dari server, supaya aplikasi bisa menulis
--      "Sen", "Sel", dan seterusnya tanpa menghitung hari dari tanggal di HP (menghindari selisih zona waktu).
--   2. Tafsir "sama persis" di RK9 = jumlah order dan nilai uang sama di keenam hari. Bila jumlah sama tetapi nilai uang
--      beda, nilai uang yang menentukan (sesuai aturan seri RK9).
--   3. Kode galat baru `bukan_owner` (selain owner, termasuk customer tanpa baris di `staf` dan penjaga). `kedai` memetakannya
--      ke 403 di RKS.02 (SEC-36). Kode lain mengikuti fungsi order: id_kosong, akun_nonaktif.
--
-- Bentuk kembalian:
--   {
--     "hari_ini":            "YYYY-MM-DD",
--     "total_order":         <angka>,
--     "total_nilai":         <angka rupiah bulat>,
--     "rata_rata_order":     <angka, satu desimal>,
--     "per_hari":            [ { "tanggal": "YYYY-MM-DD", "hari": 1..7, "jumlah": <angka>, "nilai": <angka> }, ... ]  -- 7 elemen, terlama ke hari ini
--     "belum_ada_perbedaan": true | false,
--     "terlaris":            { "tanggal": "YYYY-MM-DD", "hari": 1..7, "jumlah": <angka> } | null,
--     "tersepi":             { "tanggal": "YYYY-MM-DD", "hari": 1..7, "jumlah": <angka> } | null
--   }
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai`:
--   id_kosong, akun_nonaktif, bukan_owner

BEGIN;

-- ============================================================
-- 1. ringkasan_7hari (owner saja). Hanya membaca.
-- ============================================================
CREATE FUNCTION public.ringkasan_7hari(
  p_akun uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_peran       text;
  v_aktif       boolean;
  v_hari_ini    date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  v_per_hari    jsonb;
  v_total_order integer;
  v_total_nilai bigint;
  v_sama        boolean;
  v_laris       jsonb;
  v_sepi        jsonb;
BEGIN
  IF p_akun IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Peran dari tabel staf; tidak ada baris = customer (ditolak). Hanya owner aktif yang boleh (RK1).
  SELECT s.peran, s.aktif
    INTO v_peran, v_aktif
    FROM public.staf s
   WHERE s.id = p_akun;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'bukan_owner';
  END IF;
  IF NOT v_aktif THEN
    RAISE EXCEPTION 'akun_nonaktif';
  END IF;
  IF v_peran <> 'owner' THEN
    RAISE EXCEPTION 'bukan_owner';
  END IF;

  -- Satu pembacaan: 7 hari (hari ini ke belakang), order dikelompokkan per hari_target, tanpa Ditolak dan Dibatalkan.
  -- `lalu` = 6 hari yang sudah lewat (hari ini tidak dinilai untuk terlaris dan tersepi, RK9).
  WITH hari AS (
    SELECT (v_hari_ini - 6 + g) AS tgl
      FROM generate_series(0, 6) AS g
  ),
  rekap AS (
    SELECT h.tgl,
           count(o.id)::integer              AS jumlah,
           coalesce(sum(o.total), 0)::bigint AS nilai
      FROM hari h
      LEFT JOIN public."order" o
        ON o.hari_target = h.tgl
       AND o.status NOT IN ('Ditolak', 'Dibatalkan')
     GROUP BY h.tgl
  ),
  lalu AS (
    SELECT r.tgl, r.jumlah, r.nilai
      FROM rekap r
     WHERE r.tgl < v_hari_ini
  )
  SELECT
    (SELECT jsonb_agg(
              jsonb_build_object(
                'tanggal', r.tgl,
                'hari',    extract(isodow FROM r.tgl)::integer,
                'jumlah',  r.jumlah,
                'nilai',   r.nilai
              )
              ORDER BY r.tgl
            )
       FROM rekap r),
    (SELECT sum(r.jumlah)::integer FROM rekap r),
    (SELECT sum(r.nilai)::bigint   FROM rekap r),
    (SELECT (min(l.jumlah) = max(l.jumlah) AND min(l.nilai) = max(l.nilai)) FROM lalu l),
    (SELECT jsonb_build_object(
              'tanggal', l.tgl,
              'hari',    extract(isodow FROM l.tgl)::integer,
              'jumlah',  l.jumlah
            )
       FROM lalu l
      ORDER BY l.jumlah DESC, l.nilai DESC, l.tgl DESC
      LIMIT 1),
    (SELECT jsonb_build_object(
              'tanggal', l.tgl,
              'hari',    extract(isodow FROM l.tgl)::integer,
              'jumlah',  l.jumlah
            )
       FROM lalu l
      ORDER BY l.jumlah ASC, l.nilai ASC, l.tgl DESC
      LIMIT 1)
    INTO v_per_hari, v_total_order, v_total_nilai, v_sama, v_laris, v_sepi;

  RETURN jsonb_build_object(
    'hari_ini',            v_hari_ini,
    'total_order',         v_total_order,
    'total_nilai',         v_total_nilai,
    'rata_rata_order',     round(v_total_order::numeric / 7, 1),
    'per_hari',            v_per_hari,
    'belum_ada_perbedaan', v_sama,
    'terlaris',            CASE WHEN v_sama THEN NULL ELSE v_laris END,
    'tersepi',             CASE WHEN v_sama THEN NULL ELSE v_sepi END
  );
END;
$$;

-- ============================================================
-- 2. Hak EXECUTE: cabut semua dulu (termasuk bawaan Supabase), lalu beri hanya ke service_role.
--    anon dan authenticated nol (AGENTS.md bagian 7).
-- ============================================================
REVOKE ALL ON FUNCTION public.ringkasan_7hari(uuid)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.ringkasan_7hari(uuid) TO service_role;

COMMIT;
