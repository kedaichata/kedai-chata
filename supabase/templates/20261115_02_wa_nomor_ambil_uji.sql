-- supabase/templates/20261115_02_wa_nomor_ambil_uji.sql
-- Uji jalur STAF untuk wa_nomor_ambil (WAG.02) dengan data DUMMY. Butuh "OK" ketua (sudah ada, 15 Nov 2026).
-- Dijalankan MANUAL di SQL Editor (akun ketua). Boleh diulang kapan saja (termasuk setelah WAG.06).
-- Tanpa data nyata: nomor di bawah adalah nomor dummy buatan (628000000001 dan seterusnya), bukan milik siapa pun.
--
-- CARA KERJA (aman): seluruh uji berada di SATU blok DO. Blok ini mengubah data sementara, memeriksa hasilnya,
-- lalu SELALU diakhiri RAISE EXCEPTION. Galat itu membatalkan SEMUA perubahan di dalam blok secara otomatis
-- (sama dengan ROLLBACK, tanpa bisa lupa). Galat yang muncul di akhir adalah hasil uji, BUKAN kegagalan.
--
-- YANG DIUBAH SEMENTARA (semuanya dibatalkan otomatis):
--   - Tiga baris staf (diambil dari tabel staf apa adanya): staf 1 diberi nomor dummy dan aktif; staf 2 diberi nomor dummy
--     dan dinonaktifkan; staf 3 dibuat tanpa nomor dan aktif.
--   - Dua baris profil dummy (untuk staf 1 dan staf 2), untuk menguji bahwa staf yang juga punya profil
--     TIDAK dianggap customer.
--
-- HASIL YANG BENAR: galat dengan teks yang memuat PERSIS nilai ini:
--   jumlah=1 | s1_benar=true | s2_nonaktif_ada=false | s3_tanpa_nomor_ada=false | ada_peran_customer=false
--   (kalau ada nilai lain, jangan lanjut; tempel hasilnya ke chat.)
--
-- SESUDAH uji, jalankan CEK PASCA-UJI di bagian bawah (SATU QUERY TERPISAH) untuk membuktikan data kembali seperti semula.

DO $$
DECLARE
  v_ids           uuid[];
  v_s1            uuid;
  v_s2            uuid;
  v_s3            uuid;
  v_peran1        text;
  v_hasil         jsonb;
  v_jumlah        integer;
  v_s1_benar      boolean;
  v_s2_ada        boolean;
  v_s3_ada        boolean;
  v_ada_customer  boolean;
BEGIN
  SELECT array_agg(id ORDER BY id) INTO v_ids FROM public.staf;
  IF coalesce(cardinality(v_ids), 0) < 3 THEN
    RAISE EXCEPTION 'uji_butuh_3_staf';
  END IF;
  v_s1 := v_ids[1];
  v_s2 := v_ids[2];
  v_s3 := v_ids[3];

  -- Keadaan uji (sementara)
  UPDATE public.staf SET nomor_wa = '628000000001', aktif = true  WHERE id = v_s1;
  UPDATE public.staf SET nomor_wa = '628000000002', aktif = false WHERE id = v_s2;
  UPDATE public.staf SET nomor_wa = NULL,           aktif = true  WHERE id = v_s3;

  -- Profil dummy untuk dua staf (menguji: staf tidak jatuh menjadi customer)
  INSERT INTO public.profil (id, nama_tampilan, nomor_wa)
  VALUES (v_s1, 'Uji Dummy A', '628000000011'),
         (v_s2, 'Uji Dummy B', '628000000012');

  SELECT peran INTO v_peran1 FROM public.staf WHERE id = v_s1;

  v_hasil  := public.wa_nomor_ambil(ARRAY[v_s1, v_s2, v_s3]);
  v_jumlah := jsonb_array_length(v_hasil);

  -- staf 1: ada, perannya = peran di tabel staf (owner atau penjaga), nomornya nomor dummy 1
  v_s1_benar := EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_hasil) e
     WHERE (e->>'akun')::uuid = v_s1
       AND e->>'peran'        = v_peran1
       AND e->>'peran'       <> 'customer'
       AND e->>'nomor'        = '628000000001'
  );
  -- staf 2 (nonaktif, punya nomor dan profil): tidak boleh muncul
  v_s2_ada := EXISTS (SELECT 1 FROM jsonb_array_elements(v_hasil) e WHERE (e->>'akun')::uuid = v_s2);
  -- staf 3 (aktif, tanpa nomor): tidak boleh muncul
  v_s3_ada := EXISTS (SELECT 1 FROM jsonb_array_elements(v_hasil) e WHERE (e->>'akun')::uuid = v_s3);
  -- tidak boleh ada peran customer di hasil
  v_ada_customer := EXISTS (SELECT 1 FROM jsonb_array_elements(v_hasil) e WHERE e->>'peran' = 'customer');

  -- SELALU galat di akhir: membatalkan semua perubahan di atas. Teks hasil tidak memuat nomor.
  RAISE EXCEPTION 'UJI_SELESAI_DIBATALKAN_OTOMATIS | jumlah=% | s1_benar=% | s2_nonaktif_ada=% | s3_tanpa_nomor_ada=% | ada_peran_customer=%',
    v_jumlah, v_s1_benar, v_s2_ada, v_s3_ada, v_ada_customer;
END;
$$;

-- ------------------------------------------------------------
-- CEK PASCA-UJI (jalankan TERPISAH, setelah blok DO di atas). HANYA SELECT.
-- Yang benar: sama persis dengan sebelum uji. Saat ini (sebelum WAG.06): staf_total = 3, staf_nomor_terisi = 0,
-- staf_nonaktif = 0, profil_total = 6, profil_milik_staf = 0, dan nomor dummy tidak ada (dummy_tersisa = 0).
-- Bila uji diulang setelah WAG.06, bandingkan dengan angka sebelum uji (staf_nomor_terisi = jumlah nomor asli).
-- ------------------------------------------------------------
SELECT
  (SELECT count(*) FROM public.staf)                                                    AS staf_total,
  (SELECT count(*) FROM public.staf WHERE nomor_wa IS NOT NULL)                         AS staf_nomor_terisi,
  (SELECT count(*) FROM public.staf WHERE NOT aktif)                                    AS staf_nonaktif,
  (SELECT count(*) FROM public.profil)                                                  AS profil_total,
  (SELECT count(*) FROM public.profil p WHERE EXISTS (SELECT 1 FROM public.staf s WHERE s.id = p.id)) AS profil_milik_staf,
  (SELECT count(*) FROM public.staf WHERE nomor_wa LIKE '62800000000%')
  + (SELECT count(*) FROM public.profil WHERE nomor_wa LIKE '62800000001%')             AS dummy_tersisa;
