// public/gim.js
// GIM.02: game Arithmetics (gim.md GM8 sampai GM13).
// Murni di HP: tidak memanggil server, tidak ada leaderboard, tidak ada kode Firebase.
// Satu-satunya data tersimpan: level tertinggi (satu angka) di localStorage, kunci chata_game_arithmetics_best.
// Tanpa gaya inline: semua tampilan lewat kelas gim- di game.css. Semua teks lewat textContent.
// Angka timer tetap di kode ini (pengecualian GM11: game tanpa server).
// Dibuka lewat window.KedaiGim.buka() (dari gimmenu.js), ditutup lewat .tutup() (juga saat Keluar).

(function () {
  "use strict";

  // ---- Angka permainan (GM10, GM11) ----
  var KUNCI_REKOR = "chata_game_arithmetics_best";
  var NYAWA_AWAL = 3;
  var BINTANG_NAIK = 5; // bintang yang dibutuhkan untuk naik level
  var WAKTU_AWAL = 15; // detik per soal di level 1 (dilonggarkan untuk ibu-ibu)
  var WAKTU_TURUN = 0.5; // detik berkurang tiap naik level
  var WAKTU_MIN = 8; // detik paling sedikit
  var JEDA_UMPAN_BALIK = 800; // ms menampilkan benar atau salah sebelum soal berikutnya
  var RIWAYAT_MAKS = 10; // soal tidak berulang dalam 10 soal terakhir
  var DETAK = 100; // ms antar pembaruan bar waktu

  var layar = null; // elemen layar game (dibuat saat pertama dibuka)
  var ref = {}; // elemen-elemen di dalam layar
  var pemicu = null; // elemen yang fokus sebelum game dibuka
  var pewaktu = null; // setInterval bar waktu
  var penundaan = null; // setTimeout umpan balik

  var s = {
    mode: "tutup", // tutup | mulai | main | jeda | umpan | selesai
    level: 1,
    bintang: 0,
    nyawa: NYAWA_AWAL,
    total: 0, // ms waktu soal ini
    sisa: 0, // ms tersisa
    terakhir: 0, // cap waktu detak terakhir
    pilihan: [0, 0],
    benarIdx: 0,
    riwayat: [],
    aksiUtama: null,
    aksiKedua: null,
  };

  // ---------- Alat kecil ----------
  function buat(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks !== undefined) e.textContent = teks;
    return e;
  }

  function tombol(kelas, teks, label) {
    var b = buat("button", kelas, teks);
    b.type = "button";
    if (label) b.setAttribute("aria-label", label);
    return b;
  }

  function acak(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  function ulang(teks, n) {
    var hasil = "";
    for (var i = 0; i < n; i++) hasil += teks;
    return hasil;
  }

  // ---------- Level tertinggi (GM9) ----------
  function bacaRekor() {
    try {
      var n = parseInt(window.localStorage.getItem(KUNCI_REKOR), 10);
      return n > 0 ? n : 0;
    } catch (e) {
      return 0;
    }
  }

  function simpanRekor(n) {
    try {
      window.localStorage.setItem(KUNCI_REKOR, String(n));
    } catch (e) {
      // Penyimpanan tidak tersedia (misalnya mode privat): game tetap jalan tanpa rekor.
    }
  }

  // ---------- Soal (GM10) ----------
  function waktuLevel(level) {
    return Math.max(WAKTU_MIN, WAKTU_AWAL - (level - 1) * WAKTU_TURUN);
  }

  // Hitung dengan urutan operasi yang benar: kali dulu sebelum tambah dan kurang.
  function hitung(x, o1, y, o2, z) {
    if (o2 === "\u00d7" && o1 !== "\u00d7") {
      var r = y * z;
      return o1 === "+" ? x + r : x - r;
    }
    var kiri = o1 === "+" ? x + y : o1 === "\u2212" ? x - y : x * y;
    return o2 === "+" ? kiri + z : o2 === "\u2212" ? kiri - z : kiri * z;
  }

  function soalCampuran(level) {
    var besar = Math.min(10 + (level - 5) * 3, 60);
    var kecil = Math.min(besar, 12);
    var ops = ["+", "\u2212", "\u00d7"];
    for (var coba = 0; coba < 60; coba++) {
      var o1 = ops[acak(0, 2)];
      var o2 = ops[acak(0, 2)];
      var x = o1 === "\u00d7" ? acak(2, kecil) : acak(2, besar);
      var y =
        o1 === "\u00d7" || o2 === "\u00d7" ? acak(2, kecil) : acak(2, besar);
      var z = o2 === "\u00d7" ? acak(2, kecil) : acak(2, besar);
      var hasil = hitung(x, o1, y, o2, z);
      if (hasil >= 0) {
        return {
          teks: x + " " + o1 + " " + y + " " + o2 + " " + z,
          hasil: hasil,
        };
      }
    }
    return { teks: "12 + 15", hasil: 27 }; // cadangan, hampir tidak pernah dipakai
  }

  function buatSoal(level) {
    var a, b, c;
    if (level === 1) {
      a = acak(1, 20);
      b = acak(1, 20);
      return { teks: a + " + " + b, hasil: a + b };
    }
    if (level === 2) {
      a = acak(5, 50);
      b = acak(1, a - 1);
      return { teks: a + " \u2212 " + b, hasil: a - b };
    }
    if (level === 3) {
      a = acak(2, 9);
      b = acak(2, 9);
      return { teks: a + " \u00d7 " + b, hasil: a * b };
    }
    if (level === 4) {
      b = acak(2, 9);
      c = acak(2, 9);
      return { teks: b * c + " \u00f7 " + b, hasil: c };
    }
    return soalCampuran(level);
  }

  // Jawaban salah yang masuk akal: dekat dengan yang benar, tidak sama, tidak negatif.
  function jawabanSalah(benar) {
    var rentang = Math.max(3, Math.min(10, Math.floor(benar / 8)));
    for (var coba = 0; coba < 30; coba++) {
      var d = acak(1, rentang);
      var salah = Math.random() < 0.5 ? benar + d : benar - d;
      if (salah >= 0 && salah !== benar) return salah;
    }
    return benar + 1;
  }

  function soalBaru() {
    var soal = null;
    for (var coba = 0; coba < 40; coba++) {
      soal = buatSoal(s.level);
      if (s.riwayat.indexOf(soal.teks) === -1) break;
    }
    s.riwayat.push(soal.teks);
    if (s.riwayat.length > RIWAYAT_MAKS) s.riwayat.shift();

    var salah = jawabanSalah(soal.hasil);
    s.benarIdx = Math.random() < 0.5 ? 0 : 1;
    s.pilihan = s.benarIdx === 0 ? [soal.hasil, salah] : [salah, soal.hasil];

    s.total = waktuLevel(s.level) * 1000;
    s.sisa = s.total;

    ref.soal.textContent = soal.teks + " = ?";
    ref.pesan.textContent = "";
    for (var i = 0; i < 2; i++) {
      ref.pilih[i].textContent = String(s.pilihan[i]);
      ref.pilih[i].className = "gim-pilihan";
    }
    perbaruiStatus();
    perbaruiBar();
  }

  // ---------- Tampilan ----------
  function perbaruiStatus() {
    ref.level.textContent = "Level " + s.level;
    var nyawa = Math.max(0, s.nyawa);
    ref.nyawa.textContent =
      ulang("\u2665", nyawa) + ulang("\u2661", NYAWA_AWAL - nyawa);
    ref.nyawa.setAttribute(
      "aria-label",
      "Nyawa " + nyawa + " dari " + NYAWA_AWAL,
    );
    ref.bintang.textContent =
      ulang("\u2605", s.bintang) + ulang("\u2606", BINTANG_NAIK - s.bintang);
    ref.bintang.setAttribute(
      "aria-label",
      "Bintang " + s.bintang + " dari " + BINTANG_NAIK,
    );
  }

  function perbaruiBar() {
    ref.bar.max = s.total || 1;
    ref.bar.value = s.sisa;
    if (s.sisa < s.total * 0.3) {
      ref.bar.classList.add("gim-bar--sedikit");
    } else {
      ref.bar.classList.remove("gim-bar--sedikit");
    }
  }

  function tampilKartu(
    judul,
    isi,
    rekor,
    labelUtama,
    aksiUtama,
    labelKedua,
    aksiKedua,
  ) {
    ref.kartuJudul.textContent = judul;
    ref.kartuIsi.textContent = isi;
    ref.kartuRekor.textContent = rekor;
    ref.kartuRekor.hidden = !rekor;
    ref.kartuUtama.textContent = labelUtama;
    ref.kartuKedua.textContent = labelKedua;
    s.aksiUtama = aksiUtama;
    s.aksiKedua = aksiKedua;
    ref.kartuLatar.hidden = false;
    ref.kartuUtama.focus();
  }

  function sembunyikanKartu() {
    ref.kartuLatar.hidden = true;
  }

  function teksRekor() {
    var r = bacaRekor();
    return r > 0 ? "Level tertinggi: " + r : "Belum ada rekor.";
  }

  // ---------- Pewaktu ----------
  function hentikanPewaktu() {
    if (pewaktu !== null) {
      window.clearInterval(pewaktu);
      pewaktu = null;
    }
  }

  function mulaiPewaktu() {
    hentikanPewaktu();
    s.terakhir = Date.now();
    pewaktu = window.setInterval(detak, DETAK);
  }

  function detak() {
    if (s.mode !== "main") return;
    var sekarang = Date.now();
    s.sisa -= sekarang - s.terakhir;
    s.terakhir = sekarang;
    if (s.sisa <= 0) {
      s.sisa = 0;
      perbaruiBar();
      akhiriSoal(false, -1);
      return;
    }
    perbaruiBar();
  }

  // ---------- Alur permainan ----------
  function mulaiMain() {
    s.level = 1;
    s.bintang = 0;
    s.nyawa = NYAWA_AWAL;
    s.riwayat = [];
    sembunyikanKartu();
    soalBaru();
    s.mode = "main";
    mulaiPewaktu();
  }

  // Dipanggil saat satu soal berakhir: dijawab (benar atau salah) atau waktu habis (idx = -1).
  function akhiriSoal(benar, idx) {
    if (s.mode !== "main") return;
    hentikanPewaktu();
    s.mode = "umpan";

    ref.pilih[s.benarIdx].classList.add("gim-pilihan--benar");
    if (benar) {
      s.bintang += 1;
      if (s.bintang >= BINTANG_NAIK) {
        s.level += 1;
        s.bintang = 0;
        ref.pesan.textContent = "Naik ke level " + s.level + "!";
      } else {
        ref.pesan.textContent = "Benar!";
      }
    } else {
      s.nyawa -= 1;
      if (idx >= 0) ref.pilih[idx].classList.add("gim-pilihan--salah");
      ref.pesan.textContent = idx >= 0 ? "Salah." : "Waktu habis!";
    }
    perbaruiStatus();

    penundaan = window.setTimeout(setelahUmpanBalik, JEDA_UMPAN_BALIK);
  }

  function setelahUmpanBalik() {
    penundaan = null;
    if (s.mode !== "umpan") return;
    if (s.nyawa <= 0) {
      selesai();
      return;
    }
    soalBaru();
    s.mode = "main";
    mulaiPewaktu();
    // Aplikasi disembunyikan saat umpan balik: langsung jeda supaya waktu tidak jalan diam-diam.
    if (document.hidden) jeda();
  }

  function jawab(i) {
    if (s.mode !== "main") return;
    akhiriSoal(i === s.benarIdx, i);
  }

  function jeda() {
    if (s.mode !== "main") return;
    hentikanPewaktu();
    s.mode = "jeda";
    tampilKartu(
      "Dijeda",
      "Level " + s.level + ", nyawa " + s.nyawa + " dari " + NYAWA_AWAL + ".",
      "",
      "Lanjut",
      lanjut,
      "Keluar dari game",
      tutup,
    );
  }

  function lanjut() {
    if (s.mode !== "jeda") return;
    sembunyikanKartu();
    s.mode = "main";
    mulaiPewaktu();
  }

  function selesai() {
    hentikanPewaktu();
    s.mode = "selesai";
    var rekorLama = bacaRekor();
    var baru = s.level > rekorLama;
    if (baru) simpanRekor(s.level);
    tampilKartu(
      "Selesai",
      "Nyawa habis. Kamu sampai level " + s.level + ".",
      baru ? "Rekor baru!" : teksRekor(),
      "Main lagi",
      mulaiMain,
      "Tutup",
      tutup,
    );
  }

  // ---------- Membangun layar (sekali, saat pertama dibuka) ----------
  function bangun() {
    layar = buat("div", "gim-layar");
    layar.setAttribute("role", "dialog");
    layar.setAttribute("aria-modal", "true");
    layar.setAttribute("aria-label", "Game Arithmetics");
    layar.hidden = true;

    var isi = buat("div", "gim-isi");

    var atas = buat("div", "gim-atas");
    ref.tutup = tombol("gim-ikon", "Tutup", "Tutup game");
    ref.level = buat("div", "gim-level", "Level 1");
    ref.jeda = tombol("gim-ikon", "Jeda", "Jeda");
    atas.appendChild(ref.tutup);
    atas.appendChild(ref.level);
    atas.appendChild(ref.jeda);

    var status = buat("div", "gim-status");
    ref.nyawa = buat("div", "gim-nyawa");
    ref.bintang = buat("div", "gim-bintang");
    status.appendChild(ref.nyawa);
    status.appendChild(ref.bintang);

    ref.bar = document.createElement("progress");
    ref.bar.className = "gim-bar";
    ref.bar.setAttribute("aria-label", "Sisa waktu");

    var soalBungkus = buat("div", "gim-soal-bungkus");
    ref.soal = buat("p", "gim-soal");
    soalBungkus.appendChild(ref.soal);

    ref.pesan = buat("p", "gim-pesan");
    ref.pesan.setAttribute("role", "status");

    var baris = buat("div", "gim-pilihan-baris");
    ref.pilih = [tombol("gim-pilihan", ""), tombol("gim-pilihan", "")];
    baris.appendChild(ref.pilih[0]);
    baris.appendChild(ref.pilih[1]);

    isi.appendChild(atas);
    isi.appendChild(status);
    isi.appendChild(ref.bar);
    isi.appendChild(soalBungkus);
    isi.appendChild(ref.pesan);
    isi.appendChild(baris);
    layar.appendChild(isi);

    // Kartu Mulai, Dijeda, Selesai: satu kartu dipakai bergantian
    ref.kartuLatar = buat("div", "gim-kartu-latar");
    var kartu = buat("div", "gim-kartu");
    ref.kartuJudul = buat("h2", "gim-kartu__judul");
    ref.kartuIsi = buat("p", "gim-kartu__isi");
    ref.kartuRekor = buat("p", "gim-kartu__rekor");
    ref.kartuUtama = tombol("gim-tombol gim-tombol--utama", "");
    ref.kartuKedua = tombol("gim-tombol", "");
    kartu.appendChild(ref.kartuJudul);
    kartu.appendChild(ref.kartuIsi);
    kartu.appendChild(ref.kartuRekor);
    kartu.appendChild(ref.kartuUtama);
    kartu.appendChild(ref.kartuKedua);
    ref.kartuLatar.appendChild(kartu);
    layar.appendChild(ref.kartuLatar);

    ref.tutup.addEventListener("click", tutup);
    ref.jeda.addEventListener("click", jeda);
    ref.pilih[0].addEventListener("click", function () {
      jawab(0);
    });
    ref.pilih[1].addEventListener("click", function () {
      jawab(1);
    });
    ref.kartuUtama.addEventListener("click", function () {
      if (s.aksiUtama) s.aksiUtama();
    });
    ref.kartuKedua.addEventListener("click", function () {
      if (s.aksiKedua) s.aksiKedua();
    });

    document.body.appendChild(layar);
  }

  function buka() {
    if (s.mode !== "tutup") return;
    if (!layar) bangun();
    pemicu = document.activeElement;

    // Tampilan awal di belakang kartu Mulai
    s.level = 1;
    s.bintang = 0;
    s.nyawa = NYAWA_AWAL;
    s.total = 1;
    s.sisa = 1;
    ref.soal.textContent = "";
    ref.pesan.textContent = "";
    ref.pilih[0].textContent = "";
    ref.pilih[1].textContent = "";
    ref.pilih[0].className = "gim-pilihan";
    ref.pilih[1].className = "gim-pilihan";
    perbaruiStatus();
    perbaruiBar();

    s.mode = "mulai";
    layar.hidden = false;
    document.body.classList.add("gim-terbuka");
    tampilKartu(
      "Arithmetics",
      "Pilih jawaban yang benar sebelum waktu habis. Kumpulkan 5 bintang untuk naik level. Kamu punya 3 nyawa.",
      teksRekor(),
      "Mulai",
      mulaiMain,
      "Tutup",
      tutup,
    );
  }

  function tutup() {
    if (s.mode === "tutup") return;
    hentikanPewaktu();
    if (penundaan !== null) {
      window.clearTimeout(penundaan);
      penundaan = null;
    }
    s.mode = "tutup";
    if (layar) layar.hidden = true;
    document.body.classList.remove("gim-terbuka");
    if (
      pemicu &&
      typeof pemicu.focus === "function" &&
      document.contains(pemicu)
    ) {
      pemicu.focus();
    }
    pemicu = null;
  }

  // Jeda otomatis bila aplikasi disembunyikan (pindah aplikasi atau layar mati).
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) jeda();
  });

  // Esc: saat main jadi jeda, saat dijeda lanjut, selain itu menutup.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || s.mode === "tutup") return;
    if (s.mode === "main") jeda();
    else if (s.mode === "jeda") lanjut();
    else if (s.mode !== "umpan") tutup();
  });

  window.KedaiGim = Object.freeze({
    buka: buka,
    tutup: tutup,
  });
})();
