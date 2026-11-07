// public/menu-detail.js
// MNU.08: sheet detail menu untuk customer (menu.md, blok "Deskripsi, sheet detail, dan pilihan menu").
// Customer mengetuk kartu menu di tab Pesan, lalu sheet naik dari bawah berisi foto besar, nama, harga,
// lencana Tersedia/Habis, dan deskripsi (hanya bila ada). Ditutup lewat tombol X, ketuk area gelap di luar
// sheet, geser turun (layar sentuh), atau tombol Esc (keyboard).
//
// Komponen ini berdiri sendiri: tidak memanggil server dan tidak memakai window.KedaiAkun. Pemanggilnya
// (menu.js, buatKartuPelanggan) menyerahkan data menu yang sudah ada di layar.
// Dimuat SEBELUM menu.js di index.html.
//
// Aturan yang dijaga:
// - Sheet hanya MENAMPILKAN. Tombol tambah dan jumlah dipasang di sini saat ORD dikerjakan. Aplikasi tidak
//   pernah mengirim harga atau total (MN4).
// - Semua teks (nama, harga, deskripsi) dipasang lewat textContent, bukan innerHTML.
// - Foto dibaca dari img/<nama berkas>. Nama berkas dicek ulang di sini (huruf kecil, angka, strip,
//   berakhiran .jpg atau .webp). Berkas belum ada atau nama salah: tampil placeholder, bukan galat.
// - Bentuk data yang dibaca: { nama, harga, tersedia, foto, deskripsi }. Deskripsi opsional; bila kosong atau
//   belum dikirim server (MNU.07), bagian deskripsi tidak tampil.
// - Animasi singkat; dimatikan lewat CSS bila HP mengurangi animasi.
// - Tidak ada data yang disimpan: isi sheet dikosongkan saat ditutup.

