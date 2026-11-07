// public/grup.js
// MNU.10: layar Kelola Grup pilihan untuk owner (menu.md: blok "2026-11-07: Layar Kelola Grup terpisah..."
// dan Handoff #7, #8). Layar terpisah, dibuka dari tombol "Kelola grup pilihan" di tab Menu
// (id menu-ke-grup di index.html), polanya sama dengan Buku alamat (alamat.js).
// Dimuat SETELAH akun.js karena memakai window.KedaiAkun (pembantu layar dan panggilan ke `kedai`).
//
// Giliran 1: buat, ubah, nonaktifkan, dan aktifkan kembali grup beserta opsinya.
// Giliran 2: kotak centang untuk memasang grup ke menu (menu_grup_atur), dari sisi grup. Tombol
// "Pasang ke menu" di kartu grup aktif membuka daftar menu dengan kotak centang; tiap ketukan langsung
// menyimpan. menu_grup_atur meminta daftar LENGKAP grup aktif untuk satu menu (urutan = urutan tampil),
// jadi daftar menu dan grup terpasangnya dimuat dulu lewat menu_daftar. Grup yang baru dicentang
// ditaruh di urutan terakhir. Batas jumlah grup per menu tidak dihitung di sini; pesan server ditampilkan.
//
// Aturan yang dijaga:
// - Yang dikirim hanya aksi dan isian (id grup bila ubah, nama, daftar opsi, aktifkan). Aplikasi tidak pernah
//   mengirim peran; server membacanya dari token dan menolak selain owner (403).
// - grup_simpan meminta DAFTAR OPSI LENGKAP (termasuk opsi nonaktif) saat mengubah grup. Karena itu layar
//   selalu memuat dulu lewat grup_daftar, dan opsi yang "dihapus" hanya ditandai aktif: false, bukan dibuang.
// - Cek di aplikasi hanya kemudahan (panjang nama, minimal 2 opsi aktif, tepat satu opsi bawaan). Batas jumlah
//   grup dan opsi, nama kembar, dan aturan lain diputuskan server; pesannya ditampilkan apa adanya.
// - Grup dan opsi tidak pernah dihapus: hanya Nonaktifkan dan Aktifkan kembali (sejalan MN3).
// - Daftar diambil sekali saat layar dibuka dan lewat tombol Muat ulang; tanpa polling (MN7).
// - Semua teks (nama grup, nama opsi, pesan) dipasang lewat textContent, bukan innerHTML.
// - Galat mentah tidak ditampilkan. Tidak ada console.log berisi data.
//
// CATATAN BENTUK DATA: bacaGrup() di bawah mengandaikan tiap grup dari server berbentuk
// { id, nama, aktif, opsi: [{ id, nama, bawaan, aktif }] }. Bila uji pertama menunjukkan bentuknya beda,
// cukup fungsi bacaGrup dan bacaOpsi yang disesuaikan.

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A) {
    // akun.js belum termuat: window.KedaiGrup tidak dibuat.
    return;
  }

  function el(id) {
    return document.getElementById(id);
  }

  var TEKS_SIMPAN = "Simpan grup";
  var PESAN_UMUM = "Grup belum bisa diproses. Coba lagi sebentar lagi.";
  var PESAN_MUAT =
    "Daftar grup belum bisa dimuat. Tekan Muat ulang untuk mencoba lagi.";
  var PESAN_BACA =
    "Daftar grup belum bisa ditampilkan. Tekan Muat ulang untuk mencoba lagi.";
  var PESAN_MUAT_MENU =
    "Daftar menu belum bisa dimuat. Tekan Muat ulang menu untuk mencoba lagi.";
  var PESAN_BACA_MENU =
    "Daftar menu belum bisa ditampilkan. Tekan Muat ulang menu untuk mencoba lagi.";
  var PESAN_OFFLINE = "Belum bisa terhubung. Periksa internet lalu coba lagi.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";
  var PESAN_BUKAN_OWNER = "Hanya owner yang boleh mengelola grup pilihan.";
  var PESAN_ATAS_AKTIFKAN =
    " Bila namanya sudah dipakai grup lain, tekan Ubah untuk mengganti namanya dulu.";

  var daftar = []; // semua grup dari server: { id, nama, aktif, opsi: [{ id, nama, bawaan, aktif }] }
  var termuat = false; // sudah berhasil memuat dari server
  var idUbah = null; // id grup yang sedang diubah di form; null = tambah baru
  var draftOpsi = []; // opsi yang sedang diedit di form (id "" = opsi baru yang belum disimpan)
  var ubahNonaktif = false; // form sedang mengubah grup nonaktif (menyimpan = mengaktifkan kembali)
  var idKonfirmasi = null; // id grup yang sedang ditanya "yakin nonaktifkan?"
  var idSibuk = null; // id grup yang aksinya sedang diproses
  var sedangProses = false;
  var nomorMuat = 0; // naik tiap muat dan reset; balasan lama (nomor tidak cocok) diabaikan

  // Giliran 2 (pemasangan ke menu)
  var menuData = []; // semua menu dari server: { id, nama, aktif, grup: [{ id, nama }] } (grup = yang aktif, berurutan)
  var menuTermuat = false; // daftar menu berhasil dimuat
  var menuGalat = ""; // pesan galat muat daftar menu (tampil di panel pemasangan)
  var galatPasang = ""; // pesan galat saat mengubah pemasangan (tampil di panel pemasangan)
  var idPasang = null; // id grup yang panel pemasangannya sedang terbuka
  var nomorMuatMenu = 0; // seperti nomorMuat, untuk daftar menu

  // ------------------------------------------------------------
  // Pembantu
  // ------------------------------------------------------------

  function buat(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks !== undefined) e.textContent = teks;
    return e;
  }

  function buatTombol(teks, kelas, aksi, mati) {
    var t = buat("button", "tombol " + kelas, teks);
    t.type = "button";
    t.disabled = !!mati;
    t.addEventListener("click", aksi);
    return t;
  }

  function rapikan(teks) {
    return String(teks).replace(/\s+/g, " ").trim();
  }

  // Pesan dari fungsi kedai sendiri (ok:false + pesan) aman ditampilkan; selain itu pesan umum.
  function pesanHasil(h, cadangan) {
    if (
      h &&
      h.data &&
      h.data.ok === false &&
      typeof h.data.pesan === "string"
    ) {
      return h.data.pesan;
    }
    if (h && h.status === 403) return PESAN_BUKAN_OWNER;
    return cadangan;
  }

  function bacaOpsi(d) {
    var hasil = [];
    if (!Array.isArray(d)) return hasil;
    for (var i = 0; i < d.length; i++) {
      var o = d[i];
      if (
        o &&
        (typeof o.id === "string" || typeof o.id === "number") &&
        typeof o.nama === "string"
      ) {
        hasil.push({
          id: o.id,
          nama: o.nama,
          bawaan: o.bawaan === true,
          aktif: o.aktif !== false,
        });
      }
    }
    return hasil;
  }

  // Ambil hanya grup yang bentuknya benar. null bila daftar tidak bisa dibaca sama sekali.
  function bacaGrup(d) {
    if (!Array.isArray(d)) return null;
    var hasil = [];
    for (var i = 0; i < d.length; i++) {
      var g = d[i];
      if (
        g &&
        (typeof g.id === "string" || typeof g.id === "number") &&
        typeof g.nama === "string"
      ) {
        hasil.push({
          id: g.id,
          nama: g.nama,
          aktif: g.aktif !== false,
          opsi: bacaOpsi(g.opsi),
        });
      }
    }
    if (d.length > 0 && hasil.length === 0) return null;
    return hasil;
  }

  // Satu menu dari server. Menu tanpa daftar `grup` dianggap tidak terbaca (null): mengirim daftar
  // pemasangan dari data yang tidak lengkap bisa melepas grup lain dari menu itu.
  function bacaSatuMenu(m) {
    if (
      !m ||
      (typeof m.id !== "string" && typeof m.id !== "number") ||
      typeof m.nama !== "string" ||
      !Array.isArray(m.grup)
    ) {
      return null;
    }
    var grup = [];
    for (var i = 0; i < m.grup.length; i++) {
      var g = m.grup[i];
      if (g && (typeof g.id === "string" || typeof g.id === "number")) {
        grup.push({ id: g.id, nama: typeof g.nama === "string" ? g.nama : "" });
      }
    }
    return { id: m.id, nama: m.nama, aktif: m.aktif !== false, grup: grup };
  }

  // Daftar menu. null bila ada menu yang tidak terbaca atau bentuknya bukan daftar.
  function bacaMenuGrup(d) {
    if (!Array.isArray(d)) return null;
    var hasil = [];
    for (var i = 0; i < d.length; i++) {
      var m = bacaSatuMenu(d[i]);
      if (!m) return null;
      hasil.push(m);
    }
    return hasil;
  }

  // Balasan aksi yang membawa `menu`: bisa berupa daftar penuh atau satu menu. Mengembalikan true bila
  // daftar menu di layar berhasil diperbarui.
  function terapkanMenu(d) {
    var baru = bacaMenuGrup(d);
    if (baru) {
      menuData = baru;
      menuTermuat = true;
      menuGalat = "";
      return true;
    }
    var satu = bacaSatuMenu(d);
    if (satu && menuTermuat) {
      var ketemu = false;
      for (var i = 0; i < menuData.length; i++) {
        if (menuData[i].id === satu.id) {
          menuData[i] = satu;
          ketemu = true;
        }
      }
      if (ketemu) return true;
    }
    return false;
  }

  function salinOpsi(opsi) {
    var hasil = [];
    for (var i = 0; i < opsi.length; i++) {
      hasil.push({
        id: opsi[i].id,
        nama: opsi[i].nama,
        bawaan: opsi[i].bawaan,
        aktif: opsi[i].aktif,
      });
    }
    return hasil;
  }

  // Bentuk opsi yang dikirim ke server. Opsi baru (id kosong) dikirim tanpa field id.
  function opsiUntukKirim(opsi) {
    var hasil = [];
    for (var i = 0; i < opsi.length; i++) {
      var o = opsi[i];
      var elemen = {
        nama: o.nama,
        bawaan: o.aktif && o.bawaan,
        aktif: o.aktif,
      };
      if (o.id !== "") elemen.id = o.id;
      hasil.push(elemen);
    }
    return hasil;
  }

  function galatDaftar(pesan) {
    var p = el("grup-daftar-galat");
    p.textContent = pesan || "";
    p.hidden = !pesan;
  }

  function tampilPesan(teks) {
    el("grup-pesan").textContent = teks || "";
    el("grup-pesan-bungkus").hidden = !teks;
  }

  function bersihkanGalatForm() {
    A.galatIsian("isian-grup-nama", "");
    A.galatForm("grup", "");
  }

  // ------------------------------------------------------------
  // Tampilan daftar
  // ------------------------------------------------------------

  function ringkasOpsi(g) {
    var nama = [];
    for (var i = 0; i < g.opsi.length; i++) {
      var o = g.opsi[i];
      if (o.aktif) nama.push(o.nama + (o.bawaan ? " (bawaan)" : ""));
    }
    return nama.length > 0 ? nama.join(", ") : "Belum ada opsi aktif.";
  }

  function buatKartu(g) {
    var kartu = buat(
      "div",
      "kartu menu-kartu" + (g.aktif ? "" : " menu-kartu--nonaktif"),
    );

    var atas = buat("div", "menu-kartu__atas");
    var info = buat("div", "menu-info");
    info.appendChild(buat("p", "menu-nama", g.nama));
    var lencana = buat("div", "menu-lencana");
    if (g.aktif) {
      lencana.appendChild(buat("span", "lencana lencana--tersedia", "Aktif"));
    } else {
      lencana.appendChild(
        buat("span", "lencana lencana--nonaktif", "Nonaktif"),
      );
    }
    info.appendChild(lencana);
    info.appendChild(buat("p", "isian__bantuan", ringkasOpsi(g)));
    if (g.aktif && menuTermuat) {
      info.appendChild(buat("p", "isian__bantuan", ringkasPasang(g)));
    }
    atas.appendChild(info);
    kartu.appendChild(atas);

    var sibukIni = sedangProses && idSibuk === g.id;
    var baris = buat("div", "baris-tombol");

    if (g.aktif && idKonfirmasi === g.id) {
      kartu.appendChild(
        buat(
          "p",
          "isian__bantuan",
          "Nonaktifkan grup ini? Pilihan ini tidak tampil lagi di menu yang memakainya. Order lama tidak berubah. Bisa diaktifkan kembali.",
        ),
      );
      baris.appendChild(
        buatTombol(
          "Batal",
          "tombol--sekunder",
          function () {
            idKonfirmasi = null;
            render();
          },
          sedangProses,
        ),
      );
      baris.appendChild(
        buatTombol(
          sibukIni ? "Memproses..." : "Ya, nonaktifkan",
          "tombol--bahaya",
          function () {
            nonaktifkan(g);
          },
          sedangProses,
        ),
      );
    } else {
      if (g.aktif) {
        var barisPasang = buat("div", "baris-tombol");
        barisPasang.appendChild(
          buatTombol(
            idPasang === g.id ? "Tutup pemasangan" : "Pasang ke menu",
            "tombol--sekunder",
            function () {
              idPasang = idPasang === g.id ? null : g.id;
              galatPasang = "";
              render();
            },
            sedangProses,
          ),
        );
        kartu.appendChild(barisPasang);
      }
      baris.appendChild(
        buatTombol(
          "Ubah",
          "tombol--sekunder",
          function () {
            bukaForm(g);
          },
          sedangProses,
        ),
      );
      if (g.aktif) {
        baris.appendChild(
          buatTombol(
            "Nonaktifkan",
            "tombol--bahaya",
            function () {
              galatDaftar("");
              tampilPesan("");
              idKonfirmasi = g.id;
              render();
            },
            sedangProses,
          ),
        );
      } else {
        baris.appendChild(
          buatTombol(
            sibukIni ? "Memproses..." : "Aktifkan kembali",
            "tombol--utama",
            function () {
              aktifkan(g);
            },
            sedangProses,
          ),
        );
      }
    }
    kartu.appendChild(baris);
    if (g.aktif && idPasang === g.id && idKonfirmasi !== g.id) {
      kartu.appendChild(buatPanelPasang(g));
    }
    return kartu;
  }

  // ------------------------------------------------------------
  // Pemasangan grup ke menu (giliran 2)
  // ------------------------------------------------------------

  function terpasangDi(g, m) {
    for (var i = 0; i < m.grup.length; i++) {
      if (m.grup[i].id === g.id) return true;
    }
    return false;
  }

  function ringkasPasang(g) {
    var nama = [];
    for (var i = 0; i < menuData.length; i++) {
      if (terpasangDi(g, menuData[i])) nama.push(menuData[i].nama);
    }
    if (nama.length === 0) return "Belum dipasang di menu mana pun.";
    return "Dipasang di " + nama.length + " menu: " + nama.join(", ") + ".";
  }

  function buatPanelPasang(g) {
    var panel = buat("div", "pasang-menu");
    panel.appendChild(
      buat("p", "pasang-menu__judul", "Pasang " + g.nama + " di menu"),
    );

    if (!menuTermuat) {
      if (menuGalat) {
        var galat = buat("p", "isian__galat", menuGalat);
        galat.setAttribute("role", "alert");
        panel.appendChild(galat);
        var baris = buat("div", "baris-tombol");
        baris.appendChild(
          buatTombol(
            "Muat ulang menu",
            "tombol--sekunder",
            function () {
              muatMenu();
            },
            false,
          ),
        );
        panel.appendChild(baris);
      } else {
        panel.appendChild(buat("p", "isian__bantuan", "Memuat menu..."));
      }
      return panel;
    }

    if (menuData.length === 0) {
      panel.appendChild(buat("p", "isian__bantuan", "Belum ada menu."));
      return panel;
    }

    panel.appendChild(
      buat(
        "p",
        "isian__bantuan",
        "Centang menu yang memakai grup ini. Perubahan langsung tersimpan. Grup tampil di menu sesuai urutan pemasangan.",
      ),
    );

    var sibuk = sedangProses;
    for (var i = 0; i < menuData.length; i++) {
      panel.appendChild(buatBarisMenu(g, menuData[i], sibuk));
    }

    if (galatPasang) {
      var gp = buat("p", "isian__galat", galatPasang);
      gp.setAttribute("role", "alert");
      panel.appendChild(gp);
    }
    return panel;
  }

  function buatBarisMenu(g, m, sibuk) {
    var label = buat("label", "pasang-menu__baris");
    var kotak = document.createElement("input");
    kotak.type = "checkbox";
    kotak.checked = terpasangDi(g, m);
    kotak.disabled = !!sibuk;
    kotak.addEventListener("change", function () {
      pasang(g, m, kotak.checked);
    });
    label.appendChild(kotak);
    label.appendChild(
      buat(
        "span",
        "pasang-menu__nama",
        m.nama + (m.aktif ? "" : " (nonaktif)"),
      ),
    );
    return label;
  }

  // Ubah pemasangan satu grup di satu menu. Yang dikirim: daftar lengkap grup aktif menu itu (urutan lama
  // dipertahankan; grup yang baru dicentang di urutan terakhir).
  function pasang(g, m, pasangkan) {
    if (sedangProses) return;
    var ids = [];
    for (var i = 0; i < m.grup.length; i++) {
      if (m.grup[i].id !== g.id) ids.push(m.grup[i].id);
    }
    if (pasangkan) ids.push(g.id);

    sedangProses = true;
    idSibuk = g.id;
    galatPasang = "";
    galatDaftar("");
    tampilPesan("");
    render();

    A.panggilKedai("menu_grup_atur", { menu_id: m.id, grup_ids: ids })
      .then(function (h) {
        akhiriAksi();
        if (h.status === 200 && h.data && h.data.ok === true) {
          if (!terapkanMenu(h.data.menu)) muatMenu();
          render();
          tampilPesan(
            pasangkan
              ? g.nama + " dipasang di " + m.nama + "."
              : g.nama + " dilepas dari " + m.nama + ".",
          );
          return;
        }
        var pesan =
          h.status === 401 && !h.data ? PESAN_SESI : pesanHasil(h, PESAN_UMUM);
        galatPasang = pesan;
        render();
        // Menu atau grup sudah berubah di server (404/409): muat ulang supaya kotak sesuai kenyataan.
        if (h.status === 404 || h.status === 409) muatMenu();
      })
      .catch(function () {
        akhiriAksi();
        galatPasang = navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE;
        render();
      });
  }

  // Ambil menu beserta grup terpasangnya (aksi menu_daftar; owner mendapat semua menu).
  function muatMenu() {
    var nomor = ++nomorMuatMenu;
    menuGalat = "";
    return A.panggilKedai("menu_daftar")
      .then(function (h) {
        if (nomor !== nomorMuatMenu) return;
        if (h.status === 200 && h.data && h.data.ok === true) {
          var baru = bacaMenuGrup(h.data.menu);
          if (baru) {
            menuData = baru;
            menuTermuat = true;
            menuGalat = "";
            render();
            return;
          }
          menuGalat = PESAN_BACA_MENU;
        } else if (h.status === 401 && !h.data) {
          menuGalat = PESAN_SESI;
        } else {
          menuGalat = pesanHasil(h, PESAN_MUAT_MENU);
        }
        menuTermuat = false;
        render();
      })
      .catch(function () {
        if (nomor !== nomorMuatMenu) return;
        menuGalat = navigator.onLine ? PESAN_MUAT_MENU : PESAN_OFFLINE;
        menuTermuat = false;
        render();
      });
  }

  function render() {
    var wadah = el("grup-daftar-isi");
    while (wadah.firstChild) {
      wadah.removeChild(wadah.firstChild);
    }

    for (var i = 0; i < daftar.length; i++) {
      wadah.appendChild(buatKartu(daftar[i]));
    }

    if (termuat && daftar.length === 0) {
      var kosong = buat("div", "keadaan");
      kosong.setAttribute("role", "status");
      kosong.appendChild(buat("p", "keadaan__judul", "Belum ada grup"));
      kosong.appendChild(
        buat(
          "p",
          "keadaan__ket",
          "Tekan Tambah grup untuk membuat grup pilihan pertama, misalnya Tingkat pedas.",
        ),
      );
      wadah.appendChild(kosong);
    }

    var ringkas = el("grup-ringkas");
    if (!termuat) {
      ringkas.textContent = "Memuat grup...";
    } else {
      var aktif = 0;
      for (var j = 0; j < daftar.length; j++) {
        if (daftar[j].aktif) aktif++;
      }
      ringkas.textContent = daftar.length + " grup, " + aktif + " aktif.";
    }

    el("grup-tambah").disabled = !termuat || sedangProses;
  }

  // Ambil data terbaru dari server (aksi grup_daftar: semua grup dan opsi, termasuk yang nonaktif).
  // `pesanTetap` (opsional): pesan yang tetap tampil di atas daftar setelah muat.
  function muat(pesanTetap) {
    var nomor = ++nomorMuat;
    return A.panggilKedai("grup_daftar")
      .then(function (h) {
        if (nomor !== nomorMuat) return;
        if (h.status === 200 && h.data && h.data.ok === true) {
          var baru = bacaGrup(h.data.grup);
          if (baru) {
            daftar = baru;
            termuat = true;
            render();
            galatDaftar(pesanTetap || "");
            return;
          }
          galatDaftar(pesanTetap || PESAN_BACA);
          return;
        }
        if (h.status === 401 && !h.data) {
          galatDaftar(PESAN_SESI);
          return;
        }
        galatDaftar(pesanTetap || pesanHasil(h, PESAN_MUAT));
      })
      .catch(function () {
        if (nomor !== nomorMuat) return;
        galatDaftar(
          pesanTetap || (navigator.onLine ? PESAN_MUAT : PESAN_OFFLINE),
        );
      });
  }

  // ------------------------------------------------------------
  // Balasan aksi yang mengubah grup (sukses membawa daftar terbaru di `grup`)
  // ------------------------------------------------------------

  // `laporGalat(pesan, status)`: status = kode HTTP balasan (401 bila sesi habis).
  function olahBalasan(h, pesanSukses, laporGalat) {
    if (h.status === 200 && h.data && h.data.ok === true) {
      var baru = bacaGrup(h.data.grup);
      galatDaftar("");
      // Menonaktifkan atau mengubah grup bisa mengubah grup terpasang di menu; balasan membawa `menu`.
      if (h.data.menu === undefined || !terapkanMenu(h.data.menu)) muatMenu();
      if (baru) {
        daftar = baru;
        termuat = true;
        render();
      } else {
        render();
        muat();
      }
      tampilPesan(pesanSukses);
      return;
    }
    if (h.status === 401 && !h.data) {
      laporGalat(PESAN_SESI, 401);
      return;
    }
    laporGalat(pesanHasil(h, PESAN_UMUM), h.status);
  }

  // Galat aksi di daftar. Grup tidak ditemukan (404) atau aturan berubah (409): data di layar sudah
  // basi, jadi daftar dimuat ulang dan pesannya tetap tampil.
  function galatAksi(pesan, status) {
    render();
    if (status === 404 || status === 409) {
      muat(pesan);
    } else {
      galatDaftar(pesan);
    }
  }

  function mulaiAksi(id) {
    sedangProses = true;
    idSibuk = id;
    galatDaftar("");
    tampilPesan("");
    render();
  }

  function akhiriAksi() {
    sedangProses = false;
    idSibuk = null;
    idKonfirmasi = null;
  }

  // ------------------------------------------------------------
  // Nonaktifkan dan Aktifkan kembali
  // ------------------------------------------------------------

  function nonaktifkan(g) {
    if (sedangProses) return;
    mulaiAksi(g.id);
    A.panggilKedai("grup_nonaktif", { id: g.id })
      .then(function (h) {
        akhiriAksi();
        olahBalasan(h, g.nama + " dinonaktifkan.", galatAksi);
      })
      .catch(function () {
        akhiriAksi();
        galatAksi(navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE, 0);
      });
  }

  // Mengaktifkan kembali lewat grup_simpan dengan isian grup yang sekarang (semua opsi ikut) + aktifkan: true.
  function aktifkan(g) {
    if (sedangProses) return;
    mulaiAksi(g.id);
    A.panggilKedai("grup_simpan", {
      id: g.id,
      nama: g.nama,
      opsi: opsiUntukKirim(g.opsi),
      aktifkan: true,
    })
      .then(function (h) {
        akhiriAksi();
        olahBalasan(
          h,
          g.nama + " diaktifkan kembali.",
          function (pesan, status) {
            galatAksi(
              status === 409 ? pesan + PESAN_ATAS_AKTIFKAN : pesan,
              status,
            );
          },
        );
      })
      .catch(function () {
        akhiriAksi();
        galatAksi(navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE, 0);
      });
  }

  // ------------------------------------------------------------
  // Form tambah dan ubah (editor opsi)
  // ------------------------------------------------------------

  function buatBarisOpsi(o, nomor) {
    var kartu = buat("div", "kartu");

    var label = buat("label", "isian__label", "Opsi " + nomor);
    label.setAttribute("for", "grup-opsi-nama-" + nomor);
    kartu.appendChild(label);

    var kolom = buat("input", "isian__kolom");
    kolom.type = "text";
    kolom.id = "grup-opsi-nama-" + nomor;
    kolom.maxLength = 30;
    kolom.autocomplete = "off";
    kolom.value = o.nama;
    // Teks yang diketik langsung disimpan ke draf, supaya tidak hilang saat daftar opsi digambar ulang.
    kolom.addEventListener("input", function () {
      o.nama = kolom.value;
    });
    kartu.appendChild(kolom);

    if (o.bawaan) {
      var lencana = buat("div", "menu-lencana");
      lencana.appendChild(buat("span", "lencana lencana--tersedia", "Bawaan"));
      kartu.appendChild(lencana);
      return kartu;
    }

    var baris = buat("div", "baris-tombol");
    baris.appendChild(
      buatTombol(
        "Jadikan bawaan",
        "tombol--sekunder",
        function () {
          for (var i = 0; i < draftOpsi.length; i++) {
            draftOpsi[i].bawaan = false;
          }
          o.bawaan = true;
          renderOpsi();
        },
        sedangProses,
      ),
    );
    baris.appendChild(
      buatTombol(
        o.id === "" ? "Hapus opsi" : "Nonaktifkan opsi",
        "tombol--bahaya",
        function () {
          if (o.id === "") {
            // Opsi baru yang belum disimpan: cukup dibuang dari draf.
            draftOpsi.splice(draftOpsi.indexOf(o), 1);
          } else {
            // Opsi yang sudah ada di server tidak dibuang, hanya ditandai nonaktif (dikirim aktif: false).
            o.aktif = false;
            o.bawaan = false;
          }
          renderOpsi();
        },
        sedangProses,
      ),
    );
    kartu.appendChild(baris);
    return kartu;
  }

  function buatBarisNonaktif(o) {
    var kartu = buat("div", "kartu menu-kartu menu-kartu--nonaktif");
    var atas = buat("div", "menu-kartu__atas");
    var info = buat("div", "menu-info");
    info.appendChild(buat("p", "menu-nama", o.nama));
    var lencana = buat("div", "menu-lencana");
    lencana.appendChild(buat("span", "lencana lencana--nonaktif", "Nonaktif"));
    info.appendChild(lencana);
    atas.appendChild(info);
    kartu.appendChild(atas);

    var baris = buat("div", "baris-tombol");
    baris.appendChild(
      buatTombol(
        "Aktifkan lagi",
        "tombol--sekunder",
        function () {
          o.aktif = true;
          o.bawaan = false;
          renderOpsi();
        },
        sedangProses,
      ),
    );
    kartu.appendChild(baris);
    return kartu;
  }

  function renderOpsi() {
    var wadah = el("grup-opsi-isi");
    while (wadah.firstChild) {
      wadah.removeChild(wadah.firstChild);
    }

    var nomor = 0;
    var nonaktif = [];
    for (var i = 0; i < draftOpsi.length; i++) {
      if (draftOpsi[i].aktif) {
        nomor++;
        wadah.appendChild(buatBarisOpsi(draftOpsi[i], nomor));
      } else {
        nonaktif.push(draftOpsi[i]);
      }
    }

    if (nonaktif.length > 0) {
      wadah.appendChild(buat("h2", "home-judul", "Opsi nonaktif"));
      for (var j = 0; j < nonaktif.length; j++) {
        wadah.appendChild(buatBarisNonaktif(nonaktif[j]));
      }
    }
  }

  function bukaForm(g) {
    idUbah = g ? g.id : null;
    ubahNonaktif = !!g && !g.aktif;
    idKonfirmasi = null;
    galatDaftar("");
    tampilPesan("");
    bersihkanGalatForm();
    el("grup-form-judul").textContent = g ? "Ubah grup" : "Tambah grup";
    el("grup-form-nonaktif-ket").hidden = !ubahNonaktif;
    el("grup-nama").value = g ? g.nama : "";
    if (g) {
      draftOpsi = salinOpsi(g.opsi);
    } else {
      // Grup baru dimulai dengan dua opsi kosong; opsi pertama jadi bawaan.
      draftOpsi = [
        { id: "", nama: "", bawaan: true, aktif: true },
        { id: "", nama: "", bawaan: false, aktif: true },
      ];
    }
    renderOpsi();
    el("grup-daftar-bungkus").hidden = true;
    el("grup-form-bungkus").hidden = false;
    window.scrollTo(0, 0);
  }

  function tutupForm() {
    idUbah = null;
    ubahNonaktif = false;
    draftOpsi = [];
    el("grup-nama").value = "";
    el("grup-form-nonaktif-ket").hidden = true;
    renderOpsi();
    bersihkanGalatForm();
    el("grup-form-bungkus").hidden = true;
    el("grup-daftar-bungkus").hidden = false;
    window.scrollTo(0, 0);
  }

  function tambahOpsi() {
    if (sedangProses) return;
    draftOpsi.push({ id: "", nama: "", bawaan: false, aktif: true });
    renderOpsi();
    var kolom = el("grup-opsi-isi").querySelectorAll("input.isian__kolom");
    if (kolom.length > 0) kolom[kolom.length - 1].focus();
  }

  function kirim(e) {
    e.preventDefault();
    if (sedangProses) return;
    bersihkanGalatForm();

    var nama = rapikan(el("grup-nama").value);

    // Susun daftar opsi yang akan dikirim. Opsi baru yang dibiarkan kosong diabaikan.
    var siap = [];
    var jumlahAktif = 0;
    var jumlahBawaan = 0;
    var dipakai = {};
    var galatOpsi = "";
    for (var i = 0; i < draftOpsi.length; i++) {
      var o = draftOpsi[i];
      var namaOpsi = rapikan(o.nama);
      if (o.id === "" && o.aktif && namaOpsi === "") continue;
      if (o.aktif) {
        jumlahAktif++;
        if (o.bawaan) jumlahBawaan++;
        if (!galatOpsi && (namaOpsi.length < 2 || namaOpsi.length > 30)) {
          galatOpsi = "Nama tiap opsi harus 2 sampai 30 karakter.";
        } else if (!galatOpsi && dipakai[namaOpsi.toLowerCase()]) {
          galatOpsi =
            "Ada dua opsi dengan nama yang sama. Ganti salah satunya.";
        }
        dipakai[namaOpsi.toLowerCase()] = true;
      }
      siap.push({
        id: o.id,
        nama: namaOpsi,
        bawaan: o.aktif && o.bawaan,
        aktif: o.aktif,
      });
    }

    var lengkap = true;
    if (nama.length < 3 || nama.length > 30) {
      A.galatIsian("isian-grup-nama", "Nama grup harus 3 sampai 30 karakter.");
      lengkap = false;
    }
    if (!galatOpsi && jumlahAktif < 2) {
      galatOpsi = "Isi minimal 2 opsi.";
    }
    if (!galatOpsi && jumlahBawaan !== 1) {
      galatOpsi = "Pilih tepat satu opsi bawaan.";
    }
    if (galatOpsi) {
      A.galatForm("grup", galatOpsi);
      lengkap = false;
    }
    if (!lengkap) return;

    var data = {
      nama: nama,
      opsi: opsiUntukKirim(siap),
      aktifkan: ubahNonaktif,
    };
    var tambah = idUbah === null;
    if (!tambah) data.id = idUbah;
    var pesanSukses = tambah
      ? "Grup ditambahkan."
      : ubahNonaktif
        ? "Grup disimpan dan diaktifkan kembali."
        : "Perubahan grup disimpan.";

    var tombol = el("tombol-grup-simpan");
    sedangProses = true;
    A.sibuk(tombol, true, TEKS_SIMPAN);

    A.panggilKedai("grup_simpan", data)
      .then(function (h) {
        sedangProses = false;
        A.sibuk(tombol, false, TEKS_SIMPAN);

        if (h.status === 200 && h.data && h.data.ok === true) {
          tutupForm();
        }
        olahBalasan(h, pesanSukses, function (pesan, status) {
          if (status === 404) {
            // Grup sudah tidak ada di server: kembali ke daftar dan segarkan.
            tutupForm();
            render();
            muat(pesan);
            return;
          }
          // Galat lain (nama kembar, batas jumlah, aturan opsi): tetap di form supaya bisa diperbaiki.
          A.galatForm("grup", pesan);
        });
      })
      .catch(function () {
        sedangProses = false;
        A.sibuk(tombol, false, TEKS_SIMPAN);
        A.galatForm("grup", navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE);
      });
  }

  // ------------------------------------------------------------
  // Buka dan tutup layar
  // ------------------------------------------------------------

  // Dipanggil saat tombol "Kelola grup pilihan" di tab Menu diketuk.
  function kosongkanPasang() {
    nomorMuatMenu++;
    menuData = [];
    menuTermuat = false;
    menuGalat = "";
    galatPasang = "";
    idPasang = null;
  }

  function tampil() {
    nomorMuat++;
    daftar = [];
    termuat = false;
    idKonfirmasi = null;
    idSibuk = null;
    sedangProses = false;
    kosongkanPasang();
    tutupForm();
    galatDaftar("");
    tampilPesan("");
    render();
    A.tampilkan("grup");
    muat();
    muatMenu();
  }

  // Dipanggil akun.js saat Keluar: tidak boleh ada data tersisa di layar, dan balasan yang masih
  // di jalan diabaikan.
  function reset() {
    nomorMuat++;
    daftar = [];
    termuat = false;
    idKonfirmasi = null;
    idSibuk = null;
    sedangProses = false;
    kosongkanPasang();
    tutupForm();
    galatDaftar("");
    tampilPesan("");
    render();
    el("grup-ringkas").textContent = "";
  }

  el("menu-ke-grup").addEventListener("click", tampil);
  el("grup-tambah").addEventListener("click", function () {
    bukaForm(null);
  });
  el("grup-muat-ulang").addEventListener("click", function () {
    galatDaftar("");
    muat();
    muatMenu();
  });
  el("grup-kembali").addEventListener("click", function () {
    A.tampilkan("sementara");
  });
  el("grup-opsi-tambah").addEventListener("click", tambahOpsi);
  el("grup-batal").addEventListener("click", tutupForm);
  el("form-grup").addEventListener("submit", kirim);

  window.KedaiGrup = Object.freeze({
    tampil: tampil,
    reset: reset,
  });
})();
