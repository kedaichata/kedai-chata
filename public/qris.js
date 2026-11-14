// public/qris.js
// QRS.02: pop-up QRIS di Home (qris.md QR3, QR4, QR5, QR6, QR12, QR13).
// Hanya menampilkan satu gambar tetap (img/qris.jpg). Tanpa server, tanpa database, tanpa localStorage.
// Berdiri sendiri: dimuat setelah notif.js di index.html, tidak memakai window.KedaiAkun dan tidak menyentuh kerangka.js.
//
// Aturan yang dijaga:
// - Semua teks dipasang lewat textContent (QR12); gambar dan tautan lewat atribut, tanpa innerHTML.
// - Pop-up bisa ditutup dengan tombol Tutup, ketuk area gelap di luar kotak, atau tombol Esc (QR4).
// - Pop-up ikut tertutup saat Keluar (QR13). kerangka.js tidak disentuh: pop-up berada di dalam #layar-sementara,
//   dan layar itu disembunyikan pada setiap jalur Keluar, jadi pengamat atribut hidden di bawah menutup pop-up.
//   window.KedaiQris.reset() juga disediakan bila suatu saat ingin dipanggil dari kerangka.js reset().
// - Kalimat petunjuk tidak menyiratkan QRIS melunasi pesanan (QR5): hanya owner yang menekan Setujui.

(function () {
  "use strict";

  // Nama berkas gambar dicatat di blok susulan qris.md (Handoff #1): qris.jpg, bukan qris.png.
  var BERKAS_GAMBAR = "img/qris.jpg";
  var NAMA_UNDUHAN = "qris-kedai-chata.jpg";

  // Teks tetap, bukan dari database dan bukan dari server (QR5).
  var TEKS_JUDUL = "Bayar dengan QRIS";
  var TEKS_PETUNJUK =
    "Bayar sesuai total pesanan, lalu kabari lewat WA. Pesanan diproses setelah pembayaran dikonfirmasi.";
  var TEKS_ALT = "QRIS Kedai ChATA"; // QR7
  var TEKS_SIMPAN = "Simpan gambar"; // QR6
  var TEKS_TUTUP = "Tutup";

  function el(id) {
    return document.getElementById(id);
  }

  var tombolBuka = el("home-qris");
  var dialog = el("qris-dialog");
  var latar = el("qris-latar");
  var judul = el("qris-judul");
  var gambar = el("qris-gambar");
  var petunjuk = el("qris-petunjuk");
  var simpan = el("qris-simpan");
  var tombolTutup = el("qris-tutup");

  // Elemen belum lengkap di index.html: tidak membuat apa-apa dan tidak mengganggu aplikasi.
  if (
    !tombolBuka ||
    !dialog ||
    !latar ||
    !judul ||
    !gambar ||
    !petunjuk ||
    !simpan ||
    !tombolTutup
  ) {
    return;
  }

  var sudahDipasang = false; // isi pop-up cukup dipasang sekali

  function pasangIsi() {
    if (sudahDipasang) return;
    sudahDipasang = true;
    judul.textContent = TEKS_JUDUL;
    gambar.setAttribute("alt", TEKS_ALT);
    gambar.setAttribute("src", BERKAS_GAMBAR);
    petunjuk.textContent = TEKS_PETUNJUK;
    simpan.textContent = TEKS_SIMPAN;
    simpan.setAttribute("href", BERKAS_GAMBAR); // QR6: tautan unduh biasa ke berkas yang sama
    simpan.setAttribute("download", NAMA_UNDUHAN);
    tombolTutup.textContent = TEKS_TUTUP;
  }

  function terbuka() {
    return !dialog.hidden;
  }

  function buka() {
    pasangIsi();
    dialog.hidden = false;
    tombolTutup.focus();
  }

  // kembaliFokus: true saat ditutup pengguna (fokus kembali ke tombol QRIS);
  // false saat ditutup karena Keluar (layar utama sudah tersembunyi, tidak ada yang difokuskan).
  function tutup(kembaliFokus) {
    if (!terbuka()) return;
    dialog.hidden = true;
    if (kembaliFokus && typeof tombolBuka.focus === "function") {
      tombolBuka.focus();
    }
  }

  tombolBuka.addEventListener("click", buka);
  tombolTutup.addEventListener("click", function () {
    tutup(true);
  });
  latar.addEventListener("click", function () {
    tutup(true);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && terbuka()) {
      tutup(true);
    }
  });

  // QR13: pop-up ikut tertutup saat Keluar (HP dipakai bergantian). Semua jalur Keluar menyembunyikan
  // #layar-sementara, jadi cukup mengamati atribut hidden-nya.
  var layarUtama = el("layar-sementara");
  if (layarUtama && typeof MutationObserver === "function") {
    new MutationObserver(function () {
      if (layarUtama.hidden) {
        tutup(false);
      }
    }).observe(layarUtama, { attributes: true, attributeFilter: ["hidden"] });
  }

  window.KedaiQris = Object.freeze({
    reset: function () {
      tutup(false);
    },
  });
})();
