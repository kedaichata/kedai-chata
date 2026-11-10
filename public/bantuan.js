// public/bantuan.js
// BTN.03: layar Bantuan (bantuan.md BT4, BT5, BT9, BT12; desain.md DS13, DS15).
// Tampil di dalam panel "bantuan" (#panel-bantuan di index.html), dibuka dari ikon ? di bilah atas
// atau tombol Bantuan di Home (diatur kerangka.js). Isi diambil dari aksi `bantuan_daftar`
// (balasan: { ok: true, bantuan: [{ kunci, bagian, urutan, judul, isi }, ...] }, sudah urut dan
// sudah disaring peran oleh server).
// Dimuat SETELAH akun.js (memakai window.KedaiAkun) dan SEBELUM kerangka.js di index.html.
//
// Aturan yang dijaga:
// - Aplikasi hanya mengirim nama aksi. Peran tidak dikirim (server membacanya dari tabel staf, BT5).
// - Data diambil saat layar dibuka dan lewat tombol Segarkan. Tanpa polling (BT9).
// - Semua teks dari server lewat textContent, bukan innerHTML. Galat mentah tidak ditampilkan.
// - Pertanyaan dikelompokkan per `bagian` dan dilipat (akordeon bawaan peramban, <details>), BT12.
//   Baris baru di `isi` menjadi paragraf baru.
// - Keadaan khusus mengikuti DS13: memuat, kosong ("Belum ada bantuan"), galat, offline.
//
// Infografik (keputusan ketua 10 Nov 2026, menggantikan rencana kolom `jenis`; menimpa BT4 sebagian):
// - Baris dengan `urutan` tepat 1 yang `isi`-nya path gambar sah adalah SLOT INFOGRAFIK. `isi` = path
//   relatif di folder img/ (contoh img/infografik.webp), `judul` = teks alternatif gambar.
// - Gambar tampil di atas daftar, tidak dilipat, dan tidak ikut masuk daftar pertanyaan.
// - Server tidak memeriksa `isi`, jadi path DICEK DI SINI: harus diawali img/, huruf kecil/angka/_/-
//   per bagian, berakhiran .webp, .png, atau .jpg; tanpa "..", ":" atau "//". Gambar dipasang lewat
//   img.src, bukan innerHTML.
// - Bila `isi` di urutan 1 bukan path sah, baris itu tampil sebagai pertanyaan biasa. Bila ada lebih
//   dari satu baris gambar di urutan 1, hanya yang pertama dipakai (sisanya tidak ditampilkan).
// - Bila berkas gambar belum ada atau gagal dimuat, gambar disembunyikan dan layar tetap rapi.
// - Satu gambar umum untuk semua peran (per peran: versi berikutnya). Sampai gambarnya ada, layar
//   hanya menampilkan pertanyaan.
// - Urutan 1 jangan dipakai untuk pertanyaan biasa (pertanyaan memakai kelipatan 10, BT3).
// - Daftar dikosongkan saat Keluar (reset). Tombol Kembali dipasang kerangka.js (id bantuan-kembali).

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A) {
    // akun.js belum termuat: window.KedaiBantuan tidak dibuat.
    return;
  }

  var panel = document.getElementById("panel-bantuan");
  if (!panel) {
    // Panel belum ada di index.html: tidak membuat apa-apa.
    return;
  }

  var PESAN_UMUM = "Bantuan belum bisa dimuat. Coba lagi sebentar lagi.";
  var PESAN_OFFLINE =
    "Belum bisa terhubung. Aplikasi tetap bisa dibuka, tetapi bantuan butuh internet. Sambungkan internet lalu coba lagi.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";

  var URUTAN_INFOGRAFIK = 1;
  // img/ lalu satu atau lebih bagian huruf kecil, angka, _ atau -, dipisah satu garis miring, dan
  // akhiran gambar. Titik hanya boleh di akhiran, jadi ".." dan "//" tidak lolos.
  var POLA_GAMBAR = /^img\/[a-z0-9_-]+(\/[a-z0-9_-]+)*\.(webp|png|jpg)$/i;

  var NS_SVG = "http://www.w3.org/2000/svg";

  var bungkusIsi = null; // wadah isi layar; dibuat sekali saat pertama dibuka
  var nomorMuat = 0; // penanda permintaan terbaru; balasan lama diabaikan (juga setelah Keluar)

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

  // Ikon keadaan khusus (DS11: selalu ada ikon dan tulisan, tidak hanya warna).
  function buatIkon(daftarPath) {
    var s = document.createElementNS(NS_SVG, "svg");
    s.setAttribute("class", "keadaan__ikon");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    for (var i = 0; i < daftarPath.length; i++) {
      var p = document.createElementNS(NS_SVG, "path");
      p.setAttribute("d", daftarPath[i]);
      s.appendChild(p);
    }
    return s;
  }

  var IKON_KOSONG = [
    "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z",
    "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
    "M12 17h.01",
  ];
  var IKON_GALAT = ["M12 3L2 21h20L12 3z", "M12 10v5M12 18v.01"];
  var IKON_OFFLINE = [
    "M2 8.8a15 15 0 0 1 20 0",
    "M5 12.5a10 10 0 0 1 14 0",
    "M8.5 16a5 5 0 0 1 7 0",
    "M12 19.5v.01",
    "M3 3l18 18",
  ];

  function kosongkan() {
    while (bungkusIsi.firstChild) {
      bungkusIsi.removeChild(bungkusIsi.firstChild);
    }
  }

  // Pesan dari fungsi kedai sendiri (ok:false + pesan) aman ditampilkan; balasan platform diganti pesan umum.
  function pesanServer(h) {
    if (
      h &&
      h.data &&
      h.data.ok === false &&
      typeof h.data.pesan === "string"
    ) {
      return h.data.pesan;
    }
    return "";
  }

  // Satu bentuk keadaan khusus (DS13). `denganUlang` = tombol Coba lagi.
  function keadaan(judul, ket, ikon, galat, denganUlang) {
    var k = buat("div", galat ? "keadaan keadaan--galat" : "keadaan");
    k.setAttribute("role", galat ? "alert" : "status");
    k.appendChild(buatIkon(ikon));
    k.appendChild(buat("p", "keadaan__judul", judul));
    k.appendChild(buat("p", "keadaan__ket", ket));
    if (denganUlang) {
      var t = buat("button", "tombol tombol--sekunder", "Coba lagi");
      t.type = "button";
      t.addEventListener("click", muat);
      k.appendChild(t);
    }
    return k;
  }

  function tampilMemuat() {
    kosongkan();
    var k = buat("div", "keadaan");
    k.setAttribute("role", "status");
    var putar = buat("div", "putaran");
    putar.setAttribute("aria-hidden", "true");
    k.appendChild(putar);
    k.appendChild(buat("p", "keadaan__judul", "Sedang memuat..."));
    bungkusIsi.appendChild(k);
  }

  function tampilKosong() {
    kosongkan();
    bungkusIsi.appendChild(
      keadaan(
        "Belum ada bantuan",
        "Bantuan akan muncul di sini setelah ditulis.",
        IKON_KOSONG,
        false,
        false,
      ),
    );
  }

  function tampilGalat(pesan) {
    kosongkan();
    bungkusIsi.appendChild(
      keadaan("Ada masalah", pesan, IKON_GALAT, true, true),
    );
  }

  function tampilOffline() {
    kosongkan();
    bungkusIsi.appendChild(
      keadaan("Tidak ada internet", PESAN_OFFLINE, IKON_OFFLINE, false, true),
    );
  }

  // Satu pertanyaan: <details> dengan <summary> (judul) dan jawaban per baris sebagai paragraf.
  function buatTanya(b) {
    var d = buat("details", "bantuan-tanya");
    d.appendChild(buat("summary", "bantuan-tanya__judul", b.judul));
    var jawab = buat("div", "bantuan-jawab");
    var baris = b.isi.split(/\r?\n/);
    for (var i = 0; i < baris.length; i++) {
      if (baris[i].trim() !== "") {
        jawab.appendChild(buat("p", "", baris[i]));
      }
    }
    d.appendChild(jawab);
    return d;
  }

  // Susun layar dari daftar baris: infografik (bila ada) lalu pertanyaan per bagian.
  function tampilDaftar(daftar) {
    var info = null;
    var tanya = [];
    for (var i = 0; i < daftar.length; i++) {
      var b = daftar[i];
      if (
        !b ||
        typeof b.bagian !== "string" ||
        typeof b.judul !== "string" ||
        typeof b.isi !== "string"
      ) {
        continue;
      }
      if (b.urutan === URUTAN_INFOGRAFIK && POLA_GAMBAR.test(b.isi.trim())) {
        if (!info) {
          info = { path: b.isi.trim(), alt: b.judul };
        }
        continue; // baris gambar tidak masuk daftar pertanyaan
      }
      tanya.push(b);
    }

    if (!info && tanya.length === 0) {
      tampilKosong();
      return;
    }

    kosongkan();

    if (info) {
      var gambar = buat("figure", "bantuan-gambar");
      var img = document.createElement("img");
      img.alt = info.alt;
      img.decoding = "async";
      // Gambar belum ada atau gagal dimuat: sembunyikan, layar tetap rapi (kosong bila tak ada pertanyaan).
      img.addEventListener("error", function () {
        if (gambar.parentNode) {
          gambar.parentNode.removeChild(gambar);
        }
        if (tanya.length === 0 && !bungkusIsi.firstChild) {
          tampilKosong();
        }
      });
      img.src = info.path;
      gambar.appendChild(img);
      bungkusIsi.appendChild(gambar);
    }

    // Kelompok per bagian, urutan mengikuti kemunculan pertama (server sudah mengurutkan).
    var bagian = [];
    for (var j = 0; j < tanya.length; j++) {
      var kelompok = null;
      for (var k = 0; k < bagian.length; k++) {
        if (bagian[k].nama === tanya[j].bagian) {
          kelompok = bagian[k];
          break;
        }
      }
      if (!kelompok) {
        kelompok = { nama: tanya[j].bagian, butir: [] };
        bagian.push(kelompok);
      }
      kelompok.butir.push(tanya[j]);
    }

    for (var m = 0; m < bagian.length; m++) {
      var kartu = buat("div", "kartu bantuan-bagian");
      kartu.appendChild(buat("h2", "kartu__judul", bagian[m].nama));
      for (var n = 0; n < bagian[m].butir.length; n++) {
        kartu.appendChild(buatTanya(bagian[m].butir[n]));
      }
      bungkusIsi.appendChild(kartu);
    }
  }

  function muat() {
    var nomor = ++nomorMuat;
    if (!navigator.onLine) {
      tampilOffline();
      return;
    }
    tampilMemuat();
    A.panggilKedai("bantuan_daftar", {})
      .then(function (h) {
        if (nomor !== nomorMuat) {
          return; // sudah ada permintaan lebih baru, atau sudah Keluar
        }
        if (
          h.status === 200 &&
          h.data &&
          h.data.ok === true &&
          Array.isArray(h.data.bantuan)
        ) {
          tampilDaftar(h.data.bantuan);
          return;
        }
        if (h.status === 401) {
          tampilGalat(PESAN_SESI);
          return;
        }
        tampilGalat(pesanServer(h) || PESAN_UMUM);
      })
      .catch(function () {
        if (nomor !== nomorMuat) {
          return;
        }
        if (!navigator.onLine) {
          tampilOffline();
        } else {
          tampilGalat(PESAN_UMUM);
        }
      });
  }

  // Wadah dibuat sekali: tombol Kembali (dipasang kerangka.js) dan wadah isi.
  function pasangKerangka() {
    if (bungkusIsi) {
      return;
    }
    var baris = buat("div", "baris-tombol");
    var kembali = buat("button", "tombol tombol--sekunder", "Kembali");
    kembali.type = "button";
    kembali.id = "bantuan-kembali";
    baris.appendChild(kembali);
    panel.appendChild(baris);

    bungkusIsi = buat("div");
    bungkusIsi.id = "bantuan-isi";
    panel.appendChild(bungkusIsi);
  }

  // Dipanggil kerangka.js saat tab Bantuan dibuka dan lewat Segarkan.
  function tampil() {
    pasangKerangka();
    muat();
  }

  // Dipanggil kerangka.js saat Keluar: isi tidak boleh tersisa, balasan yang masih di jalan diabaikan.
  function reset() {
    nomorMuat++;
    if (bungkusIsi) {
      kosongkan();
    }
  }

  window.KedaiBantuan = Object.freeze({
    tampil: tampil,
    reset: reset,
  });
})();
