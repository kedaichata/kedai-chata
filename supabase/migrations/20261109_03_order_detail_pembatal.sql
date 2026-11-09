-- supabase/migrations/20261109_03_order_detail_pembatal.sql
-- ORD.17: `order_detail` menambah dua isian di balasan, supaya customer pemilik order yang Dibatalkan tahu
-- siapa yang membatalkan: `dibatalkan_oleh` ('customer' atau 'owner') dan `dibatalkan_oleh_nama`
-- (nama tampilan owner, hanya bila pembatalnya owner).
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo dan SETELAH "OK" ketua.
-- Pembatalan: supabase/migrations/20261109_03_order_detail_pembatal_batal.sql (kembali ke versi ORD.16).
-- Cek hasil: supabase/templates/20261109_03_order_detail_pembatal_cek.sql
-- Tanpa data nyata.
--
-- DASAR: versi ORD.16 (20261109_02_order_detail_alasan_alih.sql), BUKAN versi asli 20261108_02, supaya
--   isian `alasan_alih` tidak hilang. Hanya tambahan: dua variabel, satu blok pembaca, dua isian di balasan.
-- Yang BERUBAH: HANYA fungsi `public.order_detail(uuid, uuid)` (CREATE OR REPLACE; nama, parameter, dan
--   tipe kembalian sama). Dipakai SEMUA peran, jadi tes di customer, owner, dan penjaga.
-- Yang SENGAJA TIDAK DISENTUH: semua tabel dan pagarnya, data order, `order_batal` (sudah mencatat pembatal di
--   riwayat_status.oleh), fungsi lain, `kedai/index.ts`, dan pengaturan.
-- Isian baru terisi hanya untuk customer pemilik order berstatus Dibatalkan; selain itu null.
-- Keputusan ketua 9 Nov 2026: nama owner yang membatalkan tampil ke customer pemilik order (alasan: ada 5 owner,
--   tanpa nama customer tidak tahu siapa yang dihubungi). Ini membuka satu data yang dulu hanya untuk owner
--   (nama staf); riwayat lengkap dan `pemutus_nama` tetap tertutup untuk customer.
-- Catatan: nama mengikuti nama tampilan owner saat ini (bukan salinan saat pembatalan).
-- Hak EXECUTE dipasang ulang persis seperti pola lama: hanya service_role.

BEGIN;

