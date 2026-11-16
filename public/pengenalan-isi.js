/* public/pengenalan-isi.js
 *
 * ISI layar "Pengenalan Aplikasi" (docs/pengenalan.md). Berkas ini HANYA data teks.
 * Logika layar ada di pengenalan.js, gaya di pengenalan.css.
 *
 * CARA MEREVISI (cukup ubah kata-katanya, struktur jangan diubah):
 *   - Tiap topik = satu blok { kunci, judul, isi: [ ... ] }.
 *   - Tiap teks di dalam isi = satu paragraf (atau satu baris langkah).
 *   - Jangan menghapus tanda kutip, koma, atau kurung siku di ujung baris.
 *   - Di dalam teks, gunakan kutip dua (") bila perlu; JANGAN pakai tanda petik satu (').
 *
 * PENANDA FORMAT (tidak boleh bersarang):
 *   **tebal**           -> huruf tebal
 *   *miring*            -> huruf miring
 *   {marun|teks}        -> warna marun
 *   {merah|teks}        -> warna merah (untuk catatan penting)
 *   {hijau|teks}        -> warna hijau (untuk kabar baik)
 *
 * ATURAN ISI (docs/pengenalan.md PG9 dan PG10):
 *   - Tanpa nomor WA, rekening, QRIS, alamat, tautan aplikasi, atau data pribadi.
 *   - Tanpa angka yang mudah berubah. Pakai kata "biasanya" untuk hal yang tergantung HP.
 *   - Jangan memakai warna sebagai satu-satunya penanda: awali dengan kata seperti "Catatan".
 *
 * STATUS DRAF (16 Nov 2026):
 *   - Topik 4 (iPhone) dan bagian iPhone di topik 6, 7, dan 10 BELUM dites di perangkat nyata.
 *     Perlu dicek ke pemakai iPhone (PGN.05) sebelum diandalkan.
 *   - Nama menu browser (Chrome, Safari) bisa berubah antar versi; cek ulang saat PGN.04 dan PGN.05.
 */
