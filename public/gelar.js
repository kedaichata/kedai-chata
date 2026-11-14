// public/gelar.js
// GLR.05 dan GLR.06: gelar customer di Home (pil) dan layar Gelar Saya (banner untuk dibagikan).
// Sumber aturan: docs/gelar.md GL17 sampai GL22.
//
// Cara kerja:
// - kerangka.js memanggil window.KedaiGelar.atur(peran, nama) setiap kali balasan `status` dimuat
//   (masuk, Segarkan, kembali dari layar lain). Hanya untuk customer, atur memanggil aksi `gelar_saya`
//   SATU kali (GL22). Tidak ada timer dan tidak ada polling. Pindah tab lewat navigasi bawah tidak memanggil server.
// - Hasilnya disimpan di MEMORI saja (bukan localStorage). Home menggambar pil dari memori,
//   layar Gelar Saya menggambar banner dari memori. Menggambar banner tidak memanggil server.
// - Semua penentuan gelar dilakukan server. Aplikasi hanya menggambar (GL23).
// - Teks dari server (nama, nama gelar, deskripsi, apresiasi) hanya lewat textContent atau canvas fillText.
// - Home diam saja (tanpa pil dan tanpa pesan galat) bila gelar_saya gagal atau profil belum ada.
//   Pesan galat hanya tampil di layar Gelar Saya.
// - Banner tidak memuat data pribadi selain nama tampilan milik pemanggil (GL19).
// - kerangka.js memanggil .tampil() saat layar dibuka dan .reset() saat Keluar.

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A || typeof A.panggilKedai !== "function") {
    // akun.js belum termuat: window.KedaiGelar tidak dibuat (kerangka.js menjaga dengan typeof).
    return;
  }

  function el(id) {
    return document.getElementById(id);
  }

  var panel = el("panel-gelar");
  var barisPil = el("glr-pil-baris");
  if (!panel || !barisPil) {
    return;
  }

  // ------------------------------------------------------------------
  // Keadaan di memori
  // ------------------------------------------------------------------
  var peranIni = null; // peran dari kerangka.js; hanya "customer" yang memanggil server
  var namaIni = ""; // nama tampilan dari balasan `status` (lewat kerangka.js), tanpa panggilan baru
  var data = null; // { tingkat: {nama, deskripsi} | null, menu: [nama], apresiasi }
  var status = "belum"; // belum | memuat | ok | galat
  var nomorMuat = 0; // penanda: balasan lama diabaikan
  var nomorGambar = 0; // penanda: pembuatan berkas gambar lama diabaikan
  var blobSiap = null; // berkas PNG banner untuk Bagikan dan Unduh

  // ------------------------------------------------------------------
  // Pembacaan balasan server (bentuk dicek sebelum dipakai)
  // ------------------------------------------------------------------
  function teks(nilai, batas) {
    if (typeof nilai !== "string") return "";
    var bersih = nilai.trim();
    return bersih.length > batas ? bersih.slice(0, batas) : bersih;
  }

  // Mengembalikan objek rapi, atau null bila bentuknya tidak sesuai.
  function bacaGelar(g) {
    if (!g || typeof g !== "object") return null;
    var tingkat = null;
    if (g.tingkat && typeof g.tingkat === "object") {
      var namaTingkat = teks(g.tingkat.nama, 40);
      if (!namaTingkat) return null;
      tingkat = {
        nama: namaTingkat,
        deskripsi: teks(g.tingkat.deskripsi, 120),
      };
    } else if (g.tingkat !== null && g.tingkat !== undefined) {
      return null;
    }
    var menu = [];
    if (Array.isArray(g.menu)) {
      for (var i = 0; i < g.menu.length && menu.length < 8; i++) {
        var butir = g.menu[i];
        var n = butir && typeof butir === "object" ? teks(butir.nama, 40) : "";
        if (n) menu.push(n);
      }
    } else if (g.menu !== null && g.menu !== undefined) {
      return null;
    }
    return {
      tingkat: tingkat,
      menu: menu,
      apresiasi: teks(g.apresiasi, 200),
    };
  }

  function punyaGelar() {
    return !!data && (!!data.tingkat || data.menu.length > 0);
  }

  // ------------------------------------------------------------------
  // Pil di kartu sapaan Home (GL17): tingkat = pil emas, menu = pil kecil. Tanpa deskripsi.
  // ------------------------------------------------------------------
  function gambarPil() {
    while (barisPil.firstChild) {
      barisPil.removeChild(barisPil.firstChild);
    }
    if (peranIni !== "customer" || status !== "ok" || !punyaGelar()) {
      barisPil.hidden = true;
      return;
    }
    if (data.tingkat) {
      var pilTingkat = document.createElement("span");
      pilTingkat.className = "glr-pil glr-pil--tingkat";
      pilTingkat.textContent = data.tingkat.nama;
      barisPil.appendChild(pilTingkat);
    }
    for (var i = 0; i < data.menu.length; i++) {
      var pilMenu = document.createElement("span");
      pilMenu.className = "glr-pil glr-pil--menu";
      pilMenu.textContent = data.menu[i];
      barisPil.appendChild(pilMenu);
    }
    barisPil.hidden = false;
  }

  // ------------------------------------------------------------------
  // Layar Gelar Saya: kerangka isi dibuat sekali di sini
  // ------------------------------------------------------------------
  var kotakStatus = document.createElement("div");
  kotakStatus.className = "keadaan";
  kotakStatus.setAttribute("role", "status");
  var statusJudul = document.createElement("p");
  statusJudul.className = "keadaan__judul";
  var statusKet = document.createElement("p");
  statusKet.className = "keadaan__ket";
  var tombolUlang = document.createElement("button");
  tombolUlang.type = "button";
  tombolUlang.className = "tombol tombol--sekunder";
  tombolUlang.textContent = "Coba lagi";
  kotakStatus.appendChild(statusJudul);
  kotakStatus.appendChild(statusKet);
  kotakStatus.appendChild(tombolUlang);

  var kotakIsi = document.createElement("div");
  var intro = document.createElement("p");
  intro.className = "isian__bantuan";
  intro.textContent = "Ini banner gelarmu. Bagikan ke WhatsApp atau simpan.";
  var kanvas = document.createElement("canvas");
  kanvas.className = "glr-kanvas";
  kanvas.setAttribute("role", "img");
  var pesanGalat = document.createElement("p");
  pesanGalat.className = "isian__galat";
  pesanGalat.setAttribute("role", "alert");
  pesanGalat.hidden = true;
  var barisAksi = document.createElement("div");
  barisAksi.className = "baris-tombol";
  var tombolBagikan = document.createElement("button");
  tombolBagikan.type = "button";
  tombolBagikan.className = "tombol tombol--utama";
  tombolBagikan.textContent = "Bagikan";
  var tombolUnduh = document.createElement("button");
  tombolUnduh.type = "button";
  tombolUnduh.className = "tombol tombol--sekunder";
  tombolUnduh.textContent = "Unduh PNG";
  barisAksi.appendChild(tombolBagikan);
  barisAksi.appendChild(tombolUnduh);
  kotakIsi.appendChild(intro);
  kotakIsi.appendChild(kanvas);
  kotakIsi.appendChild(pesanGalat);
  kotakIsi.appendChild(barisAksi);

  var barisKembali = document.createElement("div");
  barisKembali.className = "baris-tombol";
  var tombolKembali = document.createElement("button");
  tombolKembali.type = "button";
  tombolKembali.className = "tombol tombol--sekunder";
  tombolKembali.id = "gelar-kembali"; // pendengarnya dipasang kerangka.js
  tombolKembali.textContent = "Kembali ke Home";
  barisKembali.appendChild(tombolKembali);

  panel.appendChild(kotakStatus);
  panel.appendChild(kotakIsi);
  panel.appendChild(barisKembali);
  kotakStatus.hidden = true;
  kotakIsi.hidden = true;

  // Bagikan hanya ditampilkan bila HP mendukung bagikan berkas; bila tidak, Unduh PNG jadi jalur utama (GL20).
  function bisaBagikanBerkas() {
    try {
      if (!navigator.share || !navigator.canShare) return false;
      return navigator.canShare({
        files: [new File([""], "a.png", { type: "image/png" })],
      });
    } catch (err) {
      return false;
    }
  }
  var adaBagikan = bisaBagikanBerkas();
  tombolBagikan.hidden = !adaBagikan;
  if (!adaBagikan) {
    tombolUnduh.className = "tombol tombol--utama";
  }

  function tampilStatus(judul, ket, denganTombol) {
    statusJudul.textContent = judul;
    statusKet.textContent = ket;
    statusKet.hidden = !ket;
    tombolUlang.hidden = !denganTombol;
    kotakStatus.hidden = false;
    kotakIsi.hidden = true;
  }

  // Menggambar ulang isi layar dari memori. Tidak memanggil server.
  function gambarLayar() {
    if (panel.hidden) return;
    pesanGalat.hidden = true;
    if (status === "belum" || status === "memuat") {
      tampilStatus("Memuat gelar...", "", false);
      return;
    }
    if (status === "galat") {
      tampilStatus(
        "Gelar belum bisa dimuat",
        navigator.onLine
          ? "Coba lagi sebentar lagi."
          : "Tidak ada internet. Sambungkan internet lalu coba lagi.",
        true,
      );
      return;
    }
    if (!punyaGelar()) {
      tampilStatus(
        "Belum ada gelar",
        "Selesaikan pesanan pertamamu untuk mendapat gelar.",
        false,
      );
      return;
    }
    kotakStatus.hidden = true;
    kotakIsi.hidden = false;
    gambarBanner();
  }

  // ------------------------------------------------------------------
  // Banner (canvas, GL19). Dibuat di HP, tanpa panggilan server dan tanpa pustaka.
  // ------------------------------------------------------------------
  var LEBAR = 1080;
  var TINGGI = 1350;
  var FONT =
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  // Warna mengikuti tema (variabel :root di style.css); cadangan bila variabel tidak terbaca.
  function warnaVar(nama, cadangan) {
    try {
      var nilai = getComputedStyle(document.documentElement)
        .getPropertyValue(nama)
        .trim();
      return nilai || cadangan;
    } catch (err) {
      return cadangan;
    }
  }

  var logo = null;
  var logoSiap = false;

  function siapkanLogo() {
    if (logo) return;
    logo = new Image();
    logo.onload = function () {
      logoSiap = true;
      gambarLayar(); // gambar ulang bila layar masih terbuka
    };
    logo.onerror = function () {
      logoSiap = false;
    };
    logo.src = "img/chata-logo.png";
  }

  function kotakBulat(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // Potong satu baris dengan "..." bila lebih lebar dari batas.
  function potongSatuBaris(ctx, isi, lebarMaks) {
    if (ctx.measureText(isi).width <= lebarMaks) return isi;
    var t = isi;
    while (t.length > 0 && ctx.measureText(t + "...").width > lebarMaks) {
      t = t.slice(0, -1);
    }
    return t.replace(/\s+$/, "") + "...";
  }

  // Bungkus teks menjadi beberapa baris; baris terakhir diberi "..." bila terpotong.
  function bungkus(ctx, isi, lebarMaks, maksBaris) {
    var kata = isi.split(/\s+/);
    var baris = [];
    var sekarang = "";
    var terpotong = false;
    for (var i = 0; i < kata.length; i++) {
      var coba = sekarang ? sekarang + " " + kata[i] : kata[i];
      if (sekarang && ctx.measureText(coba).width > lebarMaks) {
        if (baris.length === maksBaris - 1) {
          terpotong = true;
          sekarang = kata.slice(i).join(" ");
          break;
        }
        baris.push(sekarang);
        sekarang = kata[i];
      } else {
        sekarang = coba;
      }
    }
    if (sekarang) {
      baris.push(terpotong ? sekarang + "..." : sekarang);
    }
    for (var j = 0; j < baris.length; j++) {
      baris[j] = potongSatuBaris(ctx, baris[j], lebarMaks);
    }
    return baris;
  }

  function gambarBanner() {
    var ctx = kanvas.getContext("2d");
    if (!ctx) {
      tampilStatus(
        "Banner belum bisa dibuat",
        "Peramban ini tidak mendukung pembuatan gambar.",
        false,
      );
      return;
    }
    siapkanLogo();

    var cGelap = warnaVar("--marun-sangat-gelap", "#3b0a14");
    var cEmas = warnaVar("--emas-terang", "#e2b84a");
    var cTeks = warnaVar("--teks-terang", "#fff4dc");

    kanvas.width = LEBAR;
    kanvas.height = TINGGI;
    var cx = LEBAR / 2;

    // Latar marun gelap dengan pendar emas halus (mengikuti kartu sampul)
    var latar = ctx.createLinearGradient(0, 0, LEBAR, TINGGI);
    latar.addColorStop(0, "#4d0f1d");
    latar.addColorStop(0.55, cGelap);
    latar.addColorStop(1, "#2a0710");
    ctx.fillStyle = latar;
    ctx.fillRect(0, 0, LEBAR, TINGGI);
    var pendar = ctx.createRadialGradient(cx, 260, 20, cx, 260, 560);
    pendar.addColorStop(0, "rgba(226,184,74,0.22)");
    pendar.addColorStop(1, "rgba(226,184,74,0)");
    ctx.fillStyle = pendar;
    ctx.fillRect(0, 0, LEBAR, TINGGI);

    // Bingkai emas
    ctx.strokeStyle = cEmas;
    ctx.lineWidth = 6;
    kotakBulat(ctx, 30, 30, LEBAR - 60, TINGGI - 60, 36);
    ctx.stroke();
    ctx.strokeStyle = "rgba(226,184,74,0.35)";
    ctx.lineWidth = 2;
    kotakBulat(ctx, 48, 48, LEBAR - 96, TINGGI - 96, 28);
    ctx.stroke();

    ctx.textAlign = "center";

    // Logo ChATA; bila gambar logo belum siap atau gagal, tulisan menggantikannya
    if (logoSiap && logo) {
      ctx.drawImage(logo, cx - 150, 80, 300, 300);
    } else {
      ctx.textBaseline = "middle";
      ctx.fillStyle = cEmas;
      ctx.font = "700 72px " + FONT;
      ctx.fillText("Kedai ChATA", cx, 230);
    }

    // Hiasan garis emas dengan belah ketupat
    var yHias = 415;
    var garis = ctx.createLinearGradient(cx - 260, 0, cx - 20, 0);
    garis.addColorStop(0, "rgba(226,184,74,0)");
    garis.addColorStop(1, "rgba(226,184,74,0.85)");
    ctx.fillStyle = garis;
    ctx.fillRect(cx - 260, yHias - 1, 240, 2);
    var garis2 = ctx.createLinearGradient(cx + 20, 0, cx + 260, 0);
    garis2.addColorStop(0, "rgba(226,184,74,0.85)");
    garis2.addColorStop(1, "rgba(226,184,74,0)");
    ctx.fillStyle = garis2;
    ctx.fillRect(cx + 20, yHias - 1, 240, 2);
    ctx.save();
    ctx.translate(cx, yHias);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = cEmas;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();

    var y = 460;

    // Nama customer (dipotong dengan "..." bila terlalu panjang)
    if (namaIni) {
      ctx.textBaseline = "top";
      ctx.fillStyle = cTeks;
      ctx.font = "700 64px " + FONT;
      ctx.fillText(potongSatuBaris(ctx, namaIni, 900), cx, y);
      y += 100;
    }

    // Kalimat apresiasi dihitung lebih dulu: ia menempel di bawah banner dan menentukan batas isi di atasnya
    var barisApresiasi = [];
    var barisTinggi = 50;
    var awalApresiasi = TINGGI - 90;
    if (data && data.apresiasi) {
      ctx.font = "italic 400 36px " + FONT;
      barisApresiasi = bungkus(ctx, data.apresiasi, 860, 3);
      awalApresiasi = TINGGI - 90 - barisApresiasi.length * barisTinggi;
    }
    var batasAtas = awalApresiasi - 70;

    // Gelar tingkat: pil emas besar, lalu satu baris deskripsi
    if (data && data.tingkat) {
      var ukuran = 76;
      ctx.font = "700 " + ukuran + "px " + FONT;
      while (ukuran > 46 && ctx.measureText(data.tingkat.nama).width > 820) {
        ukuran -= 4;
        ctx.font = "700 " + ukuran + "px " + FONT;
      }
      var namaTingkat = potongSatuBaris(ctx, data.tingkat.nama, 820);
      var lebarPil = ctx.measureText(namaTingkat).width + 112;
      var tinggiPil = Math.round(ukuran * 1.75);
      ctx.fillStyle = cEmas;
      kotakBulat(ctx, cx - lebarPil / 2, y, lebarPil, tinggiPil, tinggiPil / 2);
      ctx.fill();
      ctx.textBaseline = "middle";
      ctx.fillStyle = cGelap;
      ctx.fillText(namaTingkat, cx, y + tinggiPil / 2 + 2);
      y += tinggiPil + 50;

      if (data.tingkat.deskripsi) {
        ctx.textBaseline = "top";
        ctx.fillStyle = cTeks;
        ctx.font = "400 40px " + FONT;
        var barisDeskripsi = bungkus(ctx, data.tingkat.deskripsi, 880, 3);
        for (var d = 0; d < barisDeskripsi.length; d++) {
          ctx.fillText(barisDeskripsi[d], cx, y + d * 56);
        }
        y += barisDeskripsi.length * 56 + 40;
      }
    }

    // Gelar menu: pil kecil (nama saja), berjajar dan turun baris bila tidak muat
    if (data && data.menu.length > 0) {
      ctx.font = "700 38px " + FONT;
      var tinggiMenu = 76;
      var jarak = 18;
      var butir = [];
      for (var m = 0; m < data.menu.length; m++) {
        var t = potongSatuBaris(ctx, data.menu[m], 760);
        butir.push({ teks: t, lebar: ctx.measureText(t).width + 68 });
      }
      var idx = 0;
      while (idx < butir.length && y + tinggiMenu <= batasAtas) {
        var baris = [];
        var lebarBaris = 0;
        while (idx < butir.length) {
          var tambah = butir[idx].lebar + (baris.length ? jarak : 0);
          if (baris.length && lebarBaris + tambah > 900) break;
          baris.push(butir[idx]);
          lebarBaris += tambah;
          idx++;
        }
        var x = cx - lebarBaris / 2;
        for (var b = 0; b < baris.length; b++) {
          ctx.fillStyle = "rgba(226,184,74,0.12)";
          kotakBulat(ctx, x, y, baris[b].lebar, tinggiMenu, tinggiMenu / 2);
          ctx.fill();
          ctx.strokeStyle = cEmas;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.textBaseline = "middle";
          ctx.fillStyle = cEmas;
          ctx.fillText(
            baris[b].teks,
            x + baris[b].lebar / 2,
            y + tinggiMenu / 2 + 2,
          );
          x += baris[b].lebar + jarak;
        }
        y += tinggiMenu + jarak;
      }
    }

    // Kalimat apresiasi di bagian bawah
    if (barisApresiasi.length > 0) {
      ctx.fillStyle = "rgba(226,184,74,0.6)";
      ctx.fillRect(cx - 80, awalApresiasi - 36, 160, 2);
      ctx.textBaseline = "top";
      ctx.fillStyle = cTeks;
      ctx.font = "italic 400 36px " + FONT;
      for (var a = 0; a < barisApresiasi.length; a++) {
        ctx.fillText(barisApresiasi[a], cx, awalApresiasi + a * barisTinggi);
      }
    }

    // Keterangan untuk pembaca layar (tanpa data pribadi selain nama tampilan milik sendiri)
    kanvas.setAttribute(
      "aria-label",
      "Banner gelar" + (data && data.tingkat ? ": " + data.tingkat.nama : ""),
    );

    // Berkas PNG disiapkan di muka supaya Bagikan langsung jalan saat diketuk
    blobSiap = null;
    tombolBagikan.disabled = true;
    tombolUnduh.disabled = true;
    var nomor = ++nomorGambar;
    kanvas.toBlob(function (b) {
      if (nomor !== nomorGambar) return;
      blobSiap = b;
      tombolBagikan.disabled = !b;
      tombolUnduh.disabled = !b;
    }, "image/png");
  }

  function tampilPesan(isi) {
    pesanGalat.textContent = isi;
    pesanGalat.hidden = false;
  }

  tombolBagikan.addEventListener("click", function () {
    pesanGalat.hidden = true;
    if (!blobSiap) return;
    var berkas = new File([blobSiap], "gelar-chata.png", {
      type: "image/png",
    });
    navigator
      .share({ files: [berkas], title: "Gelarku di Kedai ChATA" })
      .catch(function (err) {
        // Batal dari menu bagikan bukan galat.
        if (err && err.name === "AbortError") return;
        tampilPesan("Belum bisa dibagikan. Coba tombol Unduh PNG.");
      });
  });

  tombolUnduh.addEventListener("click", function () {
    pesanGalat.hidden = true;
    if (!blobSiap) return;
    try {
      var alamat = URL.createObjectURL(blobSiap);
      var tautan = document.createElement("a");
      tautan.href = alamat;
      tautan.download = "gelar-chata.png";
      document.body.appendChild(tautan);
      tautan.click();
      document.body.removeChild(tautan);
      setTimeout(function () {
        URL.revokeObjectURL(alamat);
      }, 4000);
    } catch (err) {
      tampilPesan("Belum bisa diunduh. Coba lagi sebentar lagi.");
    }
  });

  // ------------------------------------------------------------------
  // Pengambilan data (aksi `gelar_saya`, customer saja, satu panggilan)
  // ------------------------------------------------------------------
  function gagalMuat() {
    // Bila data lama masih ada, tetap dipakai; Home tidak menampilkan pesan galat apa pun.
    if (!data) status = "galat";
    gambarPil();
    gambarLayar();
  }

  function muat() {
    if (peranIni !== "customer") return;
    var nomor = ++nomorMuat;
    if (!data) {
      status = "memuat";
      gambarLayar();
    }
    A.panggilKedai("gelar_saya")
      .then(function (h) {
        if (nomor !== nomorMuat) return; // sudah Keluar atau ada panggilan yang lebih baru
        if (h.status === 200 && h.data && h.data.ok === true) {
          var g = bacaGelar(h.data.gelar);
          if (g) {
            data = g;
            status = "ok";
            gambarPil();
            gambarLayar();
            return;
          }
          console.error("kedai gelar_saya: bentuk balasan tidak dikenal");
          gagalMuat();
          return;
        }
        if (h.status === 400) {
          // Profil belum ada: tidak ada gelar, Home diam saja (tanpa pil dan tanpa pesan galat).
          data = { tingkat: null, menu: [], apresiasi: "" };
          status = "ok";
          gambarPil();
          gambarLayar();
          return;
        }
        // Hanya kode HTTP yang dicatat di konsol; tanpa token atau data pengguna.
        console.error("kedai gelar_saya gagal, kode HTTP:", h.status);
        gagalMuat();
      })
      .catch(function () {
        if (nomor !== nomorMuat) return;
        console.error("kedai gelar_saya gagal tersambung");
        gagalMuat();
      });
  }

  tombolUlang.addEventListener("click", muat);

  // ------------------------------------------------------------------
  // Antarmuka untuk kerangka.js
  // ------------------------------------------------------------------

  // Dipanggil kerangka.js tiap balasan `status` dimuat (masuk, Segarkan, kembali dari layar lain).
  function atur(peran, nama) {
    peranIni = peran === "customer" ? "customer" : null;
    namaIni = typeof nama === "string" ? nama.trim() : "";
    if (peranIni === "customer") {
      muat();
    } else {
      data = null;
      status = "belum";
      gambarPil();
    }
  }

  // Dipanggil kerangka.js saat layar Gelar Saya dibuka: hanya menggambar dari memori, tanpa panggilan server.
  function tampil() {
    gambarLayar();
  }

  // Dipanggil kerangka.js saat Keluar: nama dan gelar tidak boleh tersisa (HP dipakai bergantian).
  function reset() {
    nomorMuat++;
    nomorGambar++;
    peranIni = null;
    namaIni = "";
    data = null;
    status = "belum";
    blobSiap = null;
    kanvas.width = 1;
    kanvas.height = 1;
    pesanGalat.hidden = true;
    pesanGalat.textContent = "";
    kotakStatus.hidden = true;
    kotakIsi.hidden = true;
    gambarPil();
  }

  window.KedaiGelar = Object.freeze({
    atur: atur,
    tampil: tampil,
    reset: reset,
  });
})();
