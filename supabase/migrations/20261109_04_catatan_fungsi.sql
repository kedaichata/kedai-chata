-- supabase/migrations/20261109_04_catatan_fungsi.sql
-- ORD.09 (giliran 1): fungsi SQL `catatan_tambah` dan `catatan_dibaca` (catatan berlapis, order.md O12 dan O14).
-- Aksi `catatan_tambah` dan `catatan_dibaca` di `kedai` dikerjakan di giliran 2 (berkas baru `catatan.ts`).
-- Tampilan catatan dan tanda "Catatan baru" adalah ORD.10; push catatan ada di NTF (O14, notifikasi.md).
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo dan SETELAH "OK" ketua.
-- Pembatalan: supabase/migrations/20261109_04_catatan_fungsi_batal.sql
-- Cek hasil: supabase/templates/20261109_04_catatan_fungsi_cek.sql
-- Tanpa data nyata.
--
-- Yang BARU: HANYA dua fungsi, `public.catatan_tambah(uuid, uuid, text)` dan `public.catatan_dibaca(uuid, uuid)`.
-- Yang SENGAJA TIDAK DISENTUH: semua tabel dan pagarnya (`catatan_order` dan `baca_catatan` sudah dibuat di ORD.01),
--   semua hak tabel, `pengaturan`, `order_buat`, `order_detail`, fungsi lain, `kedai/index.ts`, dan berkas aplikasi.
--   Tidak ada `ALTER`, tidak ada perubahan data yang sudah ada.
--
-- Keputusan yang berlaku (order.md O12, O14, database.md bagian 4 dan 5, security.md SEC-05, SEC-09, SEC-15, SEC-16, SEC-19):
--   - Catatan boleh ditambah oleh customer PEMILIK order dan OWNER; penjaga hanya membaca.
--   - Boleh hanya selama order berstatus Menunggu atau Disetujui. Diproses ke atas = terkunci; bila status
--     dimundurkan atau dialihkan ke Disetujui, terbuka lagi (cek status dilakukan tiap kali, tidak ada tanda kunci).
--   - Order Ditolak atau Dibatalkan: catatan ditolak (security.md blok 8 Nov 2026, SEC-16).
--   - Catatan tidak bisa diedit atau dihapus (hak tabel hanya SELECT dan INSERT).
--   - Batas `catatan_maks_karakter` dan `catatan_maks_per_order` dibaca dari `pengaturan`, tidak ditulis mati.
--   - Waktu dari jam server (`now()` lewat default kolom); nama dan peran penulis disalin dari server.
--   - `p_akun` HARUS dari token login (diambil `kedai`), bukan dari aplikasi.
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   - Batas jumlah (`catatan_maks_per_order`) menghitung SEMUA catatan order itu, termasuk catatan awal dari `order_buat`.
--   - Isi dipangkas dengan cara yang sama seperti `order_buat` (spasi, tab, dan baris kosong di tepi); baris baru
--     di dalam isi dibiarkan. Isi kosong sesudah dipangkas = galat `catatan_kosong`.
--   - Baris order dikunci (`FOR UPDATE`) di `catatan_tambah`, seperti `order_batal`, supaya "tambah catatan" dan
--     "Mulai proses" yang bersamaan hanya satu yang menang, dan batas jumlah tidak bisa dilewati dua permintaan sekaligus.
--     Fungsi tidak mengubah kolom order apa pun dan tidak menulis `riwayat_status` (catatan bukan perubahan status).
--   - Urutan cek: akun, peran, pengaturan, isi, lalu order (kepemilikan sebelum status), supaya customer tidak bisa
--     menebak status order milik orang lain (SEC-05, SEC-09).
--   - Galat status memakai kode yang sudah ada bila cocok: `sudah_ditolak`, `sudah_dibatalkan`; Diproses ke atas
--     dan Selesai memakai kode baru `catatan_terkunci`.
--   - `catatan_dibaca` memakai aturan lihat yang sama dengan `order_detail` (O11): customer hanya miliknya, penjaga
--     Disetujui ke atas, owner semua. Yang tidak boleh dilihat dijawab `order_tidak_ditemukan`.
--   - `catatan_dibaca` hanya menaikkan penunjuk (`catatan_terakhir_id` tidak pernah mundur) dan tidak menulis apa pun
--     bila tidak ada kemajuan. Order tanpa satu pun catatan: sukses tanpa menulis (kolom penunjuk wajib terisi).
--   - Penunjuk dihitung dari catatan terbaru di order itu saat dipanggil (bukan dari id yang dikirim aplikasi).
--
-- Balasan (dibungkus `kedai` di giliran 2):
--   catatan_tambah -> { catatan: { id, nama_penulis, peran_penulis, isi, waktu },
--                       order: { id, nomor, status }, jumlah_catatan }
--   catatan_dibaca -> { order_id, catatan_terakhir_id (null bila order belum punya catatan) }
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai` di giliran 2:
--   catatan_tambah: akun_nonaktif, profil_tidak_ada, peran_tidak_boleh (penjaga), catatan_kosong,
--     catatan_terlalu_panjang, catatan_terlalu_banyak, order_tidak_ditemukan (tidak ada atau bukan milik customer itu),
--     sudah_ditolak, sudah_dibatalkan, catatan_terkunci (Diproses, Diantar, Siap diambil, Siap disajikan, Selesai).
--   catatan_dibaca: akun_nonaktif, profil_tidak_ada, order_tidak_ditemukan.
--   Sengaja tidak dipetakan (jadi galat umum 500, seperti aksi order lain): id_kosong, pengaturan_rusak.

BEGIN;

-- ============================================================
-- 1. catatan_tambah (customer pemilik dan owner): atomik. Cek akun, peran, isi, kepemilikan, status, dan batas;
--    kunci baris order; simpan catatan. Mengembalikan catatan baru, ringkasan order, dan jumlah catatan.
-- ============================================================
CREATE FUNCTION public.catatan_tambah(
  p_akun     uuid,
  p_order_id uuid,
  p_isi      text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_peran      text;
  v_aktif      boolean;
  v_nama       text;
  v_o          public."order"%ROWTYPE;
  v_isi        text;
  v_cat_maks   integer;
  v_cat_n_maks integer;
  v_jumlah     integer;
  v_cid        bigint;
  v_waktu      timestamptz;
BEGIN
  IF p_akun IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Peran dan nama dari server: ada baris di staf = staf (nama dari staf); tidak ada = customer (nama dari profil)
  SELECT s.peran, s.aktif, s.nama_tampilan
    INTO v_peran, v_aktif, v_nama
    FROM public.staf s
   WHERE s.id = p_akun;
  IF FOUND THEN
    IF NOT v_aktif THEN
      RAISE EXCEPTION 'akun_nonaktif';
    END IF;
  ELSE
    SELECT p.nama_tampilan
      INTO v_nama
      FROM public.profil p
     WHERE p.id = p_akun;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'profil_tidak_ada';
    END IF;
    v_peran := 'customer';
  END IF;

  -- Penjaga hanya membaca (O12, SEC-16)
  IF v_peran NOT IN ('customer', 'owner') THEN
    RAISE EXCEPTION 'peran_tidak_boleh';
  END IF;

  -- Batas dibaca dari pengaturan, tidak ditulis mati (AGENTS.md bagian 1)
  SELECT
    max(g.nilai::integer) FILTER (WHERE g.kunci = 'catatan_maks_karakter'),
    max(g.nilai::integer) FILTER (WHERE g.kunci = 'catatan_maks_per_order')
    INTO v_cat_maks, v_cat_n_maks
    FROM public.pengaturan g
   WHERE g.kunci IN ('catatan_maks_karakter', 'catatan_maks_per_order');
  IF COALESCE(v_cat_maks, 0) < 1 OR COALESCE(v_cat_n_maks, 0) < 1 THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;

  -- Isi: dipangkas seperti order_buat; kosong ditolak; panjang dicek dari pengaturan
  v_isi := btrim(COALESCE(p_isi, ''), E' \t\r\n');
  IF v_isi = '' THEN
    RAISE EXCEPTION 'catatan_kosong';
  END IF;
  IF char_length(v_isi) > v_cat_maks THEN
    RAISE EXCEPTION 'catatan_terlalu_panjang';
  END IF;

  -- Kunci baris order: tambah catatan dan ubah status bersamaan hanya satu yang menang (O7, O12)
  SELECT o.*
    INTO v_o
    FROM public."order" o
   WHERE o.id = p_order_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  -- Customer hanya di order MILIKNYA; order orang lain = galat yang sama dengan "tidak ada" (SEC-05, SEC-09)
  IF v_peran = 'customer' AND v_o.pemesan IS DISTINCT FROM p_akun THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  -- Status: hanya Menunggu atau Disetujui (O12, SEC-16)
  IF v_o.status = 'Ditolak' THEN
    RAISE EXCEPTION 'sudah_ditolak';
  ELSIF v_o.status = 'Dibatalkan' THEN
    RAISE EXCEPTION 'sudah_dibatalkan';
  ELSIF v_o.status NOT IN ('Menunggu', 'Disetujui') THEN
    RAISE EXCEPTION 'catatan_terkunci';
  END IF;

  -- Batas jumlah per order (termasuk catatan awal). Aman dari dua permintaan sekaligus karena baris order terkunci.
  SELECT count(*)
    INTO v_jumlah
    FROM public.catatan_order c
   WHERE c.order_id = v_o.id;
  IF v_jumlah >= v_cat_n_maks THEN
    RAISE EXCEPTION 'catatan_terlalu_banyak';
  END IF;

  -- Waktu dari default kolom (now() server, SEC-19); id dari urutan otomatis
  INSERT INTO public.catatan_order (order_id, penulis, nama_penulis, peran_penulis, isi)
  VALUES (v_o.id, p_akun, v_nama, v_peran, v_isi)
  RETURNING id, waktu INTO v_cid, v_waktu;

  RETURN jsonb_build_object(
    'catatan', jsonb_build_object(
      'id',            v_cid,
      'nama_penulis',  v_nama,
      'peran_penulis', v_peran,
      'isi',           v_isi,
      'waktu',         v_waktu
    ),
    'order', jsonb_build_object(
      'id',     v_o.id,
      'nomor',  v_o.nomor,
      'status', v_o.status
    ),
    'jumlah_catatan', v_jumlah + 1
  );
END;
$$;

-- ============================================================
-- 2. catatan_dibaca (customer pemilik, owner, penjaga): menandai catatan terbaru di order sebagai sudah dibaca
--    oleh akun itu. Penunjuk hanya maju. Aturan lihat sama dengan order_detail (O11).
-- ============================================================
CREATE FUNCTION public.catatan_dibaca(
  p_akun     uuid,
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_peran    text;
  v_aktif    boolean;
  v_o_id     uuid;
  v_terbaru  bigint;
  v_penunjuk bigint;
BEGIN
  IF p_akun IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  SELECT s.peran, s.aktif
    INTO v_peran, v_aktif
    FROM public.staf s
   WHERE s.id = p_akun;
  IF FOUND THEN
    IF NOT v_aktif THEN
      RAISE EXCEPTION 'akun_nonaktif';
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.profil p WHERE p.id = p_akun) THEN
      RAISE EXCEPTION 'profil_tidak_ada';
    END IF;
    v_peran := 'customer';
  END IF;

  -- Visibilitas (O11): customer hanya miliknya, penjaga Disetujui ke atas, owner semua
  SELECT o.id
    INTO v_o_id
    FROM public."order" o
   WHERE o.id = p_order_id
     AND CASE v_peran
           WHEN 'customer' THEN o.pemesan = p_akun
           WHEN 'penjaga'  THEN o.status NOT IN ('Menunggu', 'Ditolak', 'Dibatalkan')
           WHEN 'owner'    THEN true
           ELSE false
         END;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  -- Catatan terbaru di order ini, dihitung server (bukan dari aplikasi)
  SELECT max(c.id)
    INTO v_terbaru
    FROM public.catatan_order c
   WHERE c.order_id = v_o_id;

  -- Belum ada catatan: tidak ada yang ditandai (kolom penunjuk wajib terisi)
  IF v_terbaru IS NULL THEN
    RETURN jsonb_build_object('order_id', v_o_id, 'catatan_terakhir_id', NULL);
  END IF;

  -- Penunjuk hanya maju: baris baru, atau naik bila ada catatan yang lebih baru; selain itu tidak menulis apa pun
  INSERT INTO public.baca_catatan AS b (akun, order_id, catatan_terakhir_id)
  VALUES (p_akun, v_o_id, v_terbaru)
  ON CONFLICT (akun, order_id) DO UPDATE
    SET catatan_terakhir_id = EXCLUDED.catatan_terakhir_id,
        waktu               = now()
  WHERE b.catatan_terakhir_id < EXCLUDED.catatan_terakhir_id;

  SELECT b.catatan_terakhir_id
    INTO v_penunjuk
    FROM public.baca_catatan b
   WHERE b.akun = p_akun
     AND b.order_id = v_o_id;

  RETURN jsonb_build_object('order_id', v_o_id, 'catatan_terakhir_id', v_penunjuk);
END;
$$;

-- ============================================================
-- 3. Hak EXECUTE: cabut semua dulu, lalu beri hanya ke service_role (AGENTS.md bagian 7).
-- ============================================================
REVOKE ALL ON FUNCTION public.catatan_tambah(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.catatan_dibaca(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.catatan_tambah(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.catatan_dibaca(uuid, uuid)       TO service_role;

COMMIT;
