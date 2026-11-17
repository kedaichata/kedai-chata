// public/cari.js
// MNU.13: kotak "Cari menu" untuk layar Pesan (customer) dan Kelola Menu (owner). Lihat menu.md blok 2026-11-17.
// Murni di HP: tanpa tabel, fungsi SQL, aksi `kedai`, atau panggilan server baru. Hanya menyaring daftar
// menu yang SUDAH diambil lewat menu_daftar (MN7). Tidak menyimpan apa pun (tanpa localStorage).
// Dimuat SEBELUM menu.js di index.html (menu.js memakai window.KedaiCari).
//
// Aturan yang dijaga:
// - Yang dicari hanya NAMA menu, tanpa membedakan huruf besar kecil. Tiap kata yang diketik harus ada di
//   nama (contoh: "bakso" menampilkan semua menu yang namanya memuat bakso). Keterangan tidak ikut dicari.
// - Tanpa kategori atau penggolongan (MN2 tetap berlaku).
// - Teks yang diketik hanya dibaca lewat .value dan dibandingkan sebagai teks; tidak pernah dimasukkan
//   ke innerHTML. Semua elemen dibuat lewat createElement dan textContent.
// - Kotak dibuat lewat JS dan dipasang tepat SEBELUM elemen yang ditunjuk, jadi index.html tidak berubah
//   selain satu tag <script>.
//
// Pemakaian (dari menu.js):
//   var c = window.KedaiCari.pasang({ sebelum: elemen, id: "idisian", label: "Cari menu", onUbah: fungsi });
//   c.cocok("Bakso Bakar")  -> true/false menurut isi kotak sekarang
//   c.aktif()               -> true bila kotak berisi sesuatu
//   c.kosongkan()           -> mengosongkan kotak TANPA memanggil onUbah (untuk Keluar)

(function () {
  "use strict";

  var BATAS_KARAKTER = 40; // hanya pagar bentuk isian; tidak ada keputusan bisnis di sini

  function buat(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks !== undefined) e.textContent = teks;
    return e;
  }

  // Huruf kecil, spasi berulang jadi satu, spasi di tepi dibuang.
  function rapikan(s) {
    return String(s).toLowerCase().replace(/\s+/g, " ").trim();
  }

  function pasang(opsi) {
    if (!opsi || !opsi.sebelum || !opsi.sebelum.parentNode) return null;
    var onUbah =
      typeof opsi.onUbah === "function" ? opsi.onUbah : function () {};

    var bungkus = buat("div", "cari-kotak");
    var baris = buat("div", "cari-baris");

    var kolom = buat("input", "isian__kolom cari-kolom");
    kolom.type = "text";
    kolom.id = opsi.id || "";
    kolom.setAttribute("inputmode", "search");
    kolom.setAttribute("enterkeyhint", "search");
    kolom.setAttribute("autocomplete", "off");
    kolom.setAttribute("autocapitalize", "none");
    kolom.setAttribute("spellcheck", "false");
    kolom.setAttribute("aria-label", opsi.label || "Cari menu");
    kolom.placeholder = (opsi.label || "Cari menu") + "...";
    kolom.maxLength = BATAS_KARAKTER;

    var hapus = buat("button", "tombol tombol--sekunder cari-hapus", "\u00D7");
    hapus.type = "button";
    hapus.hidden = true;
    hapus.setAttribute("aria-label", "Hapus pencarian");

    baris.appendChild(kolom);
    baris.appendChild(hapus);
    bungkus.appendChild(baris);
    opsi.sebelum.parentNode.insertBefore(bungkus, opsi.sebelum);

    function nilai() {
      return rapikan(kolom.value);
    }

    function aktif() {
      return nilai() !== "";
    }

    // Tiap kata yang diketik harus ada di nama. Kotak kosong: semua menu cocok.
    function cocok(nama) {
      var kata = nilai();
      if (kata === "") return true;
      var sasaran = rapikan(typeof nama === "string" ? nama : "");
      var daftarKata = kata.split(" ");
      for (var i = 0; i < daftarKata.length; i++) {
        if (sasaran.indexOf(daftarKata[i]) < 0) return false;
      }
      return true;
    }

    function tampilkanTombolHapus() {
      hapus.hidden = kolom.value === "";
    }

    // Untuk Keluar: kosongkan tanpa memicu penggambaran ulang.
    function kosongkan() {
      kolom.value = "";
      tampilkanTombolHapus();
    }

    kolom.addEventListener("input", function () {
      tampilkanTombolHapus();
      onUbah();
    });

    // Enter di HP hanya menutup papan ketik supaya daftar terlihat penuh.
    kolom.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        kolom.blur();
      }
    });

    hapus.addEventListener("click", function () {
      kosongkan();
      onUbah();
      kolom.focus();
    });

    return Object.freeze({
      cocok: cocok,
      aktif: aktif,
      kosongkan: kosongkan,
    });
  }

  window.KedaiCari = Object.freeze({
    pasang: pasang,
  });
})();
