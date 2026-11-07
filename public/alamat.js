// public/alamat.js
// AKN.07: layar Buku alamat (akun.md AK9, AK14). Hanya customer.
// Dimuat SETELAH akun.js karena memakai window.KedaiAkun (pembantu layar dan panggilan ke `kedai`).
// Layar dibuka dari tombol "Buku alamat" di layar sementara (id tombol-buku-alamat); nanti
// tombolnya dipindah ke menu Akun saat layar utama dibuat.
//
// Aturan yang dijaga:
// - Yang dikirim hanya aksi dan isian (id alamat bila ubah, alias, isi). ID pemilik dari token di server.
// - Cek di aplikasi hanya kemudahan (panjang isian, tombol dimatikan); aturan sebenarnya dicek
//   fungsi SQL alamat_simpan dan alamat_nonaktif di server (kepemilikan, batas alamat_maks, minimal 1).
// - Batas alamat dibaca dari balasan server (pengaturan.alamat_maks), tidak ditulis mati di sini.
// - Semua teks (alias, isi alamat, pesan) dipasang lewat textContent, bukan innerHTML.
// - Galat mentah tidak ditampilkan. Tidak ada console.log berisi data pengguna.
// - Alamat adalah data pribadi: layar dikosongkan saat Keluar (reset).

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A) {
    // akun.js belum termuat: window.KedaiAlamat tidak dibuat.
    return;
  }

  function el(id) {
    return document.getElementById(id);
  }

  var TEKS_SIMPAN = "Simpan";
  var PESAN_UMUM = "Alamat belum bisa diproses. Coba lagi sebentar lagi.";
  var PESAN_MUAT = "Daftar alamat belum bisa dimuat. Coba lagi sebentar lagi.";
  var PESAN_OFFLINE = "Belum bisa terhubung. Periksa internet lalu coba lagi.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";
  var PESAN_BATAS =
    "Jumlah alamat sudah mencapai batas. Nonaktifkan salah satu dulu untuk menambah.";

  var daftar = []; // alamat aktif: { id, alias, isi }
  var maks = null; // batas dari server; null = belum diketahui
  var termuat = false; // sudah berhasil memuat dari server
  var idUbah = null; // id alamat yang sedang diubah; null = tambah baru
  var idKonfirmasi = null; // id alamat yang sedang ditanya "yakin nonaktifkan?"
  var sedangProses = false;

  // ------------------------------------------------------------
  // Pembantu
  // ------------------------------------------------------------

  // Pesan dari fungsi kedai sendiri (ok:false + pesan) aman ditampilkan; selain itu pesan umum.
  function pesanGalat(h, cadangan) {
    return h &&
      h.data &&
      h.data.ok === false &&
      typeof h.data.pesan === "string"
      ? h.data.pesan
      : cadangan;
  }

  // Ambil hanya alamat yang bentuknya benar; null bila bukan daftar.
  function bacaAlamat(d) {
    if (!Array.isArray(d)) return null;
    var hasil = [];
    for (var i = 0; i < d.length; i++) {
      var a = d[i];
      if (
        a &&
        typeof a.id === "string" &&
        typeof a.alias === "string" &&
        typeof a.isi === "string"
      ) {
        hasil.push({ id: a.id, alias: a.alias, isi: a.isi });
      }
    }
    return hasil;
  }

  function galatDaftar(pesan) {
    var p = el("alamat-daftar-galat");
    p.textContent = pesan || "";
    p.hidden = !pesan;
  }

  function bersihkanGalatForm() {
    A.galatIsian("isian-alamat-alias", "");
    A.galatIsian("isian-alamat-isi", "");
    A.galatForm("alamat", "");
  }

  function buatTombol(teks, kelas, aksi, mati) {
    var t = document.createElement("button");
    t.type = "button";
    t.className = "tombol " + kelas;
    t.textContent = teks;
    t.disabled = !!mati;
    t.addEventListener("click", aksi);
    return t;
  }

  // ------------------------------------------------------------
  // Tampilan daftar
  // ------------------------------------------------------------

  function buatKartu(item, hanyaSatu) {
    var kartu = document.createElement("div");
    kartu.className = "kartu";

    var judul = document.createElement("h2");
    judul.className = "kartu__judul";
    judul.textContent = item.alias;
    kartu.appendChild(judul);

    var isi = document.createElement("p");
    isi.className = "kartu__isi";
    isi.textContent = item.isi;
    kartu.appendChild(isi);

    var baris = document.createElement("div");
    baris.className = "baris-tombol";

    if (idKonfirmasi === item.id) {
      var tanya = document.createElement("p");
      tanya.className = "isian__bantuan";
      tanya.textContent =
        "Nonaktifkan alamat ini? Alamat tidak muncul lagi di pilihan. Order lama tetap menyimpan alamatnya.";
      kartu.appendChild(tanya);
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
          sedangProses ? "Memproses..." : "Ya, nonaktifkan",
          "tombol--bahaya",
          function () {
            nonaktifkan(item.id);
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
            bukaForm(item);
          },
          sedangProses,
        ),
      );
      baris.appendChild(
        buatTombol(
          "Nonaktifkan",
          "tombol--bahaya",
          function () {
            galatDaftar("");
            idKonfirmasi = item.id;
            render();
          },
          sedangProses || hanyaSatu,
        ),
      );
    }
    kartu.appendChild(baris);

    if (hanyaSatu && idKonfirmasi !== item.id) {
      var ket = document.createElement("p");
      ket.className = "isian__bantuan";
      ket.textContent = "Minimal harus ada satu alamat aktif.";
      kartu.appendChild(ket);
    }
    return kartu;
  }

  function render() {
    var wadah = el("alamat-daftar-isi");
    while (wadah.firstChild) {
      wadah.removeChild(wadah.firstChild);
    }

    var hanyaSatu = daftar.length <= 1;
    for (var i = 0; i < daftar.length; i++) {
      wadah.appendChild(buatKartu(daftar[i], hanyaSatu));
    }

    var ringkas = el("alamat-ringkas");
    if (!termuat) {
      ringkas.textContent = "Memuat alamat...";
    } else {
      ringkas.textContent =
        daftar.length +
        (maks !== null ? " dari " + maks : "") +
        " alamat aktif.";
    }

    var penuh = maks !== null && daftar.length >= maks;
    el("alamat-tambah").disabled = !termuat || penuh || sedangProses;
    var ketBatas = el("alamat-batas-ket");
    ketBatas.textContent = penuh ? PESAN_BATAS : "";
    ketBatas.hidden = !penuh;
  }

  // Ambil data terbaru dari server (aksi status: alamat aktif dan batas alamat_maks).
  // `pesanTetap` (opsional): pesan yang tetap ditampilkan di atas daftar setelah muat.
  function muat(pesanTetap) {
    return A.panggilKedai("status")
      .then(function (h) {
        if (h.status === 200 && h.data && h.data.ok === true) {
          var baru = bacaAlamat(h.data.alamat);
          if (baru) {
            daftar = baru;
            var m = h.data.pengaturan
              ? Number(h.data.pengaturan.alamat_maks)
              : NaN;
            maks = isFinite(m) && m >= 1 ? m : null;
            termuat = true;
            render();
            galatDaftar(pesanTetap || "");
            return;
          }
        }
        if (h.status === 401 && !h.data) {
          galatDaftar(PESAN_SESI);
          return;
        }
        galatDaftar(pesanTetap || PESAN_MUAT);
      })
      .catch(function () {
        galatDaftar(
          pesanTetap || (navigator.onLine ? PESAN_MUAT : PESAN_OFFLINE),
        );
      });
  }

  // ------------------------------------------------------------
  // Nonaktifkan
  // ------------------------------------------------------------

  function nonaktifkan(id) {
    if (sedangProses) return;
    sedangProses = true;
    galatDaftar("");
    render();

    A.panggilKedai("alamat_nonaktif", { id: id })
      .then(function (h) {
        sedangProses = false;
        idKonfirmasi = null;

        if (h.status === 200 && h.data && h.data.ok === true) {
          var baru = bacaAlamat(h.data.alamat);
          if (baru) {
            daftar = baru;
            render();
          } else {
            render();
            muat();
          }
          return;
        }
        if (h.status === 401 && !h.data) {
          render();
          galatDaftar(PESAN_SESI);
          return;
        }
        var pesan = pesanGalat(h, PESAN_UMUM);
        // Data di layar sudah basi (alamat tidak ada atau aturan jumlah): segarkan, pesan tetap tampil.
        if (h.status === 404 || h.status === 409) {
          render();
          muat(pesan);
          return;
        }
        render();
        galatDaftar(pesan);
      })
      .catch(function () {
        sedangProses = false;
        idKonfirmasi = null;
        render();
        galatDaftar(navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE);
      });
  }

  // ------------------------------------------------------------
  // Form tambah dan ubah
  // ------------------------------------------------------------

  function bukaForm(item) {
    idUbah = item ? item.id : null;
    idKonfirmasi = null;
    bersihkanGalatForm();
    el("alamat-form-judul").textContent = item
      ? "Ubah alamat"
      : "Tambah alamat";
    el("alamat-alias").value = item ? item.alias : "";
    el("alamat-isi").value = item ? item.isi : "";
    el("alamat-daftar-bungkus").hidden = true;
    el("alamat-form-bungkus").hidden = false;
    window.scrollTo(0, 0);
  }

  function tutupForm() {
    idUbah = null;
    el("alamat-alias").value = "";
    el("alamat-isi").value = "";
    bersihkanGalatForm();
    el("alamat-form-bungkus").hidden = true;
    el("alamat-daftar-bungkus").hidden = false;
    window.scrollTo(0, 0);
  }

  function kirim(e) {
    e.preventDefault();
    if (sedangProses) return;
    bersihkanGalatForm();

    var alias = el("alamat-alias").value.trim();
    var isi = el("alamat-isi").value.trim();

    var lengkap = true;
    if (alias.length < 3 || alias.length > 30) {
      A.galatIsian(
        "isian-alamat-alias",
        "Nama alamat harus 3 sampai 30 karakter.",
      );
      lengkap = false;
    }
    if (isi.length < 10 || isi.length > 200) {
      A.galatIsian(
        "isian-alamat-isi",
        "Isi alamat harus 10 sampai 200 karakter.",
      );
      lengkap = false;
    }
    if (!lengkap) return;

    var data = { alias: alias, isi: isi };
    if (idUbah) data.id = idUbah;

    var tombol = el("tombol-alamat-simpan");
    sedangProses = true;
    A.sibuk(tombol, true, TEKS_SIMPAN);

    A.panggilKedai("alamat_simpan", data)
      .then(function (h) {
        sedangProses = false;
        A.sibuk(tombol, false, TEKS_SIMPAN);

        if (h.status === 200 && h.data && h.data.ok === true) {
          var baru = bacaAlamat(h.data.alamat);
          tutupForm();
          if (baru) {
            daftar = baru;
            render();
            galatDaftar("");
          } else {
            muat();
          }
          return;
        }
        if (h.status === 401 && !h.data) {
          A.galatForm("alamat", PESAN_SESI);
          return;
        }
        var pesan = pesanGalat(h, PESAN_UMUM);
        // Data di layar sudah basi (alamat tidak ada, atau jumlah sudah penuh): kembali ke daftar dan segarkan.
        if (h.status === 404 || h.status === 409) {
          tutupForm();
          render();
          muat(pesan);
          return;
        }
        A.galatForm("alamat", pesan);
      })
      .catch(function () {
        sedangProses = false;
        A.sibuk(tombol, false, TEKS_SIMPAN);
        A.galatForm("alamat", navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE);
      });
  }

  // ------------------------------------------------------------
  // Buka dan tutup layar
  // ------------------------------------------------------------

  function tampil() {
    daftar = [];
    maks = null;
    termuat = false;
    idKonfirmasi = null;
    sedangProses = false;
    tutupForm();
    galatDaftar("");
    render();
    A.tampilkan("alamat");
    muat();
  }

  // Dipanggil akun.js saat Keluar: tidak boleh ada alamat tersisa di layar.
  function reset() {
    daftar = [];
    maks = null;
    termuat = false;
    idKonfirmasi = null;
    sedangProses = false;
    tutupForm();
    galatDaftar("");
    render();
    el("alamat-ringkas").textContent = "";
  }

  // HOM.05: pendengar tombol lama "tombol-buku-alamat" dihapus; layar dibuka dari Home (kerangka.js).
  el("alamat-tambah").addEventListener("click", function () {
    galatDaftar("");
    bukaForm(null);
  });
  el("alamat-kembali").addEventListener("click", function () {
    A.tampilkan("sementara");
  });
  el("alamat-batal").addEventListener("click", tutupForm);
  el("form-alamat").addEventListener("submit", kirim);

  window.KedaiAlamat = Object.freeze({
    tampil: tampil,
    reset: reset,
  });
})();
