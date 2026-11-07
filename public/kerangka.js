// public/kerangka.js
// KRG.01: kerangka layar utama per peran (desain.md DS9, DS10).
// Layar "sementara" di index.html kini menjadi kerangka: bilah atas, panel isi, dan navigasi bawah.
// Dimuat SETELAH akun.js dan menu.js. akun.js memanggil window.KedaiKerangka.atur(peran) setiap kali
// status dimuat (masuk, Segarkan, kembali dari layar lain) dan .reset() saat Keluar.
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
      { id: "order-masuk", nama: "Order Masuk", panel: "segera" },
      { id: "semua-order", nama: "Semua Order", panel: "segera" },
      { id: "buat-order", nama: "Buat Order", panel: "segera" },
      { id: "menu", nama: "Menu", panel: "menu" },
      { id: "lainnya", nama: "Lainnya", panel: "lainnya" },
    ],
    customer: [
      { id: "pesan", nama: "Pesan", panel: "segera" },
      { id: "pesanan-saya", nama: "Pesanan Saya", panel: "segera" },
      { id: "akun", nama: "Akun", panel: "akun" },
    ],
    penjaga: [
      { id: "antrean", nama: "Antrean", panel: "segera" },
      { id: "akun", nama: "Akun", panel: "akun" },
    ],
    // Peran tak dikenal: hanya Akun (supaya tetap bisa keluar), tanpa navigasi bawah.
    lain: [{ id: "akun", nama: "Akun", panel: "akun" }],
  };

  var NAV = {
    owner: "nav-owner",
    customer: "nav-customer",
    penjaga: "nav-penjaga",
  };

  var PANEL = ["segera", "menu", "lainnya", "akun"];

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
  }

  // Dipanggil akun.js setiap kali status dimuat. Peran sama: tab yang terbuka dipertahankan.
  function atur(peranDariServer) {
    var baru = peranDikenal(peranDariServer);
    if (baru !== peran) {
      peran = baru;
      tab = null;
    }

    // Blok Akun (sapaan, Buku alamat, Pengaturan akun, Keluar): owner di Lainnya, peran lain di tab Akun.
    var blok = el("blok-akun");
    var tujuan = peran === "owner" ? el("lainnya-akun") : el("panel-akun");
    if (blok.parentNode !== tujuan) {
      tujuan.appendChild(blok);
    }

    for (var k in NAV) {
      if (Object.prototype.hasOwnProperty.call(NAV, k)) {
        el(NAV[k]).hidden = k !== peran;
      }
    }
    buka(tab);
  }

  // Dipanggil akun.js saat Keluar: tidak boleh ada nama atau data tersisa di layar.
  function reset() {
    peran = null;
    tab = null;
    sembunyikanSemua();
    el("kerangka-judul").textContent = "Beranda";
    el("sapaan").textContent = "";
    var catatan = el("catatan-profil");
    catatan.textContent = "";
    catatan.hidden = true;
    if (window.KedaiMenu && typeof window.KedaiMenu.reset === "function") {
      window.KedaiMenu.reset();
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

  window.KedaiKerangka = Object.freeze({
    atur: atur,
    reset: reset,
  });
})();
