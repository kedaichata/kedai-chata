// public/gimmenu.js
// GIM.01: tombol hamburger di bilah atas dan dropdown berisi satu item "Arithmetics" (gim.md GM4, GM6, GM14).
// Tidak menyentuh kerangka.js. Dimuat SETELAH gim.js (memakai window.KedaiGim).
// Menutup menu dan game saat Keluar (HP dipakai bergantian):
//   1. mendengar ketukan tombol "Ya, keluar" di kotak konfirmasi (#keluar-ya), dan
//   2. mengamati layar utama (#layar-sementara): bila tersembunyi (Keluar, galat, kembali ke Masuk),
//      menu dan game ditutup. Ini jaring pengaman kalau Keluar terjadi lewat jalur lain.
// Semua teks tetap (bukan dari server). Tanpa panggilan server.

(function () {
  "use strict";

  var tombol = document.getElementById("tombol-hamburger");
  var menu = document.getElementById("gim-menu");
  var itemGame = document.getElementById("gim-menu-arithmetics");
  var layarUtama = document.getElementById("layar-sementara");
  if (!tombol || !menu || !itemGame || !layarUtama) {
    // Bagian index.html belum lengkap: hamburger tidak dipasang, aplikasi lain tetap jalan.
    return;
  }

  function terbuka() {
    return !menu.hidden;
  }

  function tutupMenu() {
    menu.hidden = true;
    tombol.setAttribute("aria-expanded", "false");
  }

  function bukaMenu() {
    menu.hidden = false;
    tombol.setAttribute("aria-expanded", "true");
    itemGame.focus();
  }

  function tutupSemua() {
    tutupMenu();
    if (window.KedaiGim && typeof window.KedaiGim.tutup === "function") {
      window.KedaiGim.tutup();
    }
  }

  tombol.addEventListener("click", function () {
    if (terbuka()) {
      tutupMenu();
    } else {
      bukaMenu();
    }
  });

  itemGame.addEventListener("click", function () {
    tutupMenu();
    if (window.KedaiGim && typeof window.KedaiGim.buka === "function") {
      window.KedaiGim.buka();
    }
  });

  // Ketuk di luar menu menutupnya.
  document.addEventListener("click", function (e) {
    if (!terbuka()) return;
    var sasaran = e.target;
    if (menu.contains(sasaran) || tombol.contains(sasaran)) return;
    tutupMenu();
  });

  // Esc menutup menu dan mengembalikan fokus ke tombol.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && terbuka()) {
      tutupMenu();
      tombol.focus();
    }
  });

  // Keluar (GM14): tutup menu dan game.
  var keluarYa = document.getElementById("keluar-ya");
  if (keluarYa) {
    keluarYa.addEventListener("click", tutupSemua);
  }

  // Jaring pengaman: layar utama tersembunyi berarti pengguna sudah tidak di layar kerja.
  new MutationObserver(function () {
    if (layarUtama.hidden) {
      tutupSemua();
    }
  }).observe(layarUtama, { attributes: true, attributeFilter: ["hidden"] });
})();
