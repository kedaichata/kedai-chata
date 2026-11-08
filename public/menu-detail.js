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
// MNU.11: bila menu punya grup pilihan (field `grup`: [{ nama, opsi: [{ nama, bawaan }] }]), sheet menampilkannya
//   sebagai daftar BACA SAJA di bawah deskripsi, opsi bawaan ditandai emoji centang (\u2705; keputusan ketua, menggantikan tulisan "(bawaan)"), dengan keterangan "\u2705 = otomatis dipilih kalau tidak diganti" di bawah daftar. Memilih opsi dikerjakan di
//   ORD (ketuk, keranjang, tersimpan di order), bukan di sini. Menu tanpa grup tidak menampilkan bagian ini.

// ORD.03: untuk menu Tersedia, sheet kini juga berisi PILIHAN satu per grup (bawaan sudah terpilih), pengatur
//   jumlah, dan tombol "Tambah ke pesanan" yang memanggil window.KedaiPesan.tambah(menu, pilihan, jumlah)
//   (pesan.js), lalu sheet menutup. Menu Habis tetap hanya tampil (daftar baca-saja, tanpa tombol).
//   Data yang dibaca bertambah: id (menu), grup[].id, grup[].opsi[].id. Bila ada id yang kosong, tombol
//   Tambah tidak dipasang dan customer diminta menyegarkan menu. Tab berputar di antara kontrol di sheet.

