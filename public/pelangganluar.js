// public/pelangganluar.js
// ORD.13: layar Kelola Pelanggan (owner) dan form pelanggan yang dipakai ulang oleh wizard Buat Order
// (orderwakil.js). order.md O15, O16 dan Handoff #22 (kontrak aksi pelanggan_luar_*).
//
// Tampil di panel "pelanggan" (dibuka dari item Pelanggan di Home, kerangka.js). Isi panel dibuat dari JS.
// Dimuat SETELAH akun.js dan SEBELUM orderwakil.js dan kerangka.js di index.html.
//
// Aturan yang dijaga:
// - Semua aksi hanya untuk owner; yang menolak akses sebenarnya server. Layar ini hanya kemudahan.
// - Pelanggan tidak pernah dihapus, hanya Nonaktifkan dan Aktifkan lagi (O16).
// - pelanggan_luar_simpan wajib menerima keterangan, nomor_wa, alamat_antar (teks atau null); kosong = null.
// - Pencarian dilakukan di layar, bukan di server. Tanpa polling: data dimuat saat tab dibuka dan lewat Segarkan.
// - Semua teks dari server dan isian dipasang lewat textContent, bukan innerHTML. Galat mentah tidak ditampilkan.
// - Layar yang digambar ulang menjaga posisi gulung (pelajaran AGENTS.md bagian 12, 9 Nov 2026).
// - Data pelanggan (nama, WA, alamat) dikosongkan dari layar saat Keluar (reset).

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A) {
    // akun.js belum termuat: window.KedaiPelangganLuar tidak dibuat.
    return;
  }

  function el(id) {
    return document.getElementById(id);
  }

  var PESAN_MUAT =
    "Daftar pelanggan belum bisa dimuat. Coba lagi sebentar lagi.";
  var PESAN_SIMPAN = "Pelanggan belum bisa disimpan. Coba lagi sebentar lagi.";
  var PESAN_AKSI = "Pelanggan belum bisa diproses. Coba lagi sebentar lagi.";
  var PESAN_OFFLINE = "Belum bisa terhubung. Periksa internet lalu coba lagi.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";
  // Cek ringan saja (server yang memutuskan): angka, boleh diawali +, 8 sampai 16 digit.
  var REGEX_WA = /^\+?[0-9]{8,16}$/;

  // ------------------------------------------------------------
  // Pembantu
  // ------------------------------------------------------------

  function buat(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks !== undefined) e.textContent = teks;
    return e;
  }

  function buatTombol(teks, kelas, aksi, mati, labelAria) {
    var t = buat("button", "tombol " + kelas, teks);
    t.type = "button";
    t.disabled = !!mati;
    if (labelAria) t.setAttribute("aria-label", labelAria);
    t.addEventListener("click", aksi);
    return t;
  }

  function kosongkan(e) {
    while (e.firstChild) {
      e.removeChild(e.firstChild);
    }
  }

  function teksAtauKosong(v) {
    return typeof v === "string" ? v : "";
  }

  function rapikan(s) {
    return String(s || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Pesan dari fungsi kedai sendiri (ok:false + pesan) aman ditampilkan.
  function pesanServer(h) {
    return h &&
      h.data &&
      h.data.ok === false &&
      typeof h.data.pesan === "string"
      ? h.data.pesan
      : "";
  }

  // Redraw wadah tanpa membuat layar loncat ke atas.
  function jagaGulung(fn) {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    fn();
    try {
      window.scrollTo({ top: y, left: 0, behavior: "instant" });
    } catch (err) {
      window.scrollTo(0, y);
    }
  }

  function bacaPelanggan(p) {
    if (!p || typeof p.id !== "string" || typeof p.nama !== "string") {
      return null;
    }
    return {
      id: p.id,
      nama: p.nama,
      keterangan: teksAtauKosong(p.keterangan),
      nomor_wa: teksAtauKosong(p.nomor_wa),
      alamat_antar: teksAtauKosong(p.alamat_antar),
      aktif: p.aktif !== false,
    };
  }

  function bacaDaftar(d) {
    if (!Array.isArray(d)) return null;
    var hasil = [];
    for (var i = 0; i < d.length; i++) {
      var p = bacaPelanggan(d[i]);
      if (p) hasil.push(p);
    }
    return hasil;
  }

  // ------------------------------------------------------------
  // Panggilan server (dipakai layar ini dan wizard)
  // ------------------------------------------------------------

  // semua === true: ikut yang nonaktif. Hasil: { ok: true, daftar } atau { ok: false, pesan }.
  function ambilDaftar(semua) {
    return A.panggilKedai("pelanggan_luar_daftar", { semua: !!semua }).then(
      function (h) {
        if (h.status === 200 && h.data && h.data.ok === true) {
          var d = bacaDaftar(h.data.daftar);
          if (d) return { ok: true, daftar: d };
        }
        if (h.status === 401 && !h.data) {
          return { ok: false, pesan: PESAN_SESI };
        }
        return { ok: false, pesan: pesanServer(h) || PESAN_MUAT };
      },
      function () {
        return {
          ok: false,
          pesan: navigator.onLine ? PESAN_MUAT : PESAN_OFFLINE,
        };
      },
    );
  }

  // Hasil: { ok: true, pelanggan (bisa null bila balasan tak terbaca) } atau { ok: false, pesan, status }.
  function simpan(data) {
    return A.panggilKedai("pelanggan_luar_simpan", data).then(
      function (h) {
        if (h.status === 200 && h.data && h.data.ok === true) {
          return { ok: true, pelanggan: bacaPelanggan(h.data.pelanggan) };
        }
        if (h.status === 401 && !h.data) {
          return { ok: false, pesan: PESAN_SESI, status: 401 };
        }
        return {
          ok: false,
          pesan: pesanServer(h) || PESAN_SIMPAN,
          status: h.status,
        };
      },
      function () {
        return {
          ok: false,
          pesan: navigator.onLine ? PESAN_SIMPAN : PESAN_OFFLINE,
          status: 0,
        };
      },
    );
  }

  // ------------------------------------------------------------
  // Form pelanggan (tambah dan ubah). Dipakai Kelola Pelanggan dan langkah 1 wizard.
  // cfg: { pelanggan (opsional, untuk ubah), judul, teksSimpan, aktifkan (opsional), onSukses(p), onBatal (opsional) }
  // Mengembalikan elemen kartu; kartu.fokus() memusatkan kursor ke kolom nama.
  // ------------------------------------------------------------

  var urutForm = 0;

  function buatIsian(id, label, bantuan, area, maks, jenis) {
    var bungkus = buat("div", "isian");
    var l = buat("label", "isian__label", label);
    l.htmlFor = id;
    bungkus.appendChild(l);
    var kolom = document.createElement(area ? "textarea" : "input");
    kolom.className = "isian__kolom";
    kolom.id = id;
    kolom.maxLength = maks;
    kolom.autocomplete = "off";
    if (!area) kolom.type = jenis || "text";
    if (jenis === "tel") kolom.setAttribute("inputmode", "tel");
    bungkus.appendChild(kolom);
    if (bantuan) bungkus.appendChild(buat("p", "isian__bantuan", bantuan));
    var galat = buat("p", "isian__galat");
    galat.hidden = true;
    bungkus.appendChild(galat);
    return { bungkus: bungkus, kolom: kolom, galat: galat };
  }

  function setGalatIsian(f, pesan) {
    f.galat.textContent = pesan || "";
    f.galat.hidden = !pesan;
    if (pesan) {
      f.bungkus.classList.add("isian--galat");
    } else {
      f.bungkus.classList.remove("isian--galat");
    }
  }

  function buatForm(cfg) {
    var p = cfg.pelanggan || null;
    var pre = "plf-" + ++urutForm;
    var kartu = buat("div", "kartu");
    kartu.appendChild(buat("h2", "kartu__judul", cfg.judul));

    var fNama = buatIsian(
      pre + "-nama",
      "Nama",
      "3 sampai 30 karakter.",
      false,
      30,
    );
    var fKet = buatIsian(
      pre + "-ket",
      "Keterangan (boleh dikosongkan)",
      "Contoh: ibu Budi, kelas 3B. Membantu membedakan pelanggan yang namanya sama.",
      false,
      100,
    );
    var fWa = buatIsian(
      pre + "-wa",
      "Nomor WA (boleh dikosongkan)",
      "Dipakai untuk tombol Chat WA di detail order.",
      false,
      20,
      "tel",
    );
    var fAlamat = buatIsian(
      pre + "-alamat",
      "Alamat antar (boleh dikosongkan)",
      "Untuk antar ke sekolah, tulis nama sekolah, kelas, dan nama anak.",
      true,
      200,
    );
    if (p) {
      fNama.kolom.value = p.nama;
      fKet.kolom.value = p.keterangan;
      fWa.kolom.value = p.nomor_wa;
      fAlamat.kolom.value = p.alamat_antar;
    }
    kartu.appendChild(fNama.bungkus);
    kartu.appendChild(fKet.bungkus);
    kartu.appendChild(fWa.bungkus);
    kartu.appendChild(fAlamat.bungkus);

    var galatForm = buat("p", "isian__galat");
    galatForm.setAttribute("role", "alert");
    galatForm.hidden = true;
    kartu.appendChild(galatForm);

    var sedang = false;
    var tombolSimpan = buatTombol(cfg.teksSimpan, "tombol--utama", kirim);
    var tombolBatal = null;

    function kunci(aktif) {
      sedang = aktif;
      tombolSimpan.disabled = aktif;
      tombolSimpan.textContent = aktif ? "Memproses..." : cfg.teksSimpan;
      if (tombolBatal) tombolBatal.disabled = aktif;
    }

    function kirim() {
      if (sedang) return;
      setGalatIsian(fNama, "");
      setGalatIsian(fKet, "");
      setGalatIsian(fWa, "");
      setGalatIsian(fAlamat, "");
      galatForm.hidden = true;

      var nama = rapikan(fNama.kolom.value);
      var ket = rapikan(fKet.kolom.value);
      var wa = fWa.kolom.value.replace(/[\s-]/g, "");
      var alamat = fAlamat.kolom.value.trim();

      var lengkap = true;
      if (nama.length < 3 || nama.length > 30) {
        setGalatIsian(fNama, "Nama harus 3 sampai 30 karakter.");
        lengkap = false;
      }
      if (ket !== "" && (ket.length < 3 || ket.length > 100)) {
        setGalatIsian(
          fKet,
          "Keterangan 3 sampai 100 karakter, atau kosongkan.",
        );
        lengkap = false;
      }
      if (wa !== "" && !REGEX_WA.test(wa)) {
        setGalatIsian(fWa, "Nomor WA tidak valid. Isi angka saja.");
        lengkap = false;
      }
      if (alamat !== "" && (alamat.length < 10 || alamat.length > 200)) {
        setGalatIsian(
          fAlamat,
          "Alamat 10 sampai 200 karakter, atau kosongkan.",
        );
        lengkap = false;
      }
      if (!lengkap) return;

      var data = {
        nama: nama,
        keterangan: ket === "" ? null : ket,
        nomor_wa: wa === "" ? null : wa,
        alamat_antar: alamat === "" ? null : alamat,
      };
      if (p) data.id = p.id;
      if (cfg.aktifkan) data.aktifkan = true;

      kunci(true);
      simpan(data).then(function (r) {
        kunci(false);
        if (r.ok) {
          cfg.onSukses(r.pelanggan);
          return;
        }
        galatForm.textContent = r.pesan;
        galatForm.hidden = false;
      });
    }

    var baris = buat("div", "baris-tombol");
    if (cfg.onBatal) {
      tombolBatal = buatTombol("Batal", "tombol--sekunder", function () {
        if (!sedang) cfg.onBatal();
      });
      baris.appendChild(tombolBatal);
    }
    baris.appendChild(tombolSimpan);
    kartu.appendChild(baris);

    kartu.fokus = function () {
      fNama.kolom.focus();
    };
    return kartu;
  }

  // ------------------------------------------------------------
  // Layar Kelola Pelanggan (panel "pelanggan")
  // ------------------------------------------------------------

  var panel = el("panel-pelanggan");

  var daftar = [];
  var termuat = false;
  var sedangMuat = false;
  var tampilNonaktif = false;
  var cari = "";
  var mode = "daftar"; // "daftar" | "form"
  var idKonfirmasi = null;
  var idSibuk = null;
  var sedangProses = false;
  var nomorMuat = 0;

  var wadahDaftar = null;
  var wadahForm = null;
  var kolomCari = null;
  var tombolToggle = null;
  var tombolTambah = null;
  var kartuPesan = null;
  var teksPesan = null;
  var teksGalat = null;
  var teksRingkas = null;
  var wadahIsi = null;

  function keHome() {
    var t = document.querySelector('#nav-owner [data-tab="home"]');
    if (t) t.click();
  }

  function tampilPesan(teks) {
    if (!kartuPesan) return;
    teksPesan.textContent = teks || "";
    kartuPesan.hidden = !teks;
  }

  function tampilGalat(teks) {
    if (!teksGalat) return;
    teksGalat.textContent = teks || "";
    teksGalat.hidden = !teks;
  }

  function saring() {
    var kata = cari.trim().toLowerCase();
    if (kata === "") return daftar;
    var hasil = [];
    for (var i = 0; i < daftar.length; i++) {
      var gabung = (daftar[i].nama + " " + daftar[i].keterangan).toLowerCase();
      if (gabung.indexOf(kata) >= 0) hasil.push(daftar[i]);
    }
    return hasil;
  }

  function buatKartu(p) {
    var kartu = buat("div", "kartu");
    var atas = buat("div", "kartu-order__atas");
    atas.appendChild(buat("span", "menu-nama", p.nama));
    if (!p.aktif) {
      atas.appendChild(buat("span", "lencana lencana--nonaktif", "Nonaktif"));
    }
    kartu.appendChild(atas);
    if (p.keterangan) {
      kartu.appendChild(buat("p", "kartu-order__baris", p.keterangan));
    }
    kartu.appendChild(
      buat(
        "p",
        "isian__bantuan",
        p.nomor_wa ? "WA: " + p.nomor_wa : "Nomor WA belum diisi",
      ),
    );
    kartu.appendChild(
      buat(
        "p",
        "isian__bantuan",
        p.alamat_antar ? p.alamat_antar : "Alamat antar belum diisi",
      ),
    );

    var sibukIni = sedangProses && idSibuk === p.id;
    var baris = buat("div", "baris-tombol");
    if (p.aktif && idKonfirmasi === p.id) {
      kartu.appendChild(
        buat(
          "p",
          "isian__bantuan",
          "Nonaktifkan pelanggan ini? Namanya tidak muncul lagi saat Buat Order. Order lama tidak berubah. Bisa diaktifkan lagi.",
        ),
      );
      baris.appendChild(
        buatTombol(
          "Batal",
          "tombol--sekunder",
          function () {
            idKonfirmasi = null;
            isiDaftar();
          },
          sedangProses,
        ),
      );
      baris.appendChild(
        buatTombol(
          sibukIni ? "Memproses..." : "Ya, nonaktifkan",
          "tombol--bahaya",
          function () {
            nonaktifkan(p);
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
            bukaForm(p);
          },
          sedangProses,
          "Ubah " + p.nama,
        ),
      );
      if (p.aktif) {
        baris.appendChild(
          buatTombol(
            "Nonaktifkan",
            "tombol--bahaya",
            function () {
              tampilGalat("");
              tampilPesan("");
              idKonfirmasi = p.id;
              isiDaftar();
            },
            sedangProses,
            "Nonaktifkan " + p.nama,
          ),
        );
      } else {
        baris.appendChild(
          buatTombol(
            sibukIni ? "Memproses..." : "Aktifkan lagi",
            "tombol--utama",
            function () {
              aktifkan(p);
            },
            sedangProses,
            "Aktifkan lagi " + p.nama,
          ),
        );
      }
    }
    kartu.appendChild(baris);
    return kartu;
  }

  function isiDaftar() {
    if (!wadahIsi) return;
    jagaGulung(function () {
      kosongkan(wadahIsi);
      var hasil = saring();
      if (!termuat) {
        teksRingkas.textContent = sedangMuat ? "Memuat pelanggan..." : "";
      } else {
        teksRingkas.textContent =
          hasil.length + " pelanggan" + (cari.trim() !== "" ? " cocok." : ".");
      }
      if (termuat && hasil.length === 0) {
        var kosong = buat("div", "keadaan");
        kosong.setAttribute("role", "status");
        if (cari.trim() !== "") {
          kosong.appendChild(
            buat("p", "keadaan__judul", "Tidak ada yang cocok"),
          );
          kosong.appendChild(
            buat("p", "keadaan__ket", "Coba nama lain, atau hapus pencarian."),
          );
        } else {
          kosong.appendChild(
            buat("p", "keadaan__judul", "Belum ada pelanggan"),
          );
          kosong.appendChild(
            buat(
              "p",
              "keadaan__ket",
              "Tekan Tambah pelanggan untuk mencatat yang pertama.",
            ),
          );
        }
        wadahIsi.appendChild(kosong);
      }
      for (var i = 0; i < hasil.length; i++) {
        wadahIsi.appendChild(buatKartu(hasil[i]));
      }
      tombolTambah.disabled = sedangProses;
    });
  }

  function muat() {
    var nomor = ++nomorMuat;
    sedangMuat = true;
    tampilGalat("");
    isiDaftar();
    return ambilDaftar(tampilNonaktif).then(function (r) {
      if (nomor !== nomorMuat) return;
      sedangMuat = false;
      if (r.ok) {
        daftar = r.daftar;
        termuat = true;
      } else {
        tampilGalat(r.pesan);
      }
      isiDaftar();
    });
  }

  function mulaiProses(id) {
    sedangProses = true;
    idSibuk = id;
    idKonfirmasi = null;
    tampilGalat("");
    tampilPesan("");
    isiDaftar();
  }

  function akhiriProses() {
    sedangProses = false;
    idSibuk = null;
  }

  function nonaktifkan(p) {
    if (sedangProses) return;
    mulaiProses(p.id);
    A.panggilKedai("pelanggan_luar_nonaktif", { id: p.id }).then(
      function (h) {
        akhiriProses();
        if (h.status === 200 && h.data && h.data.ok === true) {
          tampilPesan(p.nama + " dinonaktifkan.");
          muat();
          return;
        }
        tampilGalat(
          h.status === 401 && !h.data
            ? PESAN_SESI
            : pesanServer(h) || PESAN_AKSI,
        );
        if (h.status === 404) {
          muat();
        } else {
          isiDaftar();
        }
      },
      function () {
        akhiriProses();
        tampilGalat(navigator.onLine ? PESAN_AKSI : PESAN_OFFLINE);
        isiDaftar();
      },
    );
  }

  // Mengaktifkan lagi lewat pelanggan_luar_simpan dengan isian yang sekarang + aktifkan: true.
  function aktifkan(p) {
    if (sedangProses) return;
    mulaiProses(p.id);
    simpan({
      id: p.id,
      nama: p.nama,
      keterangan: p.keterangan === "" ? null : p.keterangan,
      nomor_wa: p.nomor_wa === "" ? null : p.nomor_wa,
      alamat_antar: p.alamat_antar === "" ? null : p.alamat_antar,
      aktifkan: true,
    }).then(function (r) {
      akhiriProses();
      if (r.ok) {
        tampilPesan(p.nama + " diaktifkan lagi.");
        muat();
        return;
      }
      tampilGalat(r.pesan);
      if (r.status === 404) {
        muat();
      } else {
        isiDaftar();
      }
    });
  }

  function bukaForm(p) {
    mode = "form";
    idKonfirmasi = null;
    tampilGalat("");
    tampilPesan("");
    kosongkan(wadahForm);
    var form = buatForm({
      pelanggan: p || null,
      judul: p ? "Ubah pelanggan" : "Tambah pelanggan",
      teksSimpan: "Simpan",
      onSukses: function () {
        tutupForm();
        tampilPesan(p ? "Perubahan disimpan." : "Pelanggan ditambahkan.");
        muat();
      },
      onBatal: tutupForm,
    });
    wadahForm.appendChild(form);
    wadahDaftar.hidden = true;
    wadahForm.hidden = false;
    window.scrollTo(0, 0);
    form.fokus();
  }

  function tutupForm() {
    mode = "daftar";
    kosongkan(wadahForm);
    wadahForm.hidden = true;
    wadahDaftar.hidden = false;
    window.scrollTo(0, 0);
  }

  function bangun() {
    wadahDaftar = buat("div");
    wadahForm = buat("div");
    wadahForm.hidden = true;
    panel.appendChild(wadahDaftar);
    panel.appendChild(wadahForm);

    var barisKembali = buat("div", "baris-tombol");
    barisKembali.appendChild(
      buatTombol("Kembali ke Home", "tombol--sekunder", keHome),
    );
    wadahDaftar.appendChild(barisKembali);

    wadahDaftar.appendChild(
      buat(
        "p",
        "isian__bantuan",
        "Pelanggan tanpa akun adalah pelanggan yang dicatat owner (belum punya akun sendiri). Namanya dipilih saat Buat Order.",
      ),
    );

    var barisTambah = buat("div", "baris-tombol");
    tombolTambah = buatTombol("Tambah pelanggan", "tombol--utama", function () {
      bukaForm(null);
    });
    barisTambah.appendChild(tombolTambah);
    wadahDaftar.appendChild(barisTambah);

    var isianCari = buat("div", "isian");
    var labelCari = buat("label", "isian__label", "Cari pelanggan");
    labelCari.htmlFor = "pelanggan-cari";
    isianCari.appendChild(labelCari);
    kolomCari = buat("input", "isian__kolom");
    kolomCari.id = "pelanggan-cari";
    kolomCari.type = "search";
    kolomCari.autocomplete = "off";
    kolomCari.addEventListener("input", function () {
      cari = kolomCari.value;
      isiDaftar();
    });
    isianCari.appendChild(kolomCari);
    wadahDaftar.appendChild(isianCari);

    var barisToggle = buat("div", "baris-tombol");
    tombolToggle = buatTombol(
      "Tampilkan yang nonaktif",
      "tombol--sekunder",
      function () {
        tampilNonaktif = !tampilNonaktif;
        tombolToggle.textContent = tampilNonaktif
          ? "Sembunyikan yang nonaktif"
          : "Tampilkan yang nonaktif";
        idKonfirmasi = null;
        muat();
      },
    );
    barisToggle.appendChild(tombolToggle);
    wadahDaftar.appendChild(barisToggle);

    kartuPesan = buat("div", "kartu");
    kartuPesan.hidden = true;
    teksPesan = buat("p", "kartu__isi");
    teksPesan.setAttribute("role", "status");
    kartuPesan.appendChild(teksPesan);
    wadahDaftar.appendChild(kartuPesan);

    teksGalat = buat("p", "isian__galat");
    teksGalat.setAttribute("role", "alert");
    teksGalat.hidden = true;
    wadahDaftar.appendChild(teksGalat);

    teksRingkas = buat("p", "isian__bantuan");
    wadahDaftar.appendChild(teksRingkas);
    wadahIsi = buat("div");
    wadahDaftar.appendChild(wadahIsi);
  }

  // Dipanggil kerangka.js saat tab dibuka dan lewat Segarkan. Form yang sedang terbuka tidak diganggu.
  function tampil() {
    if (!panel) return;
    if (mode === "form") return;
    muat();
  }

  // Keluar: tidak boleh ada nama, WA, atau alamat pelanggan tersisa di layar.
  function reset() {
    nomorMuat++;
    daftar = [];
    termuat = false;
    sedangMuat = false;
    tampilNonaktif = false;
    cari = "";
    mode = "daftar";
    idKonfirmasi = null;
    idSibuk = null;
    sedangProses = false;
    if (!panel || !wadahDaftar) return;
    tutupForm();
    kolomCari.value = "";
    tombolToggle.textContent = "Tampilkan yang nonaktif";
    tampilPesan("");
    tampilGalat("");
    teksRingkas.textContent = "";
    kosongkan(wadahIsi);
  }

  if (panel) bangun();

  window.KedaiPelangganLuar = Object.freeze({
    tampil: tampil, // dipanggil kerangka.js
    reset: reset, // dipanggil kerangka.js saat Keluar
    buatForm: buatForm, // dipakai wizard (orderwakil.js)
    ambilDaftar: ambilDaftar, // dipakai wizard (orderwakil.js)
  });
})();
