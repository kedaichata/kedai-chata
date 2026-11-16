// public/pengenalan.js
// PGN.02: layar Pengenalan Aplikasi (pengenalan.md PG1 sampai PG8, PG13).
// Dibuka dari tombol "Pengenalan Aplikasi" di layar Masuk (#ke-pengenalan), TANPA login.
// Isi teks ada di pengenalan-isi.js (window.KedaiPengenalanIsi, hanya data); berkas ini hanya logika.
// Dimuat SETELAH pengenalan-isi.js di index.html. Berdiri sendiri: tidak memakai akun.js, tidak ada
// panggilan server, tidak memakai localStorage, tidak ada panggilan jaringan (PG3).
//
// Aturan yang dijaga:
// - Semua teks dipasang lewat textContent / createTextNode. TIDAK ADA innerHTML (PG6).
// - Penanda format: **tebal**, *miring*, {warna|teks}. Tidak bersarang. Warna hanya dari palet tetap
//   (marun, merah, hijau); nama warna lain dirender sebagai teks biasa (PG7).
// - Layar Masuk hanya DISEMBUNYIKAN saat Pengenalan terbuka (bukan dibangun ulang), jadi isian email
//   dan password yang sudah diketik tidak hilang (PG2).
// - Tidak memakai bagian "#" alamat, tidak memakai pushState, tidak mengubah alamat peramban (PG13).
//   Pindah layar cukup dengan menampilkan dan menyembunyikan section.
// - Susunan topik: akordeon bawaan peramban (<details>), sama polanya dengan layar Bantuan (PG4).

(function () {
  "use strict";

  var tombolBuka = document.getElementById("ke-pengenalan");
  var tombolKembali = document.getElementById("pengenalan-kembali");
  var layarMasuk = document.getElementById("layar-masuk");
  var layarPengenalan = document.getElementById("layar-pengenalan");
  var wadahIsi = document.getElementById("pengenalan-isi");

  if (
    !tombolBuka ||
    !tombolKembali ||
    !layarMasuk ||
    !layarPengenalan ||
    !wadahIsi
  ) {
    // Elemen belum ada di index.html: tidak membuat apa-apa.
    return;
  }

  // Nama warna yang dikenal -> kelas di pengenalan.css (PG7).
  var WARNA = {
    marun: "pgn-warna--marun",
    merah: "pgn-warna--merah",
    hijau: "pgn-warna--hijau",
  };

  // **tebal** | *miring* | {warna|teks}. "**" dicoba lebih dulu daripada "*".
  var POLA_PENANDA = /\*\*(.+?)\*\*|\*(.+?)\*|\{([a-z]+)\|(.+?)\}/g;

  var sudahDigambar = false;

  function buat(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) {
      e.className = kelas;
    }
    if (teks !== undefined) {
      e.textContent = teks;
    }
    return e;
  }

  // Ubah satu teks berpenanda menjadi isi elemen `induk`. Hanya node teks, strong, em, dan span.
  function isiBerformat(induk, teks) {
    var posisi = 0;
    var cocok;
    POLA_PENANDA.lastIndex = 0;
    while ((cocok = POLA_PENANDA.exec(teks)) !== null) {
      if (cocok.index > posisi) {
        induk.appendChild(
          document.createTextNode(teks.slice(posisi, cocok.index)),
        );
      }
      if (cocok[1] !== undefined) {
        induk.appendChild(buat("strong", "", cocok[1]));
      } else if (cocok[2] !== undefined) {
        induk.appendChild(buat("em", "", cocok[2]));
      } else {
        var kelasWarna = Object.prototype.hasOwnProperty.call(WARNA, cocok[3])
          ? WARNA[cocok[3]]
          : "";
        // Nama warna tidak dikenal: tetap tampil, sebagai teks biasa.
        induk.appendChild(buat("span", kelasWarna, cocok[4]));
      }
      posisi = POLA_PENANDA.lastIndex;
    }
    if (posisi < teks.length) {
      induk.appendChild(document.createTextNode(teks.slice(posisi)));
    }
  }

  // Satu baris isi -> satu paragraf. Baris berawalan "- " jadi butir, berawalan "1. " dst jadi langkah.
  function buatParagraf(teks) {
    var kelas = "pgn-p";
    var isi = teks;
    if (/^- /.test(teks)) {
      kelas = "pgn-p pgn-butir";
      isi = "\u2022 " + teks.slice(2);
    } else if (/^\d+\. /.test(teks)) {
      kelas = "pgn-p pgn-langkah";
    }
    var p = buat("p", kelas);
    isiBerformat(p, isi);
    return p;
  }

  function buatTopik(topik) {
    var d = buat("details", "pgn-tanya");
    d.appendChild(buat("summary", "pgn-tanya__judul", topik.judul));
    var jawab = buat("div", "pgn-jawab");
    for (var i = 0; i < topik.isi.length; i++) {
      if (typeof topik.isi[i] === "string" && topik.isi[i].trim() !== "") {
        jawab.appendChild(buatParagraf(topik.isi[i]));
      }
    }
    d.appendChild(jawab);
    return d;
  }

  // Gambar daftar topik sekali saja (isinya statis).
  function gambar() {
    if (sudahDigambar) {
      return;
    }
    while (wadahIsi.firstChild) {
      wadahIsi.removeChild(wadahIsi.firstChild);
    }
    var data = window.KedaiPengenalanIsi;
    var kartu = buat("div", "kartu pgn-daftar");
    var jumlah = 0;
    if (Array.isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        var t = data[i];
        if (
          t &&
          typeof t.judul === "string" &&
          t.judul !== "" &&
          Array.isArray(t.isi)
        ) {
          kartu.appendChild(buatTopik(t));
          jumlah++;
        }
      }
    }
    if (jumlah === 0) {
      wadahIsi.appendChild(
        buat(
          "p",
          "isian__bantuan",
          "Penjelasan belum tersedia. Muat ulang halaman lalu coba lagi.",
        ),
      );
      return; // tidak dianggap selesai, dicoba lagi saat dibuka berikutnya
    }
    wadahIsi.appendChild(kartu);
    sudahDigambar = true;
  }

  function buka() {
    gambar();
    layarMasuk.hidden = true;
    layarPengenalan.hidden = false;
    window.scrollTo(0, 0);
  }

  function tutup() {
    layarPengenalan.hidden = true;
    layarMasuk.hidden = false;
    window.scrollTo(0, 0);
    tombolBuka.focus();
  }

  tombolBuka.addEventListener("click", buka);
  tombolKembali.addEventListener("click", tutup);
})();
