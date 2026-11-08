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
      { id: "buat-order", nama: "Buat Order", panel: "segera" },
      { id: "menu", nama: "Menu", panel: "menu" },
      // HOM.01: { id: "lainnya", nama: "Lainnya", panel: "lainnya" },
    ],
    customer: [
      { id: "home", nama: "Home", panel: "akun" }, // HOM.01
      // MNU.04: { id: "pesan", nama: "Pesan", panel: "segera" },
      { id: "pesan", nama: "Pesan", panel: "pesan" },
      // ORD.04: { id: "pesanan-saya", nama: "Pesanan Saya", panel: "segera" },
      { id: "pesanan-saya", nama: "Pesanan Saya", panel: "pesanan" },
      // HOM.01: { id: "akun", nama: "Akun", panel: "akun" },
    ],
    penjaga: [
      { id: "home", nama: "Home", panel: "akun" }, // HOM.01
      { id: "antrean", nama: "Antrean", panel: "segera" },
      // HOM.01: { id: "akun", nama: "Akun", panel: "akun" },
    ],
    // Peran tak dikenal: hanya Akun (supaya tetap bisa keluar), tanpa navigasi bawah.
    // HOM.01: lain: [{ id: "akun", nama: "Akun", panel: "akun" }],
    lain: [{ id: "home", nama: "Home", panel: "akun" }],
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
  ];

  // HOM.02: tulisan lencana peran di kartu sapaan (HM4). Peran tak dikenal: lencana disembunyikan.
  var LABEL_PERAN = {
    owner: "Owner",
    penjaga: "Penjaga",
    customer: "Customer",
  };

  var peran = null; // peran yang sedang dipasang; null = belum
  var tab = null; // id tab yang sedang terbuka; null = belum

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
    tandaiNav(t.id);

    if (t.panel === "segera") {
      el("segera-ket").textContent =
        t.nama + " belum tersedia. Fitur ini menyusul.";
    }
    window.scrollTo(0, 0);

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
    alamat: function () {
      var B = window.KedaiAlamat;
      if (B && typeof B.tampil === "function") {
        B.tampil();
      }
    },
  };

  // Dipanggil akun.js setiap kali status dimuat. Peran sama: tab yang terbuka dipertahankan.
  // HOM.02: argumen kedua (nama) boleh kosong.
  // function atur(peranDariServer) {
  function atur(peranDariServer, namaDariServer) {
    var baru = peranDikenal(peranDariServer);
    if (baru !== peran) {
      peran = baru;
      tab = null;
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
    buka(tab);
  }

  // Dipanggil akun.js saat Keluar: tidak boleh ada nama atau data tersisa di layar.
  function reset() {
    peran = null;
    tab = null;
    sembunyikanSemua();
    el("kerangka-judul").textContent = "Beranda";
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

  window.KedaiKerangka = Object.freeze({
    atur: atur,
    reset: reset,
  });
})();