(function () {
  "use strict";

  var JUMLAH_MAKS_FORMAT = 9999; // bentuk data saja (sama dengan pesan.js); batas sebenarnya diputuskan server
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

  var kontrolGrup = []; // ORD.03: [{ g: grup, radios: [input] }] untuk sheet yang sedang terbuka

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

  // MNU.11: grup pilihan, hanya ditampilkan (tanpa tombol atau kotak pilih). Semua teks lewat textContent.
  function buatGrup(daftar) {
    var bungkus = buat("div", "sheet-menu__pilihan");
    for (var i = 0; i < daftar.length; i++) {
      var g = daftar[i];
      if (!g || typeof g.nama !== "string" || !Array.isArray(g.opsi)) continue;
      var kelompok = buat("div", "sheet-menu__grup");
      kelompok.appendChild(buat("h3", "sheet-menu__grup-nama", g.nama));
      var daftarOpsi = buat("ul", "sheet-menu__opsi");
      for (var j = 0; j < g.opsi.length; j++) {
        var o = g.opsi[j];
        if (!o || typeof o.nama !== "string" || o.nama.trim() === "") continue;
        daftarOpsi.appendChild(
          buat("li", "", o.bawaan === true ? o.nama + " \u2705" : o.nama),
        );
      }
      if (daftarOpsi.children.length === 0) continue;
      kelompok.appendChild(daftarOpsi);
      bungkus.appendChild(kelompok);
    }
    if (bungkus.children.length === 0) return null;
    // Keterangan tanda centang (keputusan ketua 2026-11-08), satu kali di bawah semua grup.
    bungkus.appendChild(
      buat(
        "p",
        "sheet-menu__legenda",
        "\u2705 = otomatis dipilih kalau tidak diganti",
      ),
    );
    return bungkus;
  }

  // ORD.03: grup pilihan yang BISA dipilih (satu opsi per grup, bawaan sudah terpilih). Mengembalikan
  // { elemen, lengkap }; lengkap = false bila ada id grup atau id opsi yang kosong. Teks lewat textContent.
  function buatGrupPilih(daftar) {
    var bungkus = buat("div", "sheet-menu__pilihan");
    var lengkap = true;
    for (var i = 0; i < daftar.length; i++) {
      var g = daftar[i];
      if (!g || typeof g.nama !== "string" || !Array.isArray(g.opsi)) continue;
      if (typeof g.id !== "string" || g.id === "") lengkap = false;
      var kelompok = buat("div", "sheet-menu__grup");
      kelompok.setAttribute("role", "radiogroup");
      var judul = buat("h3", "sheet-menu__grup-nama", g.nama);
      judul.id = "sheet-grup-" + i;
      kelompok.setAttribute("aria-labelledby", judul.id);
      kelompok.appendChild(judul);
      var radios = [];
      var adaBawaan = false;
      for (var a = 0; a < g.opsi.length; a++) {
        if (g.opsi[a] && g.opsi[a].bawaan === true) adaBawaan = true;
      }
      for (var j = 0; j < g.opsi.length; j++) {
        var o = g.opsi[j];
        if (!o || typeof o.nama !== "string" || o.nama.trim() === "") continue;
        if (typeof o.id !== "string" || o.id === "") lengkap = false;
        var baris = buat("label", "sheet-menu__pilih");
        var radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "sheet-grup-" + i;
        radio.checked = adaBawaan ? o.bawaan === true : radios.length === 0;
        baris.appendChild(radio);
        baris.appendChild(buat("span", "", o.nama));
        kelompok.appendChild(baris);
        radios.push(radio);
      }
      if (radios.length === 0) continue;
      kontrolGrup.push({ g: g, radios: radios });
      bungkus.appendChild(kelompok);
    }
    if (bungkus.children.length === 0) return null;
    return { elemen: bungkus, lengkap: lengkap };
  }

  // ORD.03: jumlah dan tombol "Tambah ke pesanan". Pilihan dikumpulkan urut seperti grup di menu:
  // [{ id (uuid opsi), teks ("Nama grup: Nama opsi") }], sesuai kontrak KedaiPesan.tambah.
  function buatAksi(m, pilihanLengkap) {
    var bungkus = buat("div", "sheet-menu__aksi");
    if (!pilihanLengkap) {
      bungkus.appendChild(
        buat(
          "p",
          "isian__bantuan sheet-menu__ket",
          "Pilihan menu belum bisa dibaca. Tutup, lalu Segarkan menu.",
        ),
      );
      return bungkus;
    }

    var jumlah = 1;
    var baris = buat("div", "sheet-menu__jumlah");
    var kurang = buat("button", "tombol tombol--sekunder", "\u2212");
    kurang.type = "button";
    kurang.setAttribute("aria-label", "Kurangi jumlah");
    var angka = buat("span", "sheet-menu__jumlah-angka", "1");
    angka.setAttribute("aria-live", "polite");
    var tambahJumlah = buat("button", "tombol tombol--sekunder", "+");
    tambahJumlah.type = "button";
    tambahJumlah.setAttribute("aria-label", "Tambah jumlah");

    var galat = buat("p", "sheet-menu__galat");
    galat.hidden = true;

    function segarkanJumlah() {
      angka.textContent = String(jumlah);
      kurang.disabled = jumlah <= 1;
      tambahJumlah.disabled = jumlah >= JUMLAH_MAKS_FORMAT;
    }
    kurang.addEventListener("click", function () {
      if (jumlah > 1) jumlah--;
      segarkanJumlah();
    });
    tambahJumlah.addEventListener("click", function () {
      if (jumlah < JUMLAH_MAKS_FORMAT) jumlah++;
      segarkanJumlah();
    });
    segarkanJumlah();

    baris.appendChild(kurang);
    baris.appendChild(angka);
    baris.appendChild(tambahJumlah);
    bungkus.appendChild(baris);

    var tombol = buat("button", "tombol tombol--utama", "Tambah ke pesanan");
    tombol.type = "button";
    tombol.addEventListener("click", function () {
      var pilihan = [];
      for (var i = 0; i < kontrolGrup.length; i++) {
        var k = kontrolGrup[i];
        var terpilih = -1;
        for (var r = 0; r < k.radios.length; r++) {
          if (k.radios[r].checked) terpilih = r;
        }
        // Opsi yang tampil urut sama dengan g.opsi yang valid (nama tidak kosong).
        var valid = [];
        for (var x = 0; x < k.g.opsi.length; x++) {
          var o = k.g.opsi[x];
          if (o && typeof o.nama === "string" && o.nama.trim() !== "")
            valid.push(o);
        }
        if (terpilih < 0 || !valid[terpilih]) {
          galat.textContent = "Pilih satu opsi di tiap pilihan dulu.";
          galat.hidden = false;
          return;
        }
        pilihan.push({
          id: valid[terpilih].id,
          teks: k.g.nama + ": " + valid[terpilih].nama,
        });
      }
      var P = window.KedaiPesan;
      var masuk = !!(
        P &&
        typeof P.tambah === "function" &&
        P.tambah(
          { id: String(m.id), nama: m.nama, harga: Number(m.harga) },
          pilihan,
          jumlah,
        )
      );
      if (masuk) {
        tutup();
      } else {
        galat.textContent =
          "Belum bisa menambah ke pesanan. Tutup, Segarkan menu, lalu coba lagi.";
        galat.hidden = false;
      }
    });
    bungkus.appendChild(tombol);
    bungkus.appendChild(galat);
    return bungkus;
  }

  function isiSheet(m) {
    kontrolGrup = [];
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

    // MNU.11: grup pilihan (opsional, hanya tampil). Tidak ada grup: bagian ini tidak dibuat.
    // ORD.03: menu Tersedia memakai grup yang bisa dipilih; menu Habis tetap daftar baca-saja.
    var pilihanLengkap = true;
    if (Array.isArray(m.grup) && m.grup.length > 0) {
      if (m.tersedia) {
        var hasilPilih = buatGrupPilih(m.grup);
        if (hasilPilih) {
          isi.appendChild(hasilPilih.elemen);
          pilihanLengkap = hasilPilih.lengkap;
        }
      } else {
        var pilihan = buatGrup(m.grup);
        if (pilihan) isi.appendChild(pilihan);
      }
    }

    // ORD.03: jumlah dan tombol Tambah hanya untuk menu Tersedia yang punya id.
    if (m.tersedia && (typeof m.id === "string" || typeof m.id === "number")) {
      isi.appendChild(buatAksi(m, pilihanLengkap));
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
      // ORD.03: Tab berputar di antara kontrol sheet (tombol X, pilihan, jumlah, Tambah).
      // e.preventDefault();
      // tombolTutup.focus();
      var kontrol = lembar.querySelectorAll(
        "button:not([disabled]), input:not([disabled])",
      );
      if (kontrol.length === 0) {
        e.preventDefault();
        return;
      }
      var pertama = kontrol[0];
      var terakhir = kontrol[kontrol.length - 1];
      var aktif = document.activeElement;
      if (!lembar.contains(aktif)) {
        e.preventDefault();
        pertama.focus();
      } else if (e.shiftKey && aktif === pertama) {
        e.preventDefault();
        terakhir.focus();
      } else if (!e.shiftKey && aktif === terakhir) {
        e.preventDefault();
        pertama.focus();
      }
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
