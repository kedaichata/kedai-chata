-- supabase/migrations/20261115_02_wa_nomor_ambil.sql
-- WAG.02: fungsi SQL baca-saja `wa_nomor_ambil` untuk mengambil nomor WA penerima notifikasi (dipakai `kedai`, WAG.05).
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo dan SETELAH "OK" ketua (sudah ada, 15 Nov 2026).
-- Pembatalan: supabase/migrations/20261115_02_wa_nomor_ambil_batal.sql
-- Cek hasil: supabase/templates/20261115_02_wa_nomor_ambil_cek.sql
-- Rujukan: docs/wa-notif.md WAG11 dan WAG12; pola `push_langganan_ambil` (20261113_inbox_tulis_penerima.sql).
-- Tanpa data nyata.
--
-- Yang BARU:
--   - fungsi `public.wa_nomor_ambil(uuid[])` (hanya membaca).
-- Yang SENGAJA TIDAK DISENTUH: semua tabel (termasuk profil dan staf), hak tabel, pengaturan, fungsi lain, data, dan berkas aplikasi.
--   Tidak ada tulis-database dan tidak ada DELETE. Bukan pengecualian tulis-database (AGENTS.md blok 14 Nov 2026).
--
-- Pola keamanan (AGENTS.md bagian 7, security.md aturan 4): SECURITY DEFINER, search_path kosong, `public.` eksplisit,
-- EXECUTE hanya untuk service_role.
-- Daftar akun HARUS dihitung `kedai` dari aturan penerima yang sama dengan `inbox_tulis` (tidak ada hitungan kedua, wa-notif.md bagian 4.1).
-- Hasil fungsi ini HANYA untuk `kedai`: tidak dikirim ke aplikasi dan tidak ditulis di log (security.md aturan 18, SEC-44).
-- Nomor WA adalah data pribadi; nomor nyata tidak boleh ada di berkas ini.
--
-- Bentuk kembalian: array JSON, satu elemen per akun yang punya nomor sah:
--   [{ "akun": <uuid>, "peran": "customer" | "owner" | "penjaga", "nomor": "62xxx" }, ...]
--   Array kosong bila tidak ada. Urutan TIDAK dijamin (`kedai` yang mengurutkan customer dulu, WAG13).
--
-- Aturan yang dipakai (pilihan penulis, diterima ketua 15 Nov 2026; alasan ketua selain itu belum tercatat):
--   1. Akun yang punya baris di `staf` dianggap staf. Bila stafnya tidak aktif, nomornya TIDAK dikembalikan
--      (dan tidak jatuh menjadi customer walau punya profil, AK4).
--   2. Customer = akun yang punya baris di `profil` dan tidak punya baris di `staf`. Akun tanpa profil maupun staf dilewati.
--   3. Bentuk nomor dicek lagi di fungsi (^628[0-9]{8,11}$) sebagai pagar kedua selain constraint tabel.
--      Nomor kosong atau bentuk tidak sah tidak dikembalikan.
--   4. Urutan kembalian tidak dijamin.
--   5. Satu akun muncul paling banyak sekali walau ada duplikat di `p_akun`. Elemen null di `p_akun` diabaikan.
--
-- Batas: paling banyak 100 elemen per panggilan (dihitung dari panjang daftar masuk, termasuk duplikat).
--
-- Kode galat (RAISE EXCEPTION), keduanya TIDAK dipetakan ke layar, hanya dicatat di log `kedai` tanpa nomor (WAG02, WAG12):
--   id_kosong, daftar_terlalu_panjang

BEGIN;

CREATE FUNCTION public.wa_nomor_ambil(
  p_akun uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_akun IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;
  IF cardinality(p_akun) > 100 THEN
    RAISE EXCEPTION 'daftar_terlalu_panjang';
  END IF;

  RETURN coalesce(
    (
      SELECT jsonb_agg(
               jsonb_build_object(
                 'akun',  x.akun,
                 'peran', x.peran,
                 'nomor', x.nomor
               )
               ORDER BY x.peran, x.akun
             )
        FROM (
          -- Staf aktif dengan nomor sah (owner atau penjaga)
          SELECT s.id       AS akun,
                 s.peran    AS peran,
                 s.nomor_wa AS nomor
            FROM public.staf s
           WHERE s.id IN (SELECT DISTINCT a FROM unnest(p_akun) AS a WHERE a IS NOT NULL)
             AND s.aktif
             AND s.nomor_wa ~ '^628[0-9]{8,11}$'
          UNION ALL
          -- Customer: punya profil dan BUKAN staf (aktif atau tidak)
          SELECT p.id           AS akun,
                 'customer'::text AS peran,
                 p.nomor_wa     AS nomor
            FROM public.profil p
           WHERE p.id IN (SELECT DISTINCT a FROM unnest(p_akun) AS a WHERE a IS NOT NULL)
             AND NOT EXISTS (SELECT 1 FROM public.staf s2 WHERE s2.id = p.id)
             AND p.nomor_wa ~ '^628[0-9]{8,11}$'
        ) x
    ),
    '[]'::jsonb
  );
END;
$$;

-- EXECUTE hanya untuk service_role (AGENTS.md bagian 7)
REVOKE ALL ON FUNCTION public.wa_nomor_ambil(uuid[])
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wa_nomor_ambil(uuid[])
  TO service_role;

COMMIT;