window.KedaiPengenalanIsi = [
  {
    kunci: "play-store",
    judul: "Kok aplikasi ini tidak ada di Play Store?",
    isi: [
      "**Ini aplikasi resmi Kedai ChATA.** Aplikasi ini dibuat sebagai aplikasi web (sering disebut PWA), jadi dibuka dan dipasang langsung dari browser di HP Anda, tanpa lewat Play Store atau App Store.",
      "Karena itu aplikasi ini memang **tidak ada** di toko aplikasi, dan itu normal. Anda tidak perlu mengunduh apa pun dari toko.",
      "{merah|Catatan:} pastikan Anda membukanya dari tautan yang dibagikan perwakilan ChATA. Jangan memasang aplikasi lain yang mengaku sebagai ChATA.",
    ],
  },
  {
    kunci: "harus-dipasang",
    judul: "Apakah harus dipasang?",
    isi: [
      "{marun|Tidak harus.} Aplikasi ini bisa langsung dipakai lewat browser (misalnya Chrome), sama seperti membuka situs biasa, tanpa dipasang.",
      "Dipasang ke layar utama hanya supaya lebih praktis: ada ikon ChATA di HP seperti aplikasi lain, dan terbuka layar penuh.",
      "{merah|Catatan untuk iPhone:} agar notifikasi bisa jalan, aplikasi perlu dipasang ke layar utama. Penjelasannya ada di topik Notifikasi.",
    ],
  },
  {
    kunci: "pasang-android",
    judul: "Cara memasang di Android",
    isi: [
      "1. Buka tautan aplikasi di **Chrome**.",
      "2. Ketuk **titik tiga** di pojok kanan atas.",
      "3. Pilih **Instal aplikasi** atau **Tambahkan ke layar utama**. Tulisan menunya bisa sedikit berbeda di tiap HP.",
      "4. Ketuk **Instal** (atau **Tambahkan**). Ikon ChATA akan muncul di layar utama.",
      "Tidak ada unduhan besar dan tidak membuka Play Store.",
    ],
  },
  {
    kunci: "pasang-iphone",
    judul: "Cara memasang di iPhone",
    isi: [
      "1. Buka tautan aplikasi di **Safari**.",
      "2. Ketuk tombol **Bagikan** (gambar kotak dengan panah ke atas).",
      "3. Gulir ke bawah, pilih **Tambah ke Layar Utama**.",
      "4. Ketuk **Tambah**. Ikon ChATA akan muncul di layar utama.",
      "{merah|Catatan:} langkah ini bisa sedikit berbeda di tiap versi iPhone. Bila menunya tidak sama, tanyakan ke perwakilan ChATA lewat WhatsApp.",
    ],
  },
  {
    kunci: "update",
    judul: "Apakah harus update?",
    isi: [
      "{hijau|Tidak perlu update manual.} Setiap kali aplikasi dibuka dengan internet, aplikasi mengambil versi terbarunya sendiri. Tidak ada tombol Update dan tidak ada pemberitahuan update dari toko aplikasi.",
      "Bila tampilan terasa belum berubah padahal ada kabar pembaruan, tutup aplikasi sepenuhnya lalu buka lagi.",
    ],
  },
  {
    kunci: "login-tersimpan",
    judul: "Apakah harus ketik email dan password terus?",
    isi: [
      "**Biasanya tidak.** Setelah Anda masuk, aplikasi mengingat Anda di HP itu. Saat dibuka lagi, Anda biasanya langsung masuk tanpa mengetik apa-apa.",
      "Anda baru perlu masuk lagi bila:",
      "- Anda menekan tombol **Keluar**,",
      "- data atau riwayat browser dihapus, atau",
      "- Anda berganti HP atau browser. Di iPhone, aplikasi yang dipasang ke layar utama mungkin meminta masuk sekali lagi.",
      "Jadi bila tidak ingin mengetik lagi, **jangan tekan Keluar** kecuali perlu.",
      'Kadang browser bertanya **"Simpan password?"**. Itu tawaran dari browser, bukan dari aplikasi. Bila Anda ketuk Simpan, kolom email dan password terisi otomatis saat harus masuk lagi. Bila Anda abaikan, tidak apa-apa: aplikasi tetap mengingat Anda seperti di atas, hanya saja saat harus masuk lagi Anda mengetik sendiri.',
      "{merah|Tips:} simpan email dan password Anda di tempat yang aman. Bila lupa, gunakan tombol **Lupa password?** di layar Masuk.",
    ],
  },
  {
    kunci: "notifikasi",
    judul: "Notifikasi: kapan muncul dan kenapa kadang telat?",
    isi: [
      "Notifikasi memberi kabar saat pesanan Anda berubah, bahkan saat aplikasi sedang ditutup.",
      "**Notifikasi hanya jalan bila Anda mengizinkannya.** Saat ada pertanyaan izin notifikasi, ketuk **Izinkan**. Bila terlanjur menolak, izinnya bisa dibuka lagi lewat pengaturan situs atau aplikasi di HP Anda.",
      "{merah|Catatan untuk iPhone:} notifikasi hanya bisa jalan bila iPhone memakai iOS 16.4 atau lebih baru **dan** aplikasi sudah dipasang ke layar utama (lihat topik cara memasang di iPhone).",
      "Kadang notifikasi telat beberapa menit, terutama bila HP sedang dalam mode hemat baterai. Itu bukan berarti pesanan bermasalah: status pesanan selalu benar di aplikasi. Anda juga bisa mengetuk tombol **Segarkan** atau membuka **Kotak masuk** (menu garis tiga) untuk melihat kabar terbaru.",
    ],
  },
  {
    kunci: "aman",
    judul: "Apakah aman?",
    isi: [
      "Password Anda dikelola oleh layanan keamanan akun dan **tidak disimpan sebagai tulisan biasa**. Pihak warung tidak bisa melihat password Anda.",
      "Nomor WhatsApp dan alamat Anda hanya terlihat oleh Anda dan perwakilan ChATA yang menangani pesanan.",
      "Isi notifikasi sengaja dibuat umum, **tanpa nama, alamat, atau nomor WhatsApp** Anda, jadi aman walau terlihat di layar kunci.",
      "{hijau|Aplikasi ini tidak pernah meminta nomor kartu atau PIN Anda.} Pembayaran mengikuti arahan perwakilan ChATA lewat WhatsApp.",
    ],
  },
  {
    kunci: "ringan",
    judul: "Apakah berat di HP?",
    isi: [
      "Ukuran aplikasi ini kecil, jadi biasanya tidak memakan banyak ruang di HP.",
      "Aplikasi tidak berjalan terus-menerus di latar belakang untuk mengecek pesanan. Kabar terbaru diambil saat Anda membuka aplikasi, saat Anda mengetuk **Segarkan**, atau saat notifikasi masuk. Karena itu pemakaian kuota internet dan baterainya biasanya kecil.",
    ],
  },
  {
    kunci: "hapus",
    judul: "Bagaimana cara menghapus kalau tidak mau lagi?",
    isi: [
      "**Android:** tekan lama ikon ChATA di layar utama, lalu pilih **Copot pemasangan** atau **Hapus**. Nama menunya bisa berbeda di tiap HP.",
      "**iPhone:** tekan lama ikon ChATA, lalu pilih **Hapus App** (atau **Hapus dari Layar Utama**).",
      "{hijau|Data pesanan Anda tidak ikut hilang,} karena tersimpan di server ChATA, bukan di HP. Anda bisa memasang dan masuk lagi kapan saja dengan email dan password yang sama.",
      "Bila ingin aplikasi tidak mengingat Anda di HP itu, tekan **Keluar** dulu sebelum menghapus.",
    ],
  },
];
