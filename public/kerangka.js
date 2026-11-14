// public/kerangka.js
// KRG.01: kerangka layar utama per peran (desain.md DS9, DS10).
// Layar "sementara" di index.html kini menjadi kerangka: bilah atas, panel isi, dan navigasi bawah.
// Dimuat SETELAH akun.js dan menu.js. akun.js memanggil window.KedaiKerangka.atur(peran) setiap kali
// status dimuat (masuk, Segarkan, kembali dari layar lain) dan .reset() saat Keluar.
//
// HOM.01: tab Home menjadi tab PERTAMA (paling kiri) untuk tiga peran dan jadi halaman pertama setelah masuk.
// Tab Lainnya (owner) dan Akun (customer, penjaga) dikeluarkan dari daftar tab (baris lama dijadikan komentar).
// Tab Home memakai panel "akun" (blok sapaan, Buku alamat, Pengaturan akun, Keluar) untuk SEMUA peran.
// Panel "lainnya" tetap ada di HTML tetapi tidak terjangkau; isinya pindah ke Home di HOM.03 dan HOM.04.
//
// HOM.02: tab Home menampilkan kartu sampul, sapaan "Halo, {nama}, selamat datang di Kedai ChATA", dan
// lencana peran. Nama datang dari akun.js sebagai argumen kedua atur(peran, nama); bila tidak ada,
// sapaan tampil tanpa nama. Tidak ada panggilan server baru (HM10).
//
// HOM.03 dan HOM.04: Home berisi tombol Bantuan ("Segera", tidak bisa diketuk), bagian Pelanggan (owner,
// "Segera"), dan daftar pengaturan akun per peran. Item ditampilkan menurut peran lewat atribut data-peran
// di index.html. Item yang membuka layar Akun dan Buku alamat memakai layar yang sudah ada
// (window.KedaiAkunMenu.tampil dan window.KedaiAlamat.tampil), tanpa panggilan server baru (HM10).
//
// MNU.04: tab Pesan (customer) memakai panel "pesan": daftar menu hanya dilihat, dimuat lewat
// KedaiMenu.tampilPelanggan saat tab dibuka dan lewat Segarkan. Tombol pilih menyusul di ORD.
//
// ORD.03: tab Pesan juga memanggil window.KedaiPesan (pesan.js): .tampil() saat tab dibuka (layar "selesai"
// tidak ditahan) dan .reset() saat Keluar (keranjang, alamat, dan hasil order dikosongkan).
//
// ORD.06: tab Order Masuk (owner) memakai panel "ordermasuk" (orderowner.js): window.KedaiOrderOwner
// .tampilMasuk() saat tab dibuka dan lewat Segarkan, .reset() saat Keluar.
//
// ORD.06 (giliran 2): tab Semua Order (owner) memakai panel "semuaorder" (orderowner.js): window.KedaiOrderOwner
// .tampilSemua() saat tab dibuka dan lewat Segarkan. .reset() yang sama (Keluar) membersihkan kedua layar owner.
//
// ORD.08: tab Antrean (penjaga) memakai panel "antrean" (orderpenjaga.js): window.KedaiOrderPenjaga
// .tampil() saat tab dibuka dan lewat Segarkan, .reset() saat Keluar.
//
// ORD.13: tab Buat Order (owner) memakai panel "buatorder" (orderwakil.js: window.KedaiOrderWakil .tampil()/.reset()).
// Item Pelanggan di Home membuka tab tersembunyi "pelanggan" (panel "pelanggan", pelangganluar.js:
// window.KedaiPelangganLuar .tampil()/.reset()). Tab ini tidak punya tombol di navigasi bawah.
//
// DSN.08: tombol Keluar (ikon, lingkaran merah) di bilah atas, di kanan Segarkan. Diketuk: kotak konfirmasi
// "Yakin mau keluar?" (Batal = utama, Keluar = berpinggir merah). Keluar memanggil window.KedaiAkun.keluar
// (akun.js) yang sudah menghapus sesi, nama, dan sapaan. Tombol Keluar di Home disembunyikan di index.html.
// Bilah atas hanya ada di layar utama (layar-sementara), jadi sub-layar, Masuk, dan Daftar tidak punya tombol ini.
//
// BTN.03: layar Bantuan (bantuan.js) memakai tab tersembunyi "bantuan" (panel "bantuan", tanpa tombol di navigasi
// bawah, pola sama dengan tab "pelanggan"). Pintunya ikon ? di bilah atas (#tombol-bantuan-atas) dan tombol
// Bantuan di Home (data-aksi="bantuan"). Tab asal disimpan supaya Kembali (#bantuan-kembali, dibuat bantuan.js)
// membuka tab itu lagi, dan navigasi bawah tetap menandai tab asal. Ikon ? disembunyikan saat layar Bantuan terbuka.
// window.KedaiBantuan .tampil() dipanggil saat tab dibuka dan lewat Segarkan, .reset() saat Keluar.
//
// RKS.03: layar Ringkasan order 7 hari (owner) memakai tab tersembunyi "ringkasan" (panel "ringkasan", tanpa tombol
// di navigasi bawah, pola sama dengan tab "pelanggan"). Pintunya item "Ringkasan order 7 hari" di Home owner
// (data-aksi="ringkasan"); navigasi bawah tetap menandai Home. Tombol Kembali (#ringkasan-kembali, dibuat ringkasan.js)
// membuka Home lagi. window.KedaiRingkasan .tampil() dipanggil saat tab dibuka dan lewat Segarkan (jeda 5 detik diatur
// ringkasan.js), .reset() saat Keluar. Server yang menolak non-owner (SEC-36); menyembunyikan item hanya kemudahan.
//
// GLR.05 dan GLR.06: gelar customer (gelar.md GL17 sampai GL22). Layar Gelar Saya memakai tab tersembunyi "gelar"
// (panel "gelar", tanpa tombol di navigasi bawah, pola sama dengan tab "ringkasan"), khusus customer. Pintunya tombol
// "Gelar Saya" di Home (data-aksi="gelar"); navigasi bawah tetap menandai Home. atur() memanggil window.KedaiGelar.atur(peran, nama)
// sehingga gelar_saya dimuat SATU kali tiap balasan `status` dimuat (masuk, Segarkan); .tampil() hanya menggambar dari memori
// saat layar dibuka (tanpa panggilan server), .reset() saat Keluar. Tombol Kembali (#gelar-kembali, dibuat gelar.js) membuka Home.
// Server yang menolak non-customer (SEC-38); menyembunyikan tombol hanya kemudahan.
// NTF.04a: membuka layar dari notifikasi dan menyegarkan data saat push masuk (notifikasi.md NT8, NT10; Handoff #4).
// - sw.js membawa tujuan lewat alamat (?buka=order&id=... atau ?buka=antrean) bila aplikasi tertutup, atau lewat pesan
//   {jenis:"buka", tujuan, id} bila aplikasi sudah terbuka. Alamat dibaca saat berkas dimuat dan DIPAKAI setelah login
//   dan peran dikenal (atur dipanggil akun.js). Sesudah dipakai, ?buka= dan id dibuang dari alamat peramban.
// - Layar tujuan: customer ke Pesanan Saya, owner ke Order Masuk, penjaga ke Antrean. Layar order menyiapkan detailnya
//   lewat siapkanDetail/siapkanDaftar (tanpa panggilan server), lalu buka() memanggil tampil() yang sudah ada:
//   total hanya satu panggilan data. Id dari alamat atau pesan tidak dipercaya; server yang memutuskan boleh atau tidak.
// - Pesan {jenis:"segarkan"}: hanya layar order yang sedang terbuka dimuat ulang (satu panggilan, tanpa layar memuat penuh),
//   dibatasi sekitar 30 detik (NT10). Bila masih di dalam batas, dijadwalkan SATU penyegaran susulan di akhir batas
//   (bukan timer berulang). Aplikasi di latar belakang: ditandai, dan disegarkan sekali saat kembali ke layar.
//
// NTF.07: penyegaran saat kembali ke layar dan titik merah Kotak masuk (notifikasi.md NT10, NT12; inbox.md IB10).
// - Semua pemuatan lewat buka() (buka tab, Segarkan manual, dari notifikasi) kini menghidupkan jam NT10 (terakhirSegar).
// - Kembali ke layar TANPA penanda push: bila sudah lewat sekitar 30 detik sejak penyegaran terakhir, layar order dimuat
//   ulang dan titik merah disegarkan; bila belum, dilewati begitu saja (tanpa timer, NT3 dan NT10).
// - Titik merah (window.KedaiInbox.segarkanTitik, satu panggilan `status`) ikut disegarkan di SEMUA tab, sedangkan
//   muat ulang data hanya untuk empat layar order. Jalurnya sama dengan penyegaran karena push, jadi batas NT10 sama.
//
// Aturan yang dijaga:
// - Peran datang dari balasan server (aksi status) lewat akun.js; aplikasi tidak pernah mengirim peran.
//   Menyembunyikan tab di sini hanya kemudahan; yang menolak akses sebenarnya server.
// - Semua teks dipasang lewat textContent, bukan innerHTML.
// - Tab yang fiturnya belum dibuat tampil sebagai "Segera hadir" (satu panel dipakai bersama).
// - Saat Keluar, sapaan (berisi nama) dan data menu dibersihkan.

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A) {
    // akun.js belum termuat: window.KedaiKerangka tidak dibuat.
    return;
  }

  function el(id) {
    return document.getElementById(id);
  }

  // Tab per peran (DS10). `panel` = panel isi yang dipakai tab itu.
  // "segera" = fitur belum dibuat; panel nyata menyusul bersama fiturnya (menu, order, dll.).
  var TAB = {
    owner: [
      { id: "home", nama: "Home", panel: "akun" }, // HOM.01
      // ORD.06: { id: "order-masuk", nama: "Order Masuk", panel: "segera" },
      { id: "order-masuk", nama: "Order Masuk", panel: "ordermasuk" },
      // ORD.06: { id: "semua-order", nama: "Semua Order", panel: "segera" },
      { id: "semua-order", nama: "Semua Order", panel: "semuaorder" },
      // ORD.13: { id: "buat-order", nama: "Buat Order", panel: "segera" },
      { id: "buat-order", nama: "Buat Order", panel: "buatorder" },
      // ORD.13: layar Kelola Pelanggan, dibuka dari item Pelanggan di Home (tanpa tombol di navigasi bawah).
      { id: "pelanggan", nama: "Pelanggan", panel: "pelanggan" },
      // RKS.03: layar Ringkasan order 7 hari, dibuka dari item di Home (tanpa tombol di navigasi bawah).
      { id: "ringkasan", nama: "Ringkasan", panel: "ringkasan" },
      { id: "menu", nama: "Menu", panel: "menu" },
      { id: "bantuan", nama: "Bantuan", panel: "bantuan" }, // BTN.03
      // HOM.01: { id: "lainnya", nama: "Lainnya", panel: "lainnya" },
    ],
    customer: [
      { id: "home", nama: "Home", panel: "akun" }, // HOM.01
      // MNU.04: { id: "pesan", nama: "Pesan", panel: "segera" },
      { id: "pesan", nama: "Pesan", panel: "pesan" },
      // ORD.04: { id: "pesanan-saya", nama: "Pesanan Saya", panel: "segera" },
      { id: "pesanan-saya", nama: "Pesanan Saya", panel: "pesanan" },
      // GLR.06: layar Gelar Saya, dibuka dari tombol di Home (tanpa tombol di navigasi bawah).
      { id: "gelar", nama: "Gelar Saya", panel: "gelar" },
      { id: "bantuan", nama: "Bantuan", panel: "bantuan" }, // BTN.03
      // HOM.01: { id: "akun", nama: "Akun", panel: "akun" },
    ],
    penjaga: [
      { id: "home", nama: "Home", panel: "akun" }, // HOM.01
      // ORD.08: { id: "antrean", nama: "Antrean", panel: "segera" },
      { id: "antrean", nama: "Antrean", panel: "antrean" },
      { id: "bantuan", nama: "Bantuan", panel: "bantuan" }, // BTN.03
      // HOM.01: { id: "akun", nama: "Akun", panel: "akun" },
    ],
    // Peran tak dikenal: hanya Akun (supaya tetap bisa keluar), tanpa navigasi bawah.
    // HOM.01: lain: [{ id: "akun", nama: "Akun", panel: "akun" }],
    // BTN.03: lain: [{ id: "home", nama: "Home", panel: "akun" }],
    lain: [
      { id: "home", nama: "Home", panel: "akun" },
      { id: "bantuan", nama: "Bantuan", panel: "bantuan" }, // BTN.03
    ],
  };

  var NAV = {
    owner: "nav-owner",
    customer: "nav-customer",
    penjaga: "nav-penjaga",
  };

  // MNU.04: var PANEL = ["segera", "menu", "lainnya", "akun"];
  // ORD.04: var PANEL = ["segera", "menu", "lainnya", "akun", "pesan"];
  // ORD.06: var PANEL = ["segera", "menu", "lainnya", "akun", "pesan", "pesanan"];
  var PANEL = [
    "segera",
    "menu",
    "lainnya",
    "akun",
    "pesan",
    "pesanan",
    "ordermasuk",
    "semuaorder", // ORD.06 giliran 2
    "antrean", // ORD.08
    "buatorder", // ORD.13
    "pelanggan", // ORD.13
    "bantuan", // BTN.03
    "ringkasan", // RKS.03
    "gelar", // GLR.06
  ];

  // HOM.02: tulisan lencana peran di kartu sapaan (HM4). Peran tak dikenal: lencana disembunyikan.
  var LABEL_PERAN = {
    owner: "Owner",
    penjaga: "Penjaga",
    customer: "Customer",
  };

  var peran = null; // peran yang sedang dipasang; null = belum
  var tab = null; // id tab yang sedang terbuka; null = belum
  var tabAsalBantuan = null; // BTN.03: tab yang terbuka sebelum Bantuan, tujuan tombol Kembali

  function peranDikenal(p) {
    return Object.prototype.hasOwnProperty.call(TAB, p) ? p : "lain";
  }

  function cariTab(id) {
    var daftar = TAB[peran];
    for (var i = 0; i < daftar.length; i++) {
      if (daftar[i].id === id) return daftar[i];
    }
    return null;
  }

  function sembunyikanSemua() {
    for (var i = 0; i < PANEL.length; i++) {
      el("panel-" + PANEL[i]).hidden = true;
    }
    for (var k in NAV) {
      if (Object.prototype.hasOwnProperty.call(NAV, k)) {
        el(NAV[k]).hidden = true;
      }
    }
  }

  // Tandai tab aktif di navigasi bawah (emas terang + garis penanda lewat aria-current, DS4).
  function tandaiNav(idTab) {
    var idNav = NAV[peran];
    if (!idNav) return;
    var butir = el(idNav).querySelectorAll("[data-tab]");
    for (var i = 0; i < butir.length; i++) {
      if (butir[i].getAttribute("data-tab") === idTab) {
        butir[i].setAttribute("aria-current", "page");
      } else {
        butir[i].removeAttribute("aria-current");
      }
    }
  }

  // Buka satu tab: judul bilah atas, panel isi, dan tanda di navigasi.
  function buka(idTab) {
    var t = cariTab(idTab) || TAB[peran][0];
    tab = t.id;

    for (var i = 0; i < PANEL.length; i++) {
      el("panel-" + PANEL[i]).hidden = PANEL[i] !== t.panel;
    }
    el("kerangka-judul").textContent = t.nama;
    // ORD.13: tandaiNav(t.id); Kelola Pelanggan dibuka dari Home, jadi tab Home yang ditandai.
    // BTN.03: tandaiNav(t.id === "pelanggan" ? "home" : t.id);
    // BTN.03: layar Bantuan menandai tab asalnya di navigasi bawah, dan ikon ? disembunyikan selama Bantuan terbuka.
    var idTanda = t.id;
    if (t.id === "bantuan") idTanda = tabAsalBantuan || "home";
    if (idTanda === "pelanggan") idTanda = "home";
    if (idTanda === "ringkasan") idTanda = "home"; // RKS.03
    if (idTanda === "gelar") idTanda = "home"; // GLR.06
    tandaiNav(idTanda);
    el("tombol-bantuan-atas").hidden = t.id === "bantuan";

    if (t.panel === "segera") {
      el("segera-ket").textContent =
        t.nama + " belum tersedia. Fitur ini menyusul.";
    }
    window.scrollTo(0, 0);
    terakhirSegar = performance.now(); // NTF.07: tiap pemuatan lewat buka() menghidupkan jam batas NT10

    // Layar Kelola Menu memuat daftar saat dibuka (MN7: sekali saat dibuka dan lewat Segarkan).
    if (
      t.panel === "menu" &&
      window.KedaiMenu &&
      typeof window.KedaiMenu.tampil === "function"
    ) {
      window.KedaiMenu.tampil();
    }

    // MNU.04: daftar menu untuk customer (tab Pesan), dimuat saat dibuka dan lewat Segarkan.
    if (
      t.panel === "pesan" &&
      window.KedaiMenu &&
      typeof window.KedaiMenu.tampilPelanggan === "function"
    ) {
      window.KedaiMenu.tampilPelanggan();
    }

    // ORD.03: layar Pesan (keranjang dan form pesanan) di pesan.js.
    if (
      t.panel === "pesan" &&
      window.KedaiPesan &&
      typeof window.KedaiPesan.tampil === "function"
    ) {
      window.KedaiPesan.tampil();
    }

    // ORD.04: layar Pesanan Saya (daftar dan detail) di pesanan.js; dimuat saat tab dibuka dan lewat Segarkan.
    if (
      t.panel === "pesanan" &&
      window.KedaiPesanan &&
      typeof window.KedaiPesanan.tampil === "function"
    ) {
      window.KedaiPesanan.tampil();
    }

    // ORD.06: layar owner Order Masuk (daftar dan detail) di orderowner.js; dimuat saat tab dibuka dan lewat Segarkan.
    if (
      t.panel === "ordermasuk" &&
      window.KedaiOrderOwner &&
      typeof window.KedaiOrderOwner.tampilMasuk === "function"
    ) {
      window.KedaiOrderOwner.tampilMasuk();
    }

    // ORD.06 (giliran 2): layar owner Semua Order (filter, daftar, detail); dimuat saat tab dibuka dan lewat Segarkan.
    if (
      t.panel === "semuaorder" &&
      window.KedaiOrderOwner &&
      typeof window.KedaiOrderOwner.tampilSemua === "function"
    ) {
      window.KedaiOrderOwner.tampilSemua();
    }

    // ORD.08: layar penjaga Antrean (tab, daftar, detail) di orderpenjaga.js; dimuat saat tab dibuka dan lewat Segarkan.
    if (
      t.panel === "antrean" &&
      window.KedaiOrderPenjaga &&
      typeof window.KedaiOrderPenjaga.tampil === "function"
    ) {
      window.KedaiOrderPenjaga.tampil();
    }

    // ORD.13: wizard Buat Order wakil owner (orderwakil.js); daftar pelanggan dan menu dimuat saat tab dibuka.
    if (
      t.panel === "buatorder" &&
      window.KedaiOrderWakil &&
      typeof window.KedaiOrderWakil.tampil === "function"
    ) {
      window.KedaiOrderWakil.tampil();
    }

    // ORD.13: layar Kelola Pelanggan owner (pelangganluar.js).
    if (
      t.panel === "pelanggan" &&
      window.KedaiPelangganLuar &&
      typeof window.KedaiPelangganLuar.tampil === "function"
    ) {
      window.KedaiPelangganLuar.tampil();
    }

    // BTN.03: layar Bantuan (bantuan.js); diambil saat tab dibuka dan lewat Segarkan, tanpa polling.
    if (
      t.panel === "bantuan" &&
      window.KedaiBantuan &&
      typeof window.KedaiBantuan.tampil === "function"
    ) {
      window.KedaiBantuan.tampil();
    }

    // RKS.03: layar Ringkasan order 7 hari (ringkasan.js); diambil saat tab dibuka dan lewat Segarkan, tanpa polling.
    if (
      t.panel === "ringkasan" &&
      window.KedaiRingkasan &&
      typeof window.KedaiRingkasan.tampil === "function"
    ) {
      window.KedaiRingkasan.tampil();
    }

    // GLR.06: layar Gelar Saya (gelar.js); hanya menggambar dari memori, tanpa panggilan server.
    if (
      t.panel === "gelar" &&
      window.KedaiGelar &&
      typeof window.KedaiGelar.tampil === "function"
    ) {
      window.KedaiGelar.tampil();
    }
  }

  // BTN.03: buka layar Bantuan dari tab mana pun, ingat tab asalnya. Tombol Kembali membukanya lagi.
  function bukaBantuan() {
    if (!peran) return;
    if (tab !== "bantuan") {
      tabAsalBantuan = tab;
    }
    buka("bantuan");
  }

  function kembaliDariBantuan() {
    var asal = tabAsalBantuan;
    tabAsalBantuan = null;
    buka(asal || TAB[peran][0].id);
  }

  // HOM.02: isi sapaan dan lencana peran. Teks dari server hanya lewat textContent.
  function isiSapaan(p, nama) {
    var teksNama = typeof nama === "string" ? nama.trim() : "";
    el("home-nama").textContent = teksNama;
    el("home-nama-bungkus").hidden = !teksNama;
    var lencana = el("home-peran");
    if (Object.prototype.hasOwnProperty.call(LABEL_PERAN, p)) {
      lencana.textContent = LABEL_PERAN[p];
      lencana.hidden = false;
    } else {
      lencana.textContent = "";
      lencana.hidden = true;
    }
  }

  // HOM.03 dan HOM.04: tampilkan item Home yang cocok dengan peran, sembunyikan sisanya.
  // data-peran berisi peran yang boleh melihat item (dipisah spasi). Peran null atau tak dikenal:
  // semua item bertanda data-peran disembunyikan. Ini hanya kemudahan tampilan (HM10); server yang menolak akses.
  function aturItemHome(p) {
    var blok = el("blok-akun");
    var butir = blok.querySelectorAll("[data-peran]");
    for (var i = 0; i < butir.length; i++) {
      var boleh = (butir[i].getAttribute("data-peran") || "").split(" ");
      butir[i].hidden = !p || boleh.indexOf(p) === -1;
    }
    // Bagian (judul + daftar) yang semua itemnya tersembunyi ikut disembunyikan.
    var grup = blok.querySelectorAll("[data-grup]");
    for (var g = 0; g < grup.length; g++) {
      grup[g].hidden = !grup[g].querySelector("[data-peran]:not([hidden])");
    }
  }

  // HOM.04: buka layar Akun yang sudah ada, lalu geser ke kartu yang dimaksud (bila terlihat).
  function bukaAkun(kartu) {
    var M = window.KedaiAkunMenu;
    if (!M || typeof M.tampil !== "function") return;
    M.tampil();
    if (kartu && !kartu.hidden && typeof kartu.scrollIntoView === "function") {
      kartu.scrollIntoView();
    }
  }

  // HOM.04: aksi item Home yang bisa diketuk (atribut data-aksi di index.html).
  var AKSI_HOME = {
    // HOM.04 (revisi): satu tombol "Pengaturan akun" membuka layar Akun (tanpa menggeser ke kartu tertentu).
    // HOM.05: tiga aksi lama (akun-nama, akun-wa, akun-pw) dihapus karena tidak dipakai lagi di index.html.
    akun: function () {
      bukaAkun(null);
    },
    // ORD.13: item Pelanggan (owner) membuka layar Kelola Pelanggan.
    pelanggan: function () {
      buka("pelanggan");
    },
    // RKS.03: item "Ringkasan order 7 hari" (owner) membuka layar Ringkasan.
    ringkasan: function () {
      buka("ringkasan");
    },
    // GLR.06: tombol "Gelar Saya" (customer) membuka layar Gelar Saya.
    gelar: function () {
      buka("gelar");
    },
    // BTN.03: tombol Bantuan di Home membuka layar yang sama dengan ikon ? di bilah atas.
    bantuan: function () {
      bukaBantuan();
    },
    alamat: function () {
      var B = window.KedaiAlamat;
      if (B && typeof B.tampil === "function") {
        B.tampil();
      }
    },
  };

  // ------------------------------------------------------------------
  // NTF.04a: tujuan dari notifikasi dan penyegaran saat push masuk (lihat catatan di atas berkas).
  // ------------------------------------------------------------------
  var REGEX_ID_LUAR = /^[A-Za-z0-9_-]{1,64}$/;
  var BATAS_SEGAR_MS = 30000; // NT10: sekitar 30 detik
  var PANEL_SEGAR = {
    pesanan: true,
    ordermasuk: true,
    semuaorder: true,
    antrean: true,
  };
  var tujuanTertunda = null; // { tujuan, id } yang menunggu login dan peran
  var terakhirSegar = null; // performance.now() penyegaran terakhir (hanya untuk batas NT10, bukan waktu order)
  var timerSegar = null; // satu penyegaran susulan
  var perluSegar = false; // push masuk saat aplikasi di latar belakang

  function bacaTujuanDariAlamat() {
    try {
      var p = new URLSearchParams(window.location.search);
      var b = p.get("buka");
      if (b === "order" || b === "antrean") {
        var i = p.get("id") || "";
        return { tujuan: b, id: REGEX_ID_LUAR.test(i) ? i : "" };
      }
    } catch (err) {
      // Alamat tidak terbaca: diabaikan.
    }
    return null;
  }

  // Buang ?buka= dan id dari alamat peramban (bagian lain alamat dibiarkan).
  function bersihkanAlamatTujuan() {
    try {
      var p = new URLSearchParams(window.location.search);
      if (!p.has("buka")) return;
      p.delete("buka");
      p.delete("id");
      var sisa = p.toString();
      window.history.replaceState(
        null,
        "",
        window.location.pathname +
          (sisa ? "?" + sisa : "") +
          window.location.hash,
      );
    } catch (err) {
      // Gagal membersihkan alamat tidak boleh mengganggu alur.
    }
  }

  // Buka layar tujuan menurut peran. Mengembalikan true bila ada layar yang dibuka.
  function bukaTujuan(tujuan, id) {
    if (!peran) return false;
    var idAman = typeof id === "string" && REGEX_ID_LUAR.test(id) ? id : "";
    var tabTujuan = "";
    var layarOrder;
    if (peran === "customer" && tujuan === "order") {
      tabTujuan = "pesanan-saya";
      layarOrder = window.KedaiPesanan;
      if (
        idAman &&
        layarOrder &&
        typeof layarOrder.siapkanDetail === "function"
      ) {
        layarOrder.siapkanDetail(idAman);
      }
    } else if (peran === "owner" && tujuan === "order") {
      tabTujuan = "order-masuk";
      layarOrder = window.KedaiOrderOwner;
      if (
        idAman &&
        layarOrder &&
        typeof layarOrder.siapkanMasuk === "function"
      ) {
        layarOrder.siapkanMasuk(idAman);
      }
    } else if (
      peran === "penjaga" &&
      (tujuan === "antrean" || tujuan === "order")
    ) {
      tabTujuan = "antrean";
      layarOrder = window.KedaiOrderPenjaga;
      if (layarOrder) {
        if (
          tujuan === "order" &&
          idAman &&
          typeof layarOrder.siapkanDetail === "function"
        ) {
          layarOrder.siapkanDetail(idAman);
        } else if (typeof layarOrder.siapkanDaftar === "function") {
          layarOrder.siapkanDaftar();
        }
      }
    }
    if (!tabTujuan || !cariTab(tabTujuan)) return false;
    // Sedang di layar lain (misalnya Buku alamat): kembali ke layar utama supaya tujuan terlihat.
    if (el("layar-sementara").hidden && typeof A.tampilkan === "function") {
      A.tampilkan("sementara");
    }
    terakhirSegar = performance.now(); // buka() memuat data: dihitung sebagai penyegaran
    buka(tabTujuan);
    return true;
  }

  // Tujuan dari alamat dipakai SEKALI, setelah login dan peran dikenal.
  function bukaTertunda() {
    if (!tujuanTertunda || !peran) return;
    var t = tujuanTertunda;
    tujuanTertunda = null;
    bersihkanAlamatTujuan();
    bukaTujuan(t.tujuan, t.id);
  }

  // Muat ulang isi layar order yang sedang terbuka (satu panggilan lewat tampil() milik layar itu).
  function muatIsiAktif() {
    var t = peran ? cariTab(tab) : null;
    if (!t || el("layar-sementara").hidden) return;
    if (t.panel === "pesanan") {
      if (
        window.KedaiPesanan &&
        typeof window.KedaiPesanan.tampil === "function"
      ) {
        window.KedaiPesanan.tampil();
      }
    } else if (t.panel === "ordermasuk") {
      if (
        window.KedaiOrderOwner &&
        typeof window.KedaiOrderOwner.tampilMasuk === "function"
      ) {
        window.KedaiOrderOwner.tampilMasuk();
      }
    } else if (t.panel === "semuaorder") {
      if (
        window.KedaiOrderOwner &&
        typeof window.KedaiOrderOwner.tampilSemua === "function"
      ) {
        window.KedaiOrderOwner.tampilSemua();
      }
    } else if (t.panel === "antrean") {
      if (
        window.KedaiOrderPenjaga &&
        typeof window.KedaiOrderPenjaga.tampil === "function"
      ) {
        window.KedaiOrderPenjaga.tampil();
      }
    }
  }

  // NTF.07: titik merah Kotak masuk (satu panggilan `status`, tanpa layar memuat). Hanya bila inbox.js terpasang.
  function segarkanTitikInbox() {
    if (
      window.KedaiInbox &&
      typeof window.KedaiInbox.segarkanTitik === "function"
    ) {
      window.KedaiInbox.segarkanTitik();
    }
  }

  // function segarkanSekarang() {
  //   terakhirSegar = performance.now();
  //   muatIsiAktif();
  // }
  // NTF.07: titik merah ikut disegarkan. muatIsiAktif() sendiri hanya bekerja di empat layar order.
  function segarkanSekarang() {
    terakhirSegar = performance.now();
    muatIsiAktif();
    segarkanTitikInbox();
  }

  // Penyegaran karena push, dengan batas NT10. Di dalam batas: satu penyegaran susulan di akhir batas.
  function jalankanSegar() {
    var t = peran ? cariTab(tab) : null;
    // if (
    //   !t ||
    //   !Object.prototype.hasOwnProperty.call(PANEL_SEGAR, t.panel) ||
    //   el("layar-sementara").hidden
    // ) {
    //   return;
    // }
    // NTF.07: tidak lagi disaring per tab di sini (titik merah ikut di semua tab). Yang dibatasi ke empat layar
    // order kini muatIsiAktif(), memakai pemeriksaan panel yang sama.
    if (!t || el("layar-sementara").hidden) {
      return;
    }
    if (timerSegar) return; // sudah ada satu yang dijadwalkan
    var sisa =
      terakhirSegar === null
        ? 0
        : BATAS_SEGAR_MS - (performance.now() - terakhirSegar);
    if (sisa > 0) {
      timerSegar = setTimeout(function () {
        timerSegar = null;
        if (document.hidden) {
          perluSegar = true;
          return;
        }
        segarkanSekarang();
      }, sisa);
      return;
    }
    segarkanSekarang();
  }

  function pesanSegarkan() {
    if (document.hidden) {
      perluSegar = true; // disegarkan sekali saat kembali ke layar
      return;
    }
    jalankanSegar();
  }

  // Pesan dari sw.js. Isi pesan tidak dipercaya: tujuan hanya dua nilai, id dicek bentuknya.
  function terimaPesanSw(event) {
    var d = event && event.data;
    if (!d || typeof d !== "object") return;
    if (d.jenis === "segarkan") {
      pesanSegarkan();
    } else if (d.jenis === "buka") {
      var tujuan =
        d.tujuan === "order" || d.tujuan === "antrean" ? d.tujuan : "";
      if (!tujuan) return;
      var id = typeof d.id === "string" && REGEX_ID_LUAR.test(d.id) ? d.id : "";
      if (!peran) {
        // Belum masuk: simpan, dipakai setelah login dan peran dikenal.
        tujuanTertunda = { tujuan: tujuan, id: id };
        return;
      }
      bukaTujuan(tujuan, id);
    }
  }

  tujuanTertunda = bacaTujuanDariAlamat();
  if (!tujuanTertunda) bersihkanAlamatTujuan(); // ?buka= yang tidak dikenal dibuang

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", terimaPesanSw);
  }
  // document.addEventListener("visibilitychange", function () {
  //   if (!document.hidden && perluSegar) {
  //     perluSegar = false;
  //     jalankanSegar();
  //   }
  // });
  // NTF.07: kembali ke layar tanpa penanda push. Sudah lewat batas NT10: segarkan sekali. Belum: lewati (tanpa timer).
  function kembaliTanpaPush() {
    var t = peran ? cariTab(tab) : null;
    if (!t || el("layar-sementara").hidden) return;
    if (timerSegar) return; // penyegaran susulan sudah dijadwalkan
    if (
      terakhirSegar !== null &&
      performance.now() - terakhirSegar < BATAS_SEGAR_MS
    ) {
      return;
    }
    segarkanSekarang();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) return;
    if (perluSegar) {
      perluSegar = false;
      jalankanSegar();
    } else {
      kembaliTanpaPush();
    }
  });

  // Dipanggil akun.js setiap kali status dimuat. Peran sama: tab yang terbuka dipertahankan.
  // HOM.02: argumen kedua (nama) boleh kosong.
  // function atur(peranDariServer) {
  function atur(peranDariServer, namaDariServer) {
    var baru = peranDikenal(peranDariServer);
    if (baru !== peran) {
      peran = baru;
      tab = null;
      tabAsalBantuan = null; // BTN.03
    }

    // Blok Akun (sapaan, Buku alamat, Pengaturan akun, Keluar): owner di Lainnya, peran lain di tab Akun.
    var blok = el("blok-akun");
    // HOM.01: Home memakai panel-akun untuk semua peran (owner tidak lagi lewat Lainnya).
    // var tujuan = peran === "owner" ? el("lainnya-akun") : el("panel-akun");
    var tujuan = el("panel-akun");
    if (blok.parentNode !== tujuan) {
      tujuan.appendChild(blok);
    }

    for (var k in NAV) {
      if (Object.prototype.hasOwnProperty.call(NAV, k)) {
        el(NAV[k]).hidden = k !== peran;
      }
    }
    isiSapaan(peran, namaDariServer); // HOM.02
    aturItemHome(peran); // HOM.03, HOM.04
    // GLR.05: gelar customer dimuat SATU kali tiap status dimuat (masuk, Segarkan). Sebelum buka(tab) supaya layar Gelar Saya yang
    // sedang terbuka langsung menampilkan keadaan memuat. Peran selain customer: gelar.js tidak memanggil server.
    if (window.KedaiGelar && typeof window.KedaiGelar.atur === "function") {
      window.KedaiGelar.atur(peran, namaDariServer);
    }
    buka(tab);
    bukaTertunda(); // NTF.04a: tujuan dari notifikasi, dipakai sekali setelah peran dikenal
  }

  // Dipanggil akun.js saat Keluar: tidak boleh ada nama atau data tersisa di layar.
  function reset() {
    peran = null;
    tab = null;
    tabAsalBantuan = null; // BTN.03
    sembunyikanSemua();
    el("tombol-bantuan-atas").hidden = false; // BTN.03
    el("kerangka-judul").textContent = "Beranda";
    // DSN.08: kotak konfirmasi Keluar tidak boleh tersisa terbuka.
    tutupKonfirmasiKeluar();
    // HOM.05: #sapaan dan #catatan-profil lama sudah dihapus dari index.html.
    // HOM.02: sapaan baru dan lencana peran juga dibersihkan (nama tidak boleh tersisa setelah Keluar).
    el("home-nama").textContent = "";
    el("home-nama-bungkus").hidden = true;
    var lencanaPeran = el("home-peran");
    lencanaPeran.textContent = "";
    lencanaPeran.hidden = true;
    aturItemHome(null); // HOM.03, HOM.04: item Home per peran disembunyikan sampai masuk lagi
    if (window.KedaiMenu && typeof window.KedaiMenu.reset === "function") {
      window.KedaiMenu.reset();
    }
    // ORD.03: keranjang, alamat, dan hasil order tidak boleh tersisa setelah Keluar.
    if (window.KedaiPesan && typeof window.KedaiPesan.reset === "function") {
      window.KedaiPesan.reset();
    }
    // ORD.04: daftar dan detail pesanan tidak boleh tersisa setelah Keluar.
    if (
      window.KedaiPesanan &&
      typeof window.KedaiPesanan.reset === "function"
    ) {
      window.KedaiPesanan.reset();
    }
    // ORD.06: daftar, detail, nomor WA, dan alamat pemesan tidak boleh tersisa setelah Keluar.
    if (
      window.KedaiOrderOwner &&
      typeof window.KedaiOrderOwner.reset === "function"
    ) {
      window.KedaiOrderOwner.reset();
    }
    // ORD.08: daftar, detail, nomor WA, dan alamat pemesan tidak boleh tersisa setelah Keluar.
    if (
      window.KedaiOrderPenjaga &&
      typeof window.KedaiOrderPenjaga.reset === "function"
    ) {
      window.KedaiOrderPenjaga.reset();
    }
    // ORD.13: isian wizard dan data pelanggan tanpa akun tidak boleh tersisa setelah Keluar.
    if (
      window.KedaiOrderWakil &&
      typeof window.KedaiOrderWakil.reset === "function"
    ) {
      window.KedaiOrderWakil.reset();
    }
    if (
      window.KedaiPelangganLuar &&
      typeof window.KedaiPelangganLuar.reset === "function"
    ) {
      window.KedaiPelangganLuar.reset();
    }
    // BTN.03: isi Bantuan dikosongkan dan balasan yang masih di jalan diabaikan.
    if (
      window.KedaiBantuan &&
      typeof window.KedaiBantuan.reset === "function"
    ) {
      window.KedaiBantuan.reset();
    }
    // RKS.03: angka ringkasan (omzet) tidak boleh tersisa setelah Keluar.
    if (
      window.KedaiRingkasan &&
      typeof window.KedaiRingkasan.reset === "function"
    ) {
      window.KedaiRingkasan.reset();
    }
    // GLR.05: nama, gelar, dan banner tidak boleh tersisa setelah Keluar.
    if (window.KedaiGelar && typeof window.KedaiGelar.reset === "function") {
      window.KedaiGelar.reset();
    }
    // NTF.04a: tujuan notifikasi dan penyegaran tertunda tidak boleh terbawa ke akun berikutnya.
    tujuanTertunda = null;
    if (timerSegar) {
      clearTimeout(timerSegar);
      timerSegar = null;
    }
    perluSegar = false;
    terakhirSegar = null;
    bersihkanAlamatTujuan();
  }

  // Ketukan di navigasi bawah (satu pendengar per navigasi).
  function pasangNav(idNav) {
    el(idNav).addEventListener("click", function (e) {
      var sasaran =
        e.target && e.target.closest ? e.target.closest("[data-tab]") : null;
      if (sasaran) {
        buka(sasaran.getAttribute("data-tab"));
      }
    });
  }
  for (var k in NAV) {
    if (Object.prototype.hasOwnProperty.call(NAV, k)) {
      pasangNav(NAV[k]);
    }
  }

  // BTN.03: ikon ? di bilah atas dan tombol Kembali (dibuat bantuan.js di dalam #panel-bantuan).
  el("tombol-bantuan-atas").addEventListener("click", bukaBantuan);
  el("panel-bantuan").addEventListener("click", function (e) {
    var sasaran =
      e.target && e.target.closest
        ? e.target.closest("#bantuan-kembali")
        : null;
    if (sasaran) {
      kembaliDariBantuan();
    }
  });

  // RKS.03: tombol Kembali (dibuat ringkasan.js di dalam #panel-ringkasan) membuka Home lagi.
  el("panel-ringkasan").addEventListener("click", function (e) {
    var sasaran =
      e.target && e.target.closest
        ? e.target.closest("#ringkasan-kembali")
        : null;
    if (sasaran) {
      buka("home");
    }
  });

  // GLR.06: tombol Kembali (dibuat gelar.js di dalam #panel-gelar) membuka Home lagi.
  el("panel-gelar").addEventListener("click", function (e) {
    var sasaran =
      e.target && e.target.closest ? e.target.closest("#gelar-kembali") : null;
    if (sasaran) {
      buka("home");
    }
  });

  // HOM.04: satu pendengar untuk semua item Home yang bisa diketuk.
  el("blok-akun").addEventListener("click", function (e) {
    var sasaran =
      e.target && e.target.closest ? e.target.closest("[data-aksi]") : null;
    if (!sasaran || sasaran.disabled) return;
    var aksi = sasaran.getAttribute("data-aksi");
    if (Object.prototype.hasOwnProperty.call(AKSI_HOME, aksi)) {
      AKSI_HOME[aksi]();
    }
  });

  // DSN.08: konfirmasi Keluar. Dibuka dari ikon di bilah atas; Batal menutup, Keluar memanggil KedaiAkun.keluar.
  function bukaKonfirmasiKeluar() {
    el("konfirmasi-keluar").hidden = false;
    el("keluar-batal").focus();
  }

  function tutupKonfirmasiKeluar() {
    el("konfirmasi-keluar").hidden = true;
  }

  el("tombol-keluar-atas").addEventListener("click", bukaKonfirmasiKeluar);
  el("keluar-batal").addEventListener("click", function () {
    tutupKonfirmasiKeluar();
    el("tombol-keluar-atas").focus();
  });
  el("konfirmasi-keluar-latar").addEventListener("click", function () {
    tutupKonfirmasiKeluar();
  });
  el("keluar-ya").addEventListener("click", function () {
    tutupKonfirmasiKeluar();
    if (A && typeof A.keluar === "function") {
      A.keluar();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !el("konfirmasi-keluar").hidden) {
      tutupKonfirmasiKeluar();
    }
  });

  window.KedaiKerangka = Object.freeze({
    atur: atur,
    reset: reset,
  });
})();