(function () {
  "use strict";

  var KELAS_BUKA = "sheet-menu--buka";
  var LAMA_ANIMASI = 220; // milidetik; sama dengan transisi di style.css
  var AMBANG_TUTUP = 80; // geser turun lebih dari ini (px) = tutup, kurang dari ini kembali ke atas
  var AMBANG_MULAI = 3; // gerak minimal (px) sebelum dianggap geser, supaya ketukan biasa tidak terbaca geser
  var REGEX_FOTO = /^[a-z0-9-]+\.(jpg|webp)$/;

  var akar = null; // pembungkus seluruh sheet (dibuat saat pertama dibuka)
  var latar = null;
  var lembar = null;
  var pegangan = null;
  var tombolTutup = null;
  var isi = null;

  var terbuka = false;
  var pemicu = null; // elemen yang diketuk untuk membuka; fokus dikembalikan ke sana saat ditutup
  var penundaSembunyi = null;

  // Keadaan geser turun
  var mulaiY = 0;
  var geser = 0;
  var bisaGeser = false;
  var sedangGeser = false;

  // ------------------------------------------------------------
  // Pembantu
  // ------------------------------------------------------------

  function buat(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks !== undefined) e.textContent = teks;
    return e;
  }

  function rupiah(n) {
    return "Rp " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function kosongkan(e) {
    while (e.firstChild) {
      e.removeChild(e.firstChild);
    }
  }

  // Ikon X dari SVG langsung (tanpa pustaka ikon atau CDN), bergaya sama dengan ikon navigasi.
  function buatIkonTutup() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var jalur = document.createElementNS(ns, "path");
    jalur.setAttribute("d", "M6 6l12 12M18 6L6 18");
    jalur.setAttribute("fill", "none");
    jalur.setAttribute("stroke", "currentColor");
    jalur.setAttribute("stroke-width", "3");
    jalur.setAttribute("stroke-linecap", "round");
    svg.appendChild(jalur);
    return svg;
  }

  // ------------------------------------------------------------
  // Isi sheet
  // ------------------------------------------------------------

  function buatFotoBesar(m) {
    var bungkus = buat(
      "div",
      "sheet-menu__foto" + (m.tersedia ? "" : " sheet-menu__foto--habis"),
    );
    if (typeof m.foto === "string" && REGEX_FOTO.test(m.foto)) {
      var gambar = document.createElement("img");
      gambar.alt = "Foto " + m.nama;
      gambar.decoding = "async";
      // Berkas belum ada atau nama salah ketik: ganti dengan placeholder, bukan galat.
      gambar.addEventListener("error", function () {
        if (gambar.parentNode === bungkus) bungkus.removeChild(gambar);
        bungkus.textContent = "Foto belum ada";
      });
      gambar.src = "img/" + m.foto;
      bungkus.appendChild(gambar);
    } else {
      bungkus.textContent = "Tanpa foto";
    }
    return bungkus;
  }

  function isiSheet(m) {
    kosongkan(isi);
    isi.appendChild(buatFotoBesar(m));

    var nama = buat("h2", "sheet-menu__nama", m.nama);
    nama.id = "sheet-menu-nama"; // dirujuk aria-labelledby pada lembar
    isi.appendChild(nama);
    isi.appendChild(buat("p", "sheet-menu__harga", rupiah(Number(m.harga))));

    var lencana = buat("div", "menu-lencana");
    if (m.tersedia) {
      lencana.appendChild(
        buat("span", "lencana lencana--tersedia", "Tersedia"),
      );
    } else {
      lencana.appendChild(buat("span", "lencana lencana--habis", "Habis"));
    }
    isi.appendChild(lencana);

    if (!m.tersedia) {
      isi.appendChild(
        buat(
          "p",
          "isian__bantuan sheet-menu__ket",
          "Menu ini sedang habis, jadi belum bisa dipilih.",
        ),
      );
    }

    // Deskripsi opsional (MNU.07 yang mengisinya). Kosong atau belum ada: bagian ini tidak tampil.
    if (typeof m.deskripsi === "string" && m.deskripsi.trim() !== "") {
      isi.appendChild(buat("p", "sheet-menu__deskripsi", m.deskripsi.trim()));
    }
  }

  // ------------------------------------------------------------
  // Bangun kerangka sheet (sekali, saat pertama dibuka)
  // ------------------------------------------------------------

  function bangun() {
    if (akar) return;

    akar = buat("div", "sheet-menu");
    akar.hidden = true;

    // Area gelap di belakang sheet: ketuk = tutup.
    latar = buat("div", "sheet-menu__latar");
    latar.addEventListener("click", function () {
      tutup();
    });

    lembar = buat("div", "sheet-menu__lembar");
    lembar.setAttribute("role", "dialog");
    lembar.setAttribute("aria-modal", "true");
    lembar.setAttribute("aria-labelledby", "sheet-menu-nama");

    pegangan = buat("div", "sheet-menu__pegangan");

    tombolTutup = buat("button", "sheet-menu__tutup");
    tombolTutup.type = "button";
    tombolTutup.setAttribute("aria-label", "Tutup");
    tombolTutup.appendChild(buatIkonTutup());
    tombolTutup.addEventListener("click", function () {
      tutup();
    });

    isi = buat("div", "sheet-menu__isi");

    lembar.appendChild(pegangan);
    lembar.appendChild(tombolTutup);
    lembar.appendChild(isi);
    akar.appendChild(latar);
    akar.appendChild(lembar);

    // Geser turun untuk menutup (layar sentuh). touchmove dipasang tidak pasif supaya halaman di
    // belakang tidak ikut tergeser saat sheet ditarik.
    lembar.addEventListener("touchstart", sentuhMulai, { passive: true });
    lembar.addEventListener("touchmove", sentuhGerak, { passive: false });
    lembar.addEventListener("touchend", sentuhSelesai);
    lembar.addEventListener("touchcancel", sentuhBatal);

    document.body.appendChild(akar);
  }

  // ------------------------------------------------------------
  // Geser turun
  // ------------------------------------------------------------

  function sentuhMulai(e) {
    if (!terbuka || e.touches.length !== 1) {
      bisaGeser = false;
      return;
    }
    mulaiY = e.touches[0].clientY;
    geser = 0;
    sedangGeser = false;
    // Boleh ditarik dari pegangan, atau dari isi bila isi sedang di paling atas (bila tidak, gerakan
    // itu dipakai untuk menggulir isi).
    bisaGeser = pegangan.contains(e.target) || isi.scrollTop <= 0;
  }

  function sentuhGerak(e) {
    if (!bisaGeser || e.touches.length !== 1) return;
    var dy = e.touches[0].clientY - mulaiY;
    if (!sedangGeser) {
      if (dy < -AMBANG_MULAI) {
        // Gerak ke atas: itu menggulir isi, bukan menutup.
        bisaGeser = false;
        return;
      }
      if (dy < AMBANG_MULAI) return;
      sedangGeser = true;
      lembar.style.transition = "none"; // ikuti jari tanpa jeda
    }
    geser = Math.max(0, dy);
    lembar.style.transform = "translateY(" + geser + "px)";
    if (e.cancelable) e.preventDefault();
  }

  function sentuhSelesai() {
    if (!sedangGeser) {
      bisaGeser = false;
      return;
    }
    var jarak = geser;
    sedangGeser = false;
    bisaGeser = false;
    geser = 0;
    if (jarak > AMBANG_TUTUP) {
      tutup();
    } else {
      // Kurang jauh: kembali ke posisi semula dengan animasi.
      lembar.style.transition = "";
      lembar.style.transform = "";
    }
  }

  function sentuhBatal() {
    sedangGeser = false;
    bisaGeser = false;
    geser = 0;
    if (lembar) {
      lembar.style.transition = "";
      lembar.style.transform = "";
    }
  }

  // ------------------------------------------------------------
  // Keyboard
  // ------------------------------------------------------------

  // Esc menutup. Tab ditahan di tombol X karena itu satu-satunya yang bisa difokus di sheet ini
  // (tombol pilih menyusul di ORD; saat itu aturan ini perlu disesuaikan).
  function tekanTombol(e) {
    if (!terbuka) return;
    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault();
      tutup();
    } else if (e.key === "Tab") {
      e.preventDefault();
      tombolTutup.focus();
    }
  }

  // ------------------------------------------------------------
  // Buka dan tutup
  // ------------------------------------------------------------

  // m: { nama, harga, tersedia, foto, deskripsi? }. dariElemen: kartu yang diketuk (untuk mengembalikan fokus).
  function buka(m, dariElemen) {
    if (!m || typeof m.nama !== "string" || !isFinite(Number(m.harga))) return;
    bangun();

    if (penundaSembunyi) {
      clearTimeout(penundaSembunyi);
      penundaSembunyi = null;
    }
    pemicu = dariElemen || document.activeElement;

    isiSheet(m);
    isi.scrollTop = 0;
    lembar.style.transition = "";
    lembar.style.transform = "";

    akar.hidden = false;
    void akar.offsetHeight; // paksa hitung ulang tata letak supaya animasi naik berjalan
    akar.classList.add(KELAS_BUKA);
    document.body.classList.add("sheet-terbuka");
    document.addEventListener("keydown", tekanTombol);
    terbuka = true;
    tombolTutup.focus();
  }

  function sembunyikan() {
    penundaSembunyi = null;
    if (!akar) return;
    akar.hidden = true;
    kosongkan(isi);
  }

  // segera === true: tutup tanpa animasi dan tanpa mengembalikan fokus (dipakai saat Keluar).
  function tutup(segera) {
    if (!akar) return;
    if (!terbuka && akar.hidden) return;

    terbuka = false;
    sedangGeser = false;
    bisaGeser = false;
    geser = 0;
    document.removeEventListener("keydown", tekanTombol);
    document.body.classList.remove("sheet-terbuka");

    // Lepas posisi geser lalu hilangkan kelas buka: sheet meluncur turun dari posisi terakhirnya.
    lembar.style.transition = "";
    lembar.style.transform = "";
    akar.classList.remove(KELAS_BUKA);

    if (penundaSembunyi) {
      clearTimeout(penundaSembunyi);
      penundaSembunyi = null;
    }
    var asal = pemicu;
    pemicu = null;

    if (segera === true) {
      sembunyikan();
    } else {
      penundaSembunyi = setTimeout(sembunyikan, LAMA_ANIMASI);
      if (
        asal &&
        document.body.contains(asal) &&
        typeof asal.focus === "function"
      ) {
        asal.focus({ preventScroll: true });
      }
    }
  }

  window.KedaiMenuDetail = Object.freeze({
    buka: buka,
    tutup: tutup,
  });
})();
