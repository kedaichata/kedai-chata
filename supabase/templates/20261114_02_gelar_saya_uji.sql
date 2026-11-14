-- supabase/templates/20261114_02_gelar_saya_uji.sql
-- Uji hitung GLR.02 dengan data DUMMY. Jalankan SETELAH 20261114_02_gelar_saya.sql.
--
-- CARA KERJA: satu blok DO yang menambah gelar uji sementara, memanggil gelar_saya untuk akun
-- dummy, lalu SENGAJA berakhir dengan galat berisi laporan. Galat itu membatalkan SEMUA yang
-- ditulis blok ini, jadi tabel `gelar` tetap kosong. Hasil ada di PESAN GALAT (itu normal).
--
-- YANG DIISI KETUA DI DASHBOARD SAJA (jangan simpan hasil isian ini ke repo atau chat):
--   <ID_AKUN_1>, <ID_AKUN_2>, <ID_AKUN_3> : id tiga akun customer DUMMY dengan jumlah order Selesai berbeda
--   <ID_AKUN_STAF>                        : id satu akun staf (owner atau penjaga) untuk uji penolakan
--   <NAMA_MENU_UJI>                       : nama persis satu menu (misalnya Karage) yang dipesan akun dummy
-- Bila ada yang belum diganti, blok gagal sebelum menulis apa pun (aman).
--
-- SYARAT: tabel `gelar` masih kosong (blok berhenti bila tidak).
--
-- GELAR UJI (hanya hidup selama blok berjalan): tingkat ambang 1 sampai 5; satu gelar menu ambang 2
-- untuk menu uji; satu gelar menu NONAKTIF ambang 1 (tidak boleh pernah muncul di hasil).
--
-- HASIL YANG BENAR (bandingkan dengan hitungan manual di aplikasi akun itu):
--   - "selesai" = jumlah pesanan berstatus Selesai milik akun itu (order wakil tidak ada di akun).
--   - Gelar tingkat = "Uji" dengan ambang tertinggi <= selesai; null bila selesai = 0.
--   - Gelar menu "Uji Penikmat" muncul hanya bila "memuat_menu" >= 2; "Uji Menu Nonaktif" tidak pernah muncul.
--   - "memuat_menu" menghitung ORDER unik, bukan porsi: satu order 20 porsi tetap 1.
--   - Staf: peran_tidak_boleh. Id kosong: id_kosong. Akun acak tanpa profil: profil_tidak_ada.

DO $$
DECLARE
  v_akun   uuid[] := ARRAY['<ID_AKUN_1>', '<ID_AKUN_2>', '<ID_AKUN_3>']::uuid[];
  v_staf   uuid   := '<ID_AKUN_STAF>'::uuid;
  v_menu   uuid;
  v_i      integer;
  v_total  integer;
  v_memuat integer;
  v_lap    text := '';
  v_h      text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.gelar) THEN
    RAISE EXCEPTION 'uji_dibatalkan: tabel gelar tidak kosong';
  END IF;

  SELECT id INTO v_menu FROM public.menu WHERE nama = '<NAMA_MENU_UJI>' LIMIT 1;
  IF v_menu IS NULL THEN
    RAISE EXCEPTION 'uji_dibatalkan: menu uji tidak ditemukan';
  END IF;

  INSERT INTO public.gelar (kunci, jenis, ambang, menu_id, nama, deskripsi, aktif) VALUES
    ('uji-tingkat-1',     'tingkat', 1, NULL,   'Uji Tingkat 1',    'Deskripsi uji 1.',  true),
    ('uji-tingkat-2',     'tingkat', 2, NULL,   'Uji Tingkat 2',    'Deskripsi uji 2.',  true),
    ('uji-tingkat-3',     'tingkat', 3, NULL,   'Uji Tingkat 3',    'Deskripsi uji 3.',  true),
    ('uji-tingkat-4',     'tingkat', 4, NULL,   'Uji Tingkat 4',    'Deskripsi uji 4.',  true),
    ('uji-tingkat-5',     'tingkat', 5, NULL,   'Uji Tingkat 5',    'Deskripsi uji 5.',  true),
    ('uji-menu-2',        'menu',    2, v_menu, 'Uji Penikmat',     'Deskripsi uji menu.', true),
    ('uji-menu-nonaktif', 'menu',    1, v_menu, 'Uji Menu Nonaktif','Deskripsi uji menu nonaktif.', false);

  FOR v_i IN 1..3 LOOP
    SELECT count(*) INTO v_total
    FROM public."order" o
    WHERE o.pemesan = v_akun[v_i] AND o.status = 'Selesai';

    SELECT count(DISTINCT o.id) INTO v_memuat
    FROM public."order" o
    JOIN public.order_item oi ON oi.order_id = o.id
    WHERE o.pemesan = v_akun[v_i] AND o.status = 'Selesai' AND oi.menu_id = v_menu;

    v_lap := v_lap || format(
      E'\nakun %s: selesai=%s, memuat_menu=%s, hasil=%s',
      v_i, v_total, v_memuat, public.gelar_saya(v_akun[v_i])::text
    );
  END LOOP;

  -- Cabang galat
  BEGIN
    PERFORM public.gelar_saya(v_staf);
    v_h := 'TIDAK ditolak (SALAH)';
  EXCEPTION WHEN OTHERS THEN
    v_h := SQLERRM;
  END;
  v_lap := v_lap || E'\nstaf: ' || v_h;

  BEGIN
    PERFORM public.gelar_saya(NULL);
    v_h := 'TIDAK ditolak (SALAH)';
  EXCEPTION WHEN OTHERS THEN
    v_h := SQLERRM;
  END;
  v_lap := v_lap || E'\nid kosong: ' || v_h;

  BEGIN
    PERFORM public.gelar_saya(gen_random_uuid());
    v_h := 'TIDAK ditolak (SALAH)';
  EXCEPTION WHEN OTHERS THEN
    v_h := SQLERRM;
  END;
  v_lap := v_lap || E'\nakun tanpa profil: ' || v_h;

  -- SENGAJA gagal supaya semua isian gelar uji dibatalkan. Hasil ada di pesan ini.
  RAISE EXCEPTION E'HASIL UJI (galat ini disengaja, semua isian uji dibatalkan):%', v_lap;
END;
$$;
