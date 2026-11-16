#!/bin/zsh
# supabase/templates/20261116_sec03_panggil_langsung.sh
# SEC-03: panggil tabel dan fungsi langsung dengan kunci publishable (peran anon).
# Hanya membaca URL dan kunci publishable dari public/config.js (memang publik).
# TIDAK mencetak isi tabel: pembacaan tabel memakai limit=0, jadi isinya selalu kosong
# walau diizinkan. Hasil 200 berarti tabel TERBUKA (gagal). Tidak ada tulis-database.
# Jalankan dari folder repo ChATA: zsh supabase/templates/20261116_sec03_panggil_langsung.sh

CFG="public/config.js"
if [ ! -f "$CFG" ]; then
  echo "Berkas $CFG tidak ditemukan. Jalankan dari folder repo ChATA."
  exit 1
fi

HOST=$(grep -o '[a-z0-9]*\.supabase\.co' "$CFG" | head -1)
KEY=$(grep -o 'sb_publishable_[A-Za-z0-9_-]*' "$CFG" | head -1)
if [ -z "$HOST" ] || [ -z "$KEY" ]; then
  echo "URL project atau kunci publishable tidak ditemukan di $CFG."
  exit 1
fi
URL="https://$HOST"

echo "=== A. Baca tabel langsung (benar: 401 atau 403; 200 = GAGAL) ==="
for t in order order_item profil alamat staf catatan_order inbox gelar bantuan pengaturan foto_bukti langganan_push pelanggan_luar; do
  kode=$(curl -s -o /dev/null -w "%{http_code}" \
    "$URL/rest/v1/$t?select=*&limit=0" -H "apikey: $KEY")
  echo "tabel $t -> HTTP $kode"
done

echo ""
echo "=== B. Panggil fungsi langsung (benar: 401, 403, atau 404; 200 = GAGAL) ==="
for f in order_daftar order_buat order_setuju gelar_saya inbox_daftar inbox_tulis wa_nomor_ambil push_langganan_ambil ringkasan_7hari buat_profil rls_auto_enable; do
  hasil=$(curl -s -w " [HTTP %{http_code}]" -X POST \
    "$URL/rest/v1/rpc/$f" -H "apikey: $KEY" -H "Content-Type: application/json" -d '{}')
  echo "fungsi $f -> $(echo "$hasil" | head -c 160)"
done