CREATE OR REPLACE FUNCTION public.order_detail(
  p_akun     uuid,
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_peran    text;
  v_aktif    boolean;
  v_o        public."order"%ROWTYPE;
  v_item     jsonb;
  v_catatan  jsonb;
  v_riwayat  jsonb := '[]'::jsonb;
  v_alasan_alih text;  -- ORD.16
  v_batal_oleh  text;  -- ORD.17
  v_batal_nama  text;  -- ORD.17
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
  SELECT o.*
    INTO v_o
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

  SELECT COALESCE(
           jsonb_agg(
             jsonb_build_object(
               'nama_menu',    i.nama_menu,
               'harga_satuan', i.harga_satuan,
               'jumlah',       i.jumlah,
               'subtotal',     i.subtotal,
               'pilihan',      to_jsonb(i.pilihan)
             )
             ORDER BY lower(i.nama_menu), array_to_string(i.pilihan, '|'), i.id
           ),
           '[]'::jsonb
         )
    INTO v_item
    FROM public.order_item i
   WHERE i.order_id = v_o.id;

  SELECT COALESCE(
           jsonb_agg(
             jsonb_build_object(
               'id',            c.id,
               'nama_penulis',  c.nama_penulis,
               'peran_penulis', c.peran_penulis,
               'isi',           c.isi,
               'waktu',         c.waktu
             )
             ORDER BY c.id
           ),
           '[]'::jsonb
         )
    INTO v_catatan
    FROM public.catatan_order c
   WHERE c.order_id = v_o.id;

  -- Riwayat status lengkap (siapa dan kapan, O10): hanya owner
  IF v_peran = 'owner' THEN
    SELECT COALESCE(
             jsonb_agg(
               jsonb_build_object(
                 'status_asal',   r.status_asal,
                 'status_tujuan', r.status_tujuan,
                 'oleh_nama',     COALESCE(sf.nama_tampilan, pr.nama_tampilan),
                 'waktu',         r.waktu,
                 'keterangan',    r.keterangan
               )
               ORDER BY r.id
             ),
             '[]'::jsonb
           )
      INTO v_riwayat
      FROM public.riwayat_status r
      LEFT JOIN public.staf   sf ON sf.id = r.oleh
      LEFT JOIN public.profil pr ON pr.id = r.oleh
     WHERE r.order_id = v_o.id;
  END IF;

  -- ORD.16: alasan alih hari TERAKHIR, hanya untuk customer pemilik order (penjaga tidak melihat alasan,
  -- security.md blok 8 Nov 2026) dan hanya selama order masih berjalan. Dibaca dari teks
  -- riwayat_status.keterangan yang ditulis `order_alih_hari` ("Alih hari <lama> ke <baru>[, jam ...][. Alasan: ...]").
  -- PERINGATAN: bila format keterangan di `order_alih_hari` diubah, bagian ini harus ikut diubah.
  -- Hanya baris berformat "Alih hari YYYY-MM-DD ke " yang dibaca; alasan = teks sesudah ". Alasan: " yang pertama
  -- (awalan hanya berisi tanggal dan jam, jadi tanda itu tidak mungkin muncul lebih awal).
  -- Alih hari terakhir tanpa alasan: kosong (alasan alih hari sebelumnya tidak ikut dikirim).
  IF v_peran = 'customer'
     AND v_o.status IN ('Disetujui', 'Diproses', 'Diantar', 'Siap diambil', 'Siap disajikan') THEN
    SELECT nullif(
             btrim(
               CASE WHEN position('. Alasan: ' IN r.keterangan) > 0
                    THEN substr(r.keterangan, position('. Alasan: ' IN r.keterangan) + 10)
               END,
               E' \t\r\n'
             ),
             ''
           )
      INTO v_alasan_alih
      FROM public.riwayat_status r
     WHERE r.order_id = v_o.id
       AND r.keterangan ~ '^Alih hari [0-9]{4}-[0-9]{2}-[0-9]{2} ke '
     ORDER BY r.id DESC
     LIMIT 1;
  END IF;

  -- ORD.17: siapa yang membatalkan, hanya untuk customer pemilik order yang berstatus Dibatalkan.
  -- Dibaca dari baris riwayat_status pembatalan terakhir (`order_batal` selalu mencatat `oleh` = akun pembatal).
  -- 'customer' bila pembatalnya pemesan order itu; selain itu 'owner' beserta nama tampilannya.
  -- Bukan dari order.pemutus_nama: itu owner yang dulu menekan Setujui, bukan yang membatalkan.
  -- Nama owner hanya sampai ke customer pemilik order ini (keputusan ketua 9 Nov 2026); penjaga tidak melihat
  -- order Dibatalkan, dan owner sudah punya riwayat lengkap. Tanpa baris riwayat: kosong (layar tidak menampilkan apa-apa).
  IF v_peran = 'customer' AND v_o.status = 'Dibatalkan' THEN
    SELECT CASE WHEN r.oleh = v_o.pemesan THEN 'customer' ELSE 'owner' END,
           CASE WHEN r.oleh IS DISTINCT FROM v_o.pemesan THEN sf.nama_tampilan END
      INTO v_batal_oleh, v_batal_nama
      FROM public.riwayat_status r
      LEFT JOIN public.staf sf ON sf.id = r.oleh
     WHERE r.order_id = v_o.id
       AND r.status_tujuan = 'Dibatalkan'
     ORDER BY r.id DESC
     LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'id',               v_o.id,
    'nomor',            v_o.nomor,
    'tipe',             v_o.tipe,
    'status',           v_o.status,
    'hari_target',      v_o.hari_target,
    'jam_permintaan',   to_char(v_o.jam_permintaan, 'HH24:MI'),
    'nama_pemesan',     v_o.nama_pemesan,
    'nomor_wa_pemesan', v_o.nomor_wa_pemesan,
    'alias_alamat',     v_o.alias_alamat,
    'isi_alamat',       v_o.isi_alamat,
    'total',            v_o.total,
    'alasan_tolak',     v_o.alasan_tolak,
    'dibuat_oleh_nama', v_o.dibuat_oleh_nama,
    'dibuat_pada',      v_o.dibuat_pada,
    'diputuskan_pada',  v_o.diputuskan_pada,
    'diubah_pada',      v_o.diubah_pada,
    'metode_bayar',     CASE WHEN v_peran IN ('owner', 'penjaga') THEN v_o.metode_bayar END,
    'pemutus_nama',     CASE WHEN v_peran = 'owner' THEN v_o.pemutus_nama END,
    'item',             v_item,
    'catatan',          v_catatan,
    'riwayat',          v_riwayat,
    'alasan_alih',      v_alasan_alih,
    'dibatalkan_oleh',      v_batal_oleh,
    'dibatalkan_oleh_nama', v_batal_nama
  );
END;
$$;

REVOKE ALL ON FUNCTION public.order_detail(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.order_detail(uuid, uuid) TO service_role;

COMMIT;
