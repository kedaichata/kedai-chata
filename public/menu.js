// public/menu.js
// MNU.03: layar Kelola Menu untuk owner (menu.md MN1 sampai MN5 dan catatan Handoff #2).
// Tampil sebagai isi tab "Menu" di kerangka layar utama (kerangka.js memanggil KedaiMenu.tampil).
// Dimuat SETELAH akun.js karena memakai window.KedaiAkun (pembantu layar dan panggilan ke `kedai`).
//
// MNU.04: bagian "daftar untuk customer" (tab Pesan) ada di blok terpisah di bawah. Hanya dilihat, tanpa tombol;
// tombol pilih menu menyusul di ORD.
//
// MNU.08: kartu menu customer bisa diketuk untuk membuka sheet detail (window.KedaiMenuDetail, berkas
// menu-detail.js). Bila komponen itu belum termuat, kartu tampil dan berperilaku seperti sebelumnya.
//
// Aturan yang dijaga:
// - Yang dikirim hanya aksi dan isian (id, nama, harga angka bulat, nama berkas foto, aktifkan,
//   tersedia). Aplikasi tidak pernah mengirim peran; server membacanya dari token dan menolak
//   selain owner. Menyembunyikan tab Menu dari peran lain hanya kemudahan.
// - Cek di aplikasi hanya kemudahan (panjang nama, harga angka bulat, bentuk nama berkas). Batas harga
//   (harga_maks_menu), nama kembar, dan aturan lain diputuskan server; pesannya ditampilkan apa adanya.
// - Menu tidak pernah dihapus: hanya Nonaktifkan dan Aktifkan kembali (MN3).
// - Daftar diambil sekali saat tab dibuka dan lewat Segarkan; tanpa polling (MN7).
// - Foto menu ada di folder img/ (nama berkas saja). Berkas belum ada atau salah ketik: tampil placeholder.
// - Semua teks (nama menu, pesan) dipasang lewat textContent, bukan innerHTML.
// - Galat mentah tidak ditampilkan. Tidak ada console.log berisi data.
//
// CATATAN BENTUK DATA: bacaMenu() di bawah mengandaikan tiap menu dari server berbentuk
// { id, nama, harga, tersedia, aktif, foto }. Bila uji pertama menunjukkan bentuknya beda,
// cukup fungsi bacaMenu yang disesuaikan.

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A) {
    // akun.js belum termuat: window.KedaiMenu tidak dibuat.
    return;
  }

  function el(id) {
    return document.getElementById(id);
  }

  var TEKS_SIMPAN = "Simpan menu";
  var PESAN_UMUM = "Menu belum bisa diproses. Coba lagi sebentar lagi.";
  var PESAN_MUAT =
    "Daftar menu belum bisa dimuat. Tekan Segarkan untuk mencoba lagi.";
  var PESAN_BACA =
    "Daftar menu belum bisa ditampilkan. Tekan Segarkan untuk mencoba lagi.";
  var PESAN_OFFLINE = "Belum bisa terhubung. Periksa internet lalu coba lagi.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";
  var PESAN_KEMBAR =
    "Nama menu ini sudah dipakai menu aktif lain. Pakai nama yang berbeda.";
  var PESAN_BUKAN_OWNER = "Hanya owner yang boleh mengelola menu.";

  // Nama berkas foto: huruf kecil, angka, strip; berakhiran .jpg atau .webp (aturan sama dengan server).
  var REGEX_FOTO = /^[a-z0-9-]+\.(jpg|webp)$/;

  var daftar = []; // semua menu dari server: { id, nama, harga, tersedia, aktif, foto }
  var termuat = false; // sudah berhasil memuat dari server
  var idUbah = null; // id menu yang sedang diubah di form; null = tambah baru
  var idKonfirmasi = null; // id menu yang sedang ditanya "yakin nonaktifkan?"
  var idSibuk = null; // id menu yang aksinya sedang diproses
  var sedangProses = false;

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

  function rupiah(n) {
    return "Rp " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Balasan galat `kedai` hanya berisi { ok: false, pesan } (tanpa field kode). Nama kembar dikenali dari
  // teks pesannya ("Sudah ada menu aktif dengan nama yang sama."); kodenya sendiri 409, sama dengan
  // "menu nonaktif", jadi status saja tidak cukup.
  function adalahKembar(h) {
    return !!(
      h &&
      h.data &&
      h.data.ok === false &&
      typeof h.data.pesan === "string" &&
      h.data.pesan.indexOf("nama yang sama") >= 0
    );
  }

  // Pesan dari fungsi kedai sendiri (ok:false + pesan) aman ditampilkan; selain itu pesan umum.
  function pesanHasil(h, cadangan) {
    if (adalahKembar(h)) return PESAN_KEMBAR;
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

  // Ambil hanya menu yang bentuknya benar. null bila daftar tidak bisa dibaca sama sekali.
  function bacaMenu(d) {
    if (!Array.isArray(d)) return null;
    var hasil = [];
    for (var i = 0; i < d.length; i++) {
      var m = d[i];
      if (
        m &&
        (typeof m.id === "string" || typeof m.id === "number") &&
        typeof m.nama === "string" &&
        isFinite(Number(m.harga))
      ) {
        hasil.push({
          id: m.id,
          nama: m.nama,
          harga: Number(m.harga),
          tersedia: m.tersedia === true,
          aktif: m.aktif === true,
          foto:
            typeof m.foto === "string" && REGEX_FOTO.test(m.foto) ? m.foto : "",
        });
      }
    }
    if (d.length > 0 && hasil.length === 0) return null;
    return hasil;
  }

  function galatDaftar(pesan) {
    var p = el("menu-daftar-galat");
    p.textContent = pesan || "";
    p.hidden = !pesan;
  }

  function tampilPesan(teks) {
    el("menu-pesan").textContent = teks || "";
    el("menu-pesan-bungkus").hidden = !teks;
  }

  function bersihkanGalatForm() {
    A.galatIsian("isian-menu-nama", "");
    A.galatIsian("isian-menu-harga", "");
    A.galatIsian("isian-menu-foto", "");
    A.galatForm("menu", "");
  }

  // ------------------------------------------------------------
  // Tampilan daftar
  // ------------------------------------------------------------

  function buatFoto(m) {
    var bungkus = buat("div", "menu-foto");
    if (m.foto) {
      var gambar = document.createElement("img");
      gambar.alt = "";
      gambar.width = 64;
      gambar.height = 64;
      gambar.loading = "lazy";
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

  function buatKartu(m) {
    var kartu = buat(
      "div",
      "kartu menu-kartu" + (m.aktif ? "" : " menu-kartu--nonaktif"),
    );

    var atas = buat("div", "menu-kartu__atas");
    atas.appendChild(buatFoto(m));
    var info = buat("div", "menu-info");
    info.appendChild(buat("p", "menu-nama", m.nama));
    info.appendChild(buat("p", "menu-harga", rupiah(m.harga)));
    var lencana = buat("div", "menu-lencana");
    if (!m.aktif) {
      lencana.appendChild(
        buat("span", "lencana lencana--nonaktif", "Nonaktif"),
      );
    } else if (m.tersedia) {
      lencana.appendChild(
        buat("span", "lencana lencana--tersedia", "Tersedia"),
      );
    } else {
      lencana.appendChild(buat("span", "lencana lencana--habis", "Habis"));
    }
    info.appendChild(lencana);
    atas.appendChild(info);
    kartu.appendChild(atas);

    var sibukIni = sedangProses && idSibuk === m.id;

    if (m.aktif) {
      // Tombol Tersedia/Habis besar: menampilkan aksi yang akan terjadi.
      var barisStok = buat("div", "baris-tombol");
      barisStok.appendChild(
        buatTombol(
          sibukIni
            ? "Memproses..."
            : m.tersedia
              ? "Tandai Habis"
              : "Tandai Tersedia",
          m.tersedia ? "tombol--sekunder" : "tombol--utama",
          function () {
            ubahStok(m);
          },
          sedangProses,
        ),
      );
      kartu.appendChild(barisStok);
    }

    var baris = buat("div", "baris-tombol");
    if (m.aktif && idKonfirmasi === m.id) {
      kartu.appendChild(
        buat(
          "p",
          "isian__bantuan",
          "Nonaktifkan menu ini? Menu tidak tampil lagi untuk customer dan tidak bisa dipesan. Order lama tidak berubah. Bisa diaktifkan kembali.",
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
            nonaktifkan(m);
          },
          sedangProses,
        ),
      );
    } else {
      baris.appendChild(
        buatTombol(
          "Ubah",
          "tombol--sekunder",
          function () {
            bukaForm(m);
          },
          sedangProses,
        ),
      );
      if (m.aktif) {
        baris.appendChild(
          buatTombol(
            "Nonaktifkan",
            "tombol--bahaya",
            function () {
              galatDaftar("");
              tampilPesan("");
              idKonfirmasi = m.id;
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
              aktifkan(m);
            },
            sedangProses,
          ),
        );
      }
    }
    kartu.appendChild(baris);
    return kartu;
  }

  function render() {
    var wadah = el("menu-daftar-isi");
    while (wadah.firstChild) {
      wadah.removeChild(wadah.firstChild);
    }

    for (var i = 0; i < daftar.length; i++) {
      wadah.appendChild(buatKartu(daftar[i]));
    }

    if (termuat && daftar.length === 0) {
      var kosong = buat("div", "keadaan");
      kosong.setAttribute("role", "status");
      kosong.appendChild(buat("p", "keadaan__judul", "Belum ada menu"));
      kosong.appendChild(
        buat(
          "p",
          "keadaan__ket",
          "Tekan Tambah menu untuk membuat menu pertama.",
        ),
      );
      wadah.appendChild(kosong);
    }

    var ringkas = el("menu-ringkas");
    if (!termuat) {
      ringkas.textContent = "Memuat menu...";
    } else {
      var aktif = 0;
      for (var j = 0; j < daftar.length; j++) {
        if (daftar[j].aktif) aktif++;
      }
      ringkas.textContent = daftar.length + " menu, " + aktif + " aktif.";
    }

    el("menu-tambah").disabled = !termuat || sedangProses;
  }

  // Ambil data terbaru dari server (aksi menu_daftar: owner mendapat semua menu).
  // `pesanTetap` (opsional): pesan yang tetap tampil di atas daftar setelah muat.
  function muat(pesanTetap) {
    return A.panggilKedai("menu_daftar")
      .then(function (h) {
        if (h.status === 200 && h.data && h.data.ok === true) {
          var baru = bacaMenu(h.data.menu);
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
        galatDaftar(
          pesanTetap || (navigator.onLine ? PESAN_MUAT : PESAN_OFFLINE),
        );
      });
  }

  // ------------------------------------------------------------
  // Balasan aksi yang mengubah menu (sukses membawa daftar terbaru di `menu`)
  // ------------------------------------------------------------

  // `laporGalat(pesan, basi)`: basi = data di layar sudah tidak cocok dengan server (menu tidak
  // ditemukan atau aturan berubah), jadi daftar perlu dimuat ulang. Nama kembar bukan basi.
  function olahBalasan(h, pesanSukses, laporGalat) {
    if (h.status === 200 && h.data && h.data.ok === true) {
      var baru = bacaMenu(h.data.menu);
      galatDaftar("");
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
      laporGalat(PESAN_SESI, false);
      return;
    }
    var kembar = adalahKembar(h);
    var basi = (h.status === 404 || h.status === 409) && !kembar;
    laporGalat(pesanHasil(h, PESAN_UMUM), basi);
  }

  function galatAksi(pesan, basi) {
    render();
    if (basi) {
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
  // Tersedia/Habis, Nonaktifkan, Aktifkan kembali
  // ------------------------------------------------------------

  function ubahStok(m) {
    if (sedangProses) return;
    mulaiAksi(m.id);
    A.panggilKedai("menu_stok", { id: m.id, tersedia: !m.tersedia })
      .then(function (h) {
        akhiriAksi();
        olahBalasan(
          h,
          m.nama + (m.tersedia ? " ditandai Habis." : " ditandai Tersedia."),
          galatAksi,
        );
      })
      .catch(function () {
        akhiriAksi();
        galatAksi(navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE, false);
      });
  }

  function nonaktifkan(m) {
    if (sedangProses) return;
    mulaiAksi(m.id);
    A.panggilKedai("menu_nonaktif", { id: m.id })
      .then(function (h) {
        akhiriAksi();
        olahBalasan(h, m.nama + " dinonaktifkan.", galatAksi);
      })
      .catch(function () {
        akhiriAksi();
        galatAksi(navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE, false);
      });
  }

  // Mengaktifkan kembali lewat menu_simpan dengan isian menu yang sekarang + aktifkan: true.
  // Bila namanya sudah dipakai menu aktif lain, server membalas nama kembar (ubah nama dulu lewat Ubah).
  function aktifkan(m) {
    if (sedangProses) return;
    mulaiAksi(m.id);
    A.panggilKedai("menu_simpan", {
      id: m.id,
      nama: m.nama,
      harga: m.harga,
      foto: m.foto,
      aktifkan: true,
    })
      .then(function (h) {
        akhiriAksi();
        olahBalasan(h, m.nama + " diaktifkan kembali.", function (pesan, basi) {
          galatAksi(
            pesan === PESAN_KEMBAR
              ? PESAN_KEMBAR + " Tekan Ubah untuk mengganti namanya dulu."
              : pesan,
            basi,
          );
        });
      })
      .catch(function () {
        akhiriAksi();
        galatAksi(navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE, false);
      });
  }

  // ------------------------------------------------------------
  // Form tambah dan ubah
  // ------------------------------------------------------------

  function bukaForm(m) {
    idUbah = m ? m.id : null;
    idKonfirmasi = null;
    galatDaftar("");
    tampilPesan("");
    bersihkanGalatForm();
    el("menu-form-judul").textContent = m ? "Ubah menu" : "Tambah menu";
    el("menu-nama").value = m ? m.nama : "";
    el("menu-harga").value = m ? String(m.harga) : "";
    el("menu-berkas-foto").value = m ? m.foto : "";
    el("menu-daftar-bungkus").hidden = true;
    el("menu-form-bungkus").hidden = false;
    window.scrollTo(0, 0);
  }

  function tutupForm() {
    idUbah = null;
    el("menu-nama").value = "";
    el("menu-harga").value = "";
    el("menu-berkas-foto").value = "";
    bersihkanGalatForm();
    el("menu-form-bungkus").hidden = true;
    el("menu-daftar-bungkus").hidden = false;
    window.scrollTo(0, 0);
  }

  function kirim(e) {
    e.preventDefault();
    if (sedangProses) return;
    bersihkanGalatForm();

    // Spasi di awal, akhir, dan ganda dirapikan (server juga merapikan). Titik dan spasi di harga dibuang
    // supaya "15.000" tetap diterima; koma atau huruf ditolak.
    var nama = el("menu-nama").value.replace(/\s+/g, " ").trim();
    var teksHarga = el("menu-harga").value.replace(/[.\s]/g, "");
    var foto = el("menu-berkas-foto").value.trim();

    var lengkap = true;
    if (nama.length < 3 || nama.length > 40) {
      A.galatIsian("isian-menu-nama", "Nama menu harus 3 sampai 40 karakter.");
      lengkap = false;
    }
    if (!/^[0-9]{1,15}$/.test(teksHarga) || Number(teksHarga) < 1) {
      A.galatIsian(
        "isian-menu-harga",
        "Isi harga dengan angka bulat lebih dari 0, misalnya 15000.",
      );
      lengkap = false;
    }
    if (foto !== "" && !REGEX_FOTO.test(foto)) {
      A.galatIsian(
        "isian-menu-foto",
        "Nama berkas: huruf kecil, angka, dan strip, berakhiran .jpg atau .webp.",
      );
      lengkap = false;
    }
    if (!lengkap) return;

    var data = { nama: nama, harga: Number(teksHarga), foto: foto };
    var tambah = idUbah === null;
    if (!tambah) data.id = idUbah;
    var pesanSukses = tambah ? "Menu ditambahkan." : "Perubahan menu disimpan.";

    var tombol = el("tombol-menu-simpan");
    sedangProses = true;
    A.sibuk(tombol, true, TEKS_SIMPAN);

    A.panggilKedai("menu_simpan", data)
      .then(function (h) {
        sedangProses = false;
        A.sibuk(tombol, false, TEKS_SIMPAN);

        if (h.status === 200 && h.data && h.data.ok === true) {
          tutupForm();
        }
        olahBalasan(h, pesanSukses, function (pesan, basi) {
          if (basi) {
            // Menu sudah tidak cocok dengan server: kembali ke daftar dan segarkan.
            tutupForm();
            render();
            muat(pesan);
            return;
          }
          A.galatForm("menu", pesan);
        });
      })
      .catch(function () {
        sedangProses = false;
        A.sibuk(tombol, false, TEKS_SIMPAN);
        A.galatForm("menu", navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE);
      });
  }

  // ------------------------------------------------------------
  // MNU.04: daftar menu untuk customer (tab Pesan), hanya dilihat
  // ------------------------------------------------------------
  // Customer hanya mendapat menu aktif dari server (disaring sekali lagi di sini). Menu Habis tampil abu-abu
  // dengan lencana Habis (MN3). Belum ada tombol pilih atau jumlah: itu menyusul di ORD, dan
  // buatKartuPelanggan adalah tempat tombolnya nanti dipasang. Aplikasi tidak pernah mengirim harga atau
  // total (MN4). Dimuat saat tab dibuka dan lewat Segarkan, tanpa polling (MN7).

  var daftarPelanggan = []; // menu aktif: { id, nama, harga, tersedia, foto }
  var termuatPelanggan = false; // sudah pernah berhasil memuat
  var sedangMuatPelanggan = false;
  var nomorMuatPelanggan = 0; // naik tiap muat dan reset; balasan lama (nomor tidak cocok) diabaikan

  // Ambil hanya menu yang bentuknya benar dan aktif. null bila daftar tidak bisa dibaca sama sekali.
  // Bila server tidak mengirim field aktif (customer memang hanya mendapat menu aktif), dianggap aktif.
  function bacaMenuPelanggan(d) {
    if (!Array.isArray(d)) return null;
    var hasil = [];
    var salahBentuk = 0;
    for (var i = 0; i < d.length; i++) {
      var m = d[i];
      if (
        m &&
        (typeof m.id === "string" || typeof m.id === "number") &&
        typeof m.nama === "string" &&
        isFinite(Number(m.harga))
      ) {
        if (m.aktif !== false) {
          hasil.push({
            id: m.id,
            nama: m.nama,
            harga: Number(m.harga),
            tersedia: m.tersedia === true,
            foto:
              typeof m.foto === "string" && REGEX_FOTO.test(m.foto)
                ? m.foto
                : "",
          });
        }
      } else {
        salahBentuk++;
      }
    }
    if (d.length > 0 && hasil.length === 0 && salahBentuk > 0) return null;
    return hasil;
  }

  // Pesan dari fungsi kedai sendiri (ok:false + pesan) aman ditampilkan; selain itu pesan umum.
  function pesanMuatPelanggan(h) {
    if (
      h &&
      h.data &&
      h.data.ok === false &&
      typeof h.data.pesan === "string"
    ) {
      return h.data.pesan;
    }
    return PESAN_MUAT;
  }

  function galatPelanggan(pesan) {
    var p = el("pelanggan-menu-galat");
    if (!p) return;
    p.textContent = pesan || "";
    p.hidden = !pesan;
  }

  function buatKartuPelanggan(m) {
    var kartu = buat(
      "div",
      "kartu menu-kartu" + (m.tersedia ? "" : " menu-kartu--habis"),
    );
    var atas = buat("div", "menu-kartu__atas");
    atas.appendChild(buatFoto(m));
    var info = buat("div", "menu-info");
    info.appendChild(buat("p", "menu-nama", m.nama));
    info.appendChild(buat("p", "menu-harga", rupiah(m.harga)));
    var lencana = buat("div", "menu-lencana");
    if (m.tersedia) {
      lencana.appendChild(
        buat("span", "lencana lencana--tersedia", "Tersedia"),
      );
    } else {
      lencana.appendChild(buat("span", "lencana lencana--habis", "Habis"));
    }
    info.appendChild(lencana);
    atas.appendChild(info);
    kartu.appendChild(atas);
    // ORD: tombol pilih menu dan jumlah dipasang di sini (hanya untuk menu Tersedia).

    // MNU.08: ketuk kartu (atau Enter/Spasi) membuka sheet detail. Hanya dipasang bila komponennya ada.
    // Ketukan pada tombol di dalam kartu (nanti dari ORD) tidak ikut membuka sheet.
    var Detail = window.KedaiMenuDetail;
    if (Detail && typeof Detail.buka === "function") {
      kartu.className += " menu-kartu--bisa-diketuk";
      kartu.setAttribute("role", "button");
      kartu.tabIndex = 0;
      kartu.addEventListener("click", function (e) {
        var dalam =
          e.target && e.target.closest
            ? e.target.closest("button, a, input")
            : null;
        if (dalam && kartu.contains(dalam)) return;
        Detail.buka(m, kartu);
      });
      kartu.addEventListener("keydown", function (e) {
        if (e.target !== kartu) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          Detail.buka(m, kartu);
        }
      });
    }
    return kartu;
  }

  function renderPelanggan() {
    var wadah = el("pelanggan-menu-isi");
    var ringkas = el("pelanggan-menu-ringkas");
    if (!wadah || !ringkas) return;
    while (wadah.firstChild) {
      wadah.removeChild(wadah.firstChild);
    }

    var adaHabis = false;
    for (var i = 0; i < daftarPelanggan.length; i++) {
      if (!daftarPelanggan[i].tersedia) adaHabis = true;
      wadah.appendChild(buatKartuPelanggan(daftarPelanggan[i]));
    }

    if (termuatPelanggan && daftarPelanggan.length === 0) {
      var kosong = buat("div", "keadaan");
      kosong.setAttribute("role", "status");
      kosong.appendChild(buat("p", "keadaan__judul", "Belum ada menu"));
      kosong.appendChild(
        buat(
          "p",
          "keadaan__ket",
          "Menu belum tersedia. Silakan cek lagi nanti.",
        ),
      );
      wadah.appendChild(kosong);
    }

    if (sedangMuatPelanggan) {
      ringkas.textContent = "Memuat menu...";
    } else if (adaHabis) {
      ringkas.textContent = "Menu yang abu-abu sedang habis.";
    } else {
      ringkas.textContent = "";
    }
  }

  // Ambil menu aktif dari server (aksi menu_daftar). Gagal muat: daftar lama (bila ada) tetap tampil
  // bersama pesan galat, supaya customer dengan sinyal jelek tidak kehilangan daftarnya.
  function muatPelanggan() {
    var nomor = ++nomorMuatPelanggan;
    sedangMuatPelanggan = true;
    galatPelanggan("");
    renderPelanggan();
    return A.panggilKedai("menu_daftar")
      .then(function (h) {
        if (nomor !== nomorMuatPelanggan) return;
        sedangMuatPelanggan = false;
        if (h.status === 200 && h.data && h.data.ok === true) {
          var baru = bacaMenuPelanggan(h.data.menu);
          if (baru) {
            daftarPelanggan = baru;
            termuatPelanggan = true;
            galatPelanggan("");
          } else {
            galatPelanggan(PESAN_BACA);
          }
        } else if (h.status === 401 && !h.data) {
          galatPelanggan(PESAN_SESI);
        } else {
          galatPelanggan(pesanMuatPelanggan(h));
        }
        renderPelanggan();
      })
      .catch(function () {
        if (nomor !== nomorMuatPelanggan) return;
        sedangMuatPelanggan = false;
        galatPelanggan(navigator.onLine ? PESAN_MUAT : PESAN_OFFLINE);
        renderPelanggan();
      });
  }

  // Dipanggil kerangka.js saat tab Pesan (customer) dibuka dan lewat Segarkan.
  function tampilPelanggan() {
    muatPelanggan();
  }

  // Dipanggil dari reset() saat Keluar: tidak boleh ada data menu tersisa, dan balasan yang masih
  // di jalan diabaikan.
  function resetPelanggan() {
    // MNU.08: sheet detail yang masih terbuka ditutup seketika saat Keluar.
    if (
      window.KedaiMenuDetail &&
      typeof window.KedaiMenuDetail.tutup === "function"
    ) {
      window.KedaiMenuDetail.tutup(true);
    }
    nomorMuatPelanggan++;
    daftarPelanggan = [];
    termuatPelanggan = false;
    sedangMuatPelanggan = false;
    galatPelanggan("");
    renderPelanggan();
  }

  // ------------------------------------------------------------
  // Buka dan tutup layar
  // ------------------------------------------------------------

  // Dipanggil kerangka.js saat tab Menu dibuka (dan saat Segarkan).
  function tampil() {
    daftar = [];
    termuat = false;
    idKonfirmasi = null;
    idSibuk = null;
    sedangProses = false;
    tutupForm();
    galatDaftar("");
    tampilPesan("");
    render();
    muat();
  }

  // Dipanggil kerangka.js saat Keluar: tidak boleh ada data tersisa di layar.
  function reset() {
    daftar = [];
    termuat = false;
    idKonfirmasi = null;
    idSibuk = null;
    sedangProses = false;
    tutupForm();
    galatDaftar("");
    tampilPesan("");
    render();
    el("menu-ringkas").textContent = "";
    resetPelanggan(); // MNU.04
  }

  el("menu-tambah").addEventListener("click", function () {
    bukaForm(null);
  });
  el("menu-batal").addEventListener("click", tutupForm);
  el("form-menu").addEventListener("submit", kirim);

  // Isian harga hanya menerima angka: huruf dan tanda lain langsung dibuang saat diketik. Titik dan spasi
  // tetap boleh ("15.000"); dibuang saat kirim. Cek lengkap tetap di kirim() dan di server.
  el("menu-harga").addEventListener("input", function (e) {
    var kolom = e.target;
    var bersih = kolom.value.replace(/[^0-9.\s]/g, "");
    if (bersih !== kolom.value) {
      kolom.value = bersih;
    }
  });

  window.KedaiMenu = Object.freeze({
    tampil: tampil,
    tampilPelanggan: tampilPelanggan, // MNU.04
    reset: reset,
  });
})();
