// public/profil.js
// AKN.06: layar Lengkapi profil (akun.md AK6, AK7, AK8, AK9, AK14).
// Hanya untuk customer yang belum punya profil; akun.js yang memutuskan kapan layar ini dibuka
// (peran "customer" DAN profil kosong). Berkas ini dimuat SETELAH akun.js karena memakai
// window.KedaiAkun (pembantu layar dan panggilan ke `kedai`).
//
// Aturan yang dijaga:
// - Yang dikirim hanya aksi dan isian (nama, wa, alias, alamat). ID dan peran dari token di server.
// - Cek di aplikasi hanya kemudahan; aturan sebenarnya dicek fungsi SQL buat_profil di server.
// - Semua teks dipasang lewat textContent. Galat mentah tidak ditampilkan.
// - Data pribadi (nomor WA, alamat) dikosongkan dari isian setelah berhasil simpan dan saat Keluar.
// - Tidak ada console.log berisi isian pengguna.

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A) {
    // akun.js belum termuat: window.KedaiProfil tidak dibuat, akun.js menampilkan pesan galat umum.
    return;
  }

  function el(id) {
    return document.getElementById(id);
  }

  // Pagar kasar yang sama dengan aturan server (AK7, AK8, AK9). Server tetap yang memutuskan.
  var REGEX_NAMA = /^[A-Za-z0-9_ ]{3,20}$/;
  // +62, 62, atau 08 di depan; nomor seluler (setelah awalan harus 8); panjang wajar.
  var REGEX_WA = /^(\+62|62|0)8[0-9]{7,12}$/;

  var TEKS_TOMBOL = "Simpan dan lanjut";
  var PESAN_UMUM = "Profil belum bisa disimpan. Coba lagi sebentar lagi.";
  var PESAN_OFFLINE = "Belum bisa terhubung. Periksa internet lalu coba lagi.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";

  var ISIAN = ["nama", "wa", "alias", "alamat"];

  function bersihkanGalat() {
    for (var i = 0; i < ISIAN.length; i++) {
      A.galatIsian("isian-profil-" + ISIAN[i], "");
    }
    A.galatForm("profil", "");
  }

  function kosongkanIsian() {
    for (var i = 0; i < ISIAN.length; i++) {
      el("profil-" + ISIAN[i]).value = "";
    }
  }

  function tampil() {
    bersihkanGalat();
    A.tampilkan("profil");
  }

  // Dipanggil akun.js saat Keluar: tidak boleh ada data pribadi tersisa di layar.
  function reset() {
    kosongkanIsian();
    bersihkanGalat();
  }

  function kirim(e) {
    e.preventDefault();
    bersihkanGalat();

    var nama = el("profil-nama").value.trim();
    // Spasi dan tanda hubung di nomor dibuang supaya "0812-3456-789" tetap diterima.
    var wa = el("profil-wa").value.replace(/[\s-]/g, "");
    var alias = el("profil-alias").value.trim();
    var alamat = el("profil-alamat").value.trim();

    var lengkap = true;
    if (!REGEX_NAMA.test(nama)) {
      A.galatIsian(
        "isian-profil-nama",
        "Nama 3 sampai 20 karakter, hanya huruf, angka, spasi, dan garis bawah.",
      );
      lengkap = false;
    }
    if (!REGEX_WA.test(wa)) {
      A.galatIsian("isian-profil-wa", "Nomor WA tidak valid.");
      lengkap = false;
    }
    if (alias.length < 3 || alias.length > 30) {
      A.galatIsian(
        "isian-profil-alias",
        "Nama alamat harus 3 sampai 30 karakter.",
      );
      lengkap = false;
    }
    if (alamat.length < 10 || alamat.length > 200) {
      A.galatIsian(
        "isian-profil-alamat",
        "Isi alamat harus 10 sampai 200 karakter.",
      );
      lengkap = false;
    }
    if (!lengkap) return;

    var tombol = el("tombol-profil");
    A.sibuk(tombol, true, TEKS_TOMBOL);

    A.panggilKedai("daftar_profil", {
      nama: nama,
      wa: wa,
      alias: alias,
      alamat: alamat,
    })
      .then(function (h) {
        A.sibuk(tombol, false, TEKS_TOMBOL);

        // Berhasil: kosongkan isian pribadi, lalu muat ulang status (layar sementara / layar utama).
        if (h.status === 200 && h.data && h.data.ok === true) {
          kosongkanIsian();
          A.muatStatus();
          return;
        }

        // Profil sudah pernah dibuat (mis. dikirim dua kali): anggap beres, lanjut muat status.
        if (h.status === 409) {
          kosongkanIsian();
          A.muatStatus();
          return;
        }

        if (h.status === 401 && !h.data) {
          A.galatForm("profil", PESAN_SESI);
          return;
        }

        // Pesan dari fungsi kedai sendiri (ok:false + pesan) aman ditampilkan;
        // balasan platform (tanpa field itu) diganti pesan umum.
        var pesan =
          h.data && h.data.ok === false && typeof h.data.pesan === "string"
            ? h.data.pesan
            : PESAN_UMUM;
        A.galatForm("profil", pesan);
      })
      .catch(function () {
        A.sibuk(tombol, false, TEKS_TOMBOL);
        A.galatForm("profil", navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE);
      });
  }

  el("form-profil").addEventListener("submit", kirim);
  el("profil-keluar").addEventListener("click", A.keluar);

  window.KedaiProfil = Object.freeze({
    tampil: tampil,
    reset: reset,
  });
})();
