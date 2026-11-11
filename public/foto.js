// public/foto.js
// FTO.03: kompres foto di HP dan unggah foto bukti antar (foto-bukti.md FT1, FT2, FT4, FT5).
// Dipasang di detail order layar penjaga (orderpenjaga.js memanggil window.KedaiFoto.pasang).
// Dimuat SETELAH akun.js dan SEBELUM orderpenjaga.js di index.html.
//
// Alur satu kali kirim:
//   1. perkecil foto di HP (canvas, JPEG) sampai sekitar target, tanpa panggilan server
//   2. aksi foto_minta_unggah { id, jenis } -> server memberi lokasi, token, url_unggah, maks_kb
//   3. kirim berkas ke url_unggah (permintaan langsung ke Storage, memakai token dari server)
//   4. aksi foto_catat { id, lokasi } -> server mencatat foto (foto lama otomatis ditandai diganti)
//
// Aturan yang dijaga:
// - Aplikasi hanya mengirim id order, jenis berkas, dan lokasi yang diberikan server. Nama berkas,
//   ukuran, peran, dan status tidak pernah ditentukan di sini; server yang memeriksa dan menolak.
// - Tombol hanya tampil untuk tipe Diantar dengan status Diantar atau Selesai (FT1, FT2). Itu hanya
//   kemudahan; server yang menolak selain itu.
// - Batas ukuran sebenarnya dibaca dari balasan server (maks_kb, dari pengaturan). Angka di bawah
//   hanya target kompres supaya foto kecil, bukan batas keamanan.
// - Tombol dikunci sebelum permintaan berangkat (dua ketukan cepat tidak jadi dua unggahan).
// - Semua teks dipasang lewat textContent. Galat mentah tidak ditampilkan; di konsol hanya kode HTTP.
// - Tanpa panggilan server saat detail dibuka. Menampilkan foto ada di FTO.04.
// - Kunci publishable hanya dikirim ke alamat Supabase milik config.js, tidak ke alamat lain.

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A) {
    // akun.js belum termuat: window.KedaiFoto tidak dibuat.
    return;
  }

  var KONFIG = window.KEDAI_CONFIG || {};

  // ------------------------------------------------------------
  // Setelan kompres (satu tempat; sesuaikan setelah dicoba di HP)
  // Dicoba berurutan: tiap ukuran sisi dengan tiap kualitas, berhenti begitu hasilnya di bawah target.
  // Bila tidak ada yang mencapai target, dipakai hasil terkecil.
  // ------------------------------------------------------------
  var KOMPRES = {
    ukuranSisi: [640, 560, 480, 400, 320], // sisi terpanjang, piksel
    kualitas: [0.5, 0.4, 0.3], // kualitas JPEG
    targetKb: 50, // target, bukan syarat (batas keras dari server)
  };

  var PESAN_OFFLINE = "Belum bisa terhubung. Periksa internet lalu coba lagi.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";
  var PESAN_UMUM = "Foto belum bisa dikirim. Coba lagi sebentar lagi.";
  var PESAN_BACA = "Foto tidak bisa dibaca. Coba foto lain.";
  var PESAN_BESAR = "Foto masih terlalu besar. Coba foto lain.";
  var PESAN_BUKAN_GAMBAR = "Pilih berkas gambar saja.";

  function buat(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks !== undefined) e.textContent = teks;
    return e;
  }

  function kosongkan(e) {
    while (e.firstChild) {
      e.removeChild(e.firstChild);
    }
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

  // ------------------------------------------------------------
  // Keadaan
  // ------------------------------------------------------------

  var state = { id: "", sibuk: false, teks: "", galat: false };
  var orde = null; // order pada kartu yang sedang tampil: { id, nomor }
  var kartuAktif = null; // elemen kartu yang sedang tampil
  var nomorKirim = 0; // naik tiap reset; balasan lama diabaikan

  function bolehFoto(o) {
    return (
      !!o &&
      o.tipe === "Diantar" &&
      (o.status === "Diantar" || o.status === "Selesai")
    );
  }

  // ------------------------------------------------------------
  // Kompres
  // ------------------------------------------------------------

  function bacaDenganGambar(file) {
    return new Promise(function (ok, gagal) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        ok({
          sumber: img,
          lebar: img.naturalWidth,
          tinggi: img.naturalHeight,
          tutup: function () {
            URL.revokeObjectURL(url);
          },
        });
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        gagal(new Error("gambar"));
      };
      img.src = url;
    });
  }

  function bacaGambar(file) {
    if (!window.createImageBitmap) {
      return bacaDenganGambar(file);
    }
    return window
      .createImageBitmap(file, { imageOrientation: "from-image" })
      .catch(function () {
        return window.createImageBitmap(file);
      })
      .then(function (bmp) {
        return {
          sumber: bmp,
          lebar: bmp.width,
          tinggi: bmp.height,
          tutup: function () {
            if (bmp.close) bmp.close();
          },
        };
      })
      .catch(function () {
        return bacaDenganGambar(file);
      });
  }

  // Gambar ulang ke canvas dengan sisi terpanjang <= sisiMaks, lalu jadikan JPEG.
  function jadiBlob(g, sisiMaks, kualitas) {
    return new Promise(function (ok, gagal) {
      var skala = Math.min(1, sisiMaks / Math.max(g.lebar, g.tinggi));
      var lebar = Math.max(1, Math.round(g.lebar * skala));
      var tinggi = Math.max(1, Math.round(g.tinggi * skala));
      var kanvas = document.createElement("canvas");
      kanvas.width = lebar;
      kanvas.height = tinggi;
      var ctx = kanvas.getContext("2d");
      if (!ctx || !kanvas.toBlob) {
        gagal(new Error("kanvas"));
        return;
      }
      // Latar putih supaya bagian transparan tidak jadi hitam di JPEG.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, lebar, tinggi);
      ctx.drawImage(g.sumber, 0, 0, lebar, tinggi);
      kanvas.toBlob(
        function (blob) {
          ok(blob);
        },
        "image/jpeg",
        kualitas,
      );
    });
  }

  // Hasilnya Blob JPEG; null bila tidak ada hasil.
  function kecilkan(file) {
    return bacaGambar(file).then(function (g) {
      var kombinasi = [];
      for (var i = 0; i < KOMPRES.ukuranSisi.length; i++) {
        for (var k = 0; k < KOMPRES.kualitas.length; k++) {
          kombinasi.push([KOMPRES.ukuranSisi[i], KOMPRES.kualitas[k]]);
        }
      }
      var target = KOMPRES.targetKb * 1024;
      var terbaik = null;
      var idx = 0;

      function langkah() {
        if (idx >= kombinasi.length) {
          g.tutup();
          return Promise.resolve(terbaik);
        }
        var c = kombinasi[idx++];
        return jadiBlob(g, c[0], c[1]).then(function (blob) {
          if (!blob) return langkah();
          if (!terbaik || blob.size < terbaik.size) terbaik = blob;
          if (blob.size <= target) {
            g.tutup();
            return blob;
          }
          return langkah();
        });
      }

      return langkah().catch(function (err) {
        g.tutup();
        throw err;
      });
    });
  }

  // ------------------------------------------------------------
  // Unggah ke Storage (alamat dan token dari server)
  // ------------------------------------------------------------

  // Mengembalikan Promise { ok, status }. Kunci publishable hanya dikirim ke alamat Supabase sendiri.
  function kirimBerkas(urlUnggah, token, blob) {
    var u;
    var asal;
    try {
      u = new URL(urlUnggah);
      asal = new URL(KONFIG.SUPABASE_URL).origin;
    } catch (e) {
      return Promise.reject(new Error("alamat"));
    }
    if (u.origin !== asal) {
      return Promise.reject(new Error("alamat"));
    }
    if (!u.searchParams.get("token") && token) {
      u.searchParams.set("token", token);
    }
    var f = new FormData();
    f.append("cacheControl", "3600");
    f.append("", blob);
    return fetch(u.toString(), {
      method: "PUT",
      headers: { apikey: KONFIG.SUPABASE_PUBLISHABLE_KEY },
      body: f,
    }).then(function (r) {
      return { ok: r.ok, status: r.status };
    });
  }

  // ------------------------------------------------------------
  // Tampilan kartu
  // ------------------------------------------------------------

  function atur(teks, galat) {
    state.teks = teks || "";
    state.galat = !!galat;
    gambarKartu();
  }

  function gambarKartu() {
    var kartu = kartuAktif;
    if (!kartu || !orde) return;
    kosongkan(kartu);

    kartu.appendChild(buat("h2", "kartu__judul", "Foto bukti antar"));
    kartu.appendChild(
      buat(
        "p",
        "isian__bantuan",
        "Boleh dikosongkan. Foto posisi barang saat diantar. Foto baru menggantikan foto sebelumnya.",
      ),
    );

    var milikIni = state.id === orde.id;
    if (milikIni && state.teks) {
      var p = buat(
        "p",
        state.galat ? "isian__galat" : "isian__bantuan",
        state.teks,
      );
      p.setAttribute("role", state.galat ? "alert" : "status");
      kartu.appendChild(p);
    }

    var teksTombol = "Ambil foto bukti";
    if (state.sibuk) {
      teksTombol = milikIni ? "Mengirim foto..." : "Menunggu foto lain selesai";
    }

    var input = buat("input", "");
    input.type = "file";
    input.accept = "image/*";
    input.hidden = true;
    input.addEventListener("change", function () {
      var file = input.files && input.files[0] ? input.files[0] : null;
      input.value = "";
      if (file) kirimFoto(orde, file);
    });

    var baris = buat("div", "baris-tombol");
    var tombol = buat("button", "tombol tombol--sekunder", teksTombol);
    tombol.type = "button";
    tombol.disabled = state.sibuk;
    tombol.addEventListener("click", function () {
      if (state.sibuk) return;
      input.click();
    });
    baris.appendChild(tombol);
    kartu.appendChild(baris);
    kartu.appendChild(input);
  }

  // ------------------------------------------------------------
  // Kirim foto
  // ------------------------------------------------------------

  function kirimFoto(ord, file) {
    if (state.sibuk) return;
    if (!file.type || file.type.indexOf("image/") !== 0) {
      state.id = ord.id;
      atur(PESAN_BUKAN_GAMBAR, true);
      return;
    }

    // Kunci sebelum permintaan berangkat.
    var nomor = ++nomorKirim;
    state.id = ord.id;
    state.sibuk = true;
    atur("Memperkecil foto...", false);

    function selesai(teks, galat) {
      if (nomor !== nomorKirim) return; // sudah Keluar: balasan lama diabaikan
      state.sibuk = false;
      atur(teks, galat);
    }

    function jalurGalat(h) {
      if (h.status === 401 && !h.data) return PESAN_SESI;
      return pesanServer(h) || PESAN_UMUM;
    }

    kecilkan(file)
      .then(function (blob) {
        if (nomor !== nomorKirim) return;
        if (!blob) {
          selesai(PESAN_BACA, true);
          return;
        }
        atur("Mengirim foto...", false);
        return A.panggilKedai("foto_minta_unggah", {
          id: ord.id,
          jenis: "jpg",
        }).then(function (h) {
          if (nomor !== nomorKirim) return;
          if (!(h.status === 200 && h.data && h.data.ok === true)) {
            selesai(jalurGalat(h), true);
            return;
          }
          var d = h.data;
          if (
            typeof d.lokasi !== "string" ||
            typeof d.token !== "string" ||
            typeof d.url_unggah !== "string"
          ) {
            selesai(PESAN_UMUM, true);
            return;
          }
          if (typeof d.maks_kb === "number" && blob.size > d.maks_kb * 1024) {
            selesai(PESAN_BESAR, true);
            return;
          }
          var mengganti = d.mengganti === true;
          return kirimBerkas(d.url_unggah, d.token, blob).then(function (u) {
            if (nomor !== nomorKirim) return;
            if (!u.ok) {
              // Hanya kode HTTP yang dicatat di konsol (untuk bukti uji); tanpa token atau data lain.
              console.error("unggah foto gagal, kode HTTP:", u.status);
              selesai(PESAN_UMUM, true);
              return;
            }
            return A.panggilKedai("foto_catat", {
              id: ord.id,
              lokasi: d.lokasi,
            }).then(function (c) {
              if (nomor !== nomorKirim) return;
              if (c.status === 200 && c.data && c.data.ok === true) {
                selesai(
                  mengganti ? "Foto bukti diganti." : "Foto bukti terkirim.",
                  false,
                );
                return;
              }
              console.error("foto_catat gagal, kode HTTP:", c.status);
              selesai(jalurGalat(c), true);
            });
          });
        });
      })
      .catch(function (err) {
        if (nomor !== nomorKirim) return;
        if (err && (err.message === "gambar" || err.message === "kanvas")) {
          selesai(PESAN_BACA, true);
          return;
        }
        selesai(navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE, true);
      });
  }

  // ------------------------------------------------------------
  // Dipanggil orderpenjaga.js
  // ------------------------------------------------------------

  // Pasang kartu foto di wadah detail order (hanya bila order memenuhi syarat).
  function pasang(wadah, o) {
    if (!bolehFoto(o)) {
      if (orde && o && orde.id === o.id) {
        orde = null;
        kartuAktif = null;
      }
      return;
    }
    orde = { id: o.id, nomor: o.nomor };
    kartuAktif = buat("div", "kartu antrean-kartu");
    gambarKartu();
    wadah.appendChild(kartuAktif);
  }

  // Keluar: tidak boleh ada keadaan tersisa; balasan yang masih di jalan diabaikan.
  function reset() {
    nomorKirim++;
    state = { id: "", sibuk: false, teks: "", galat: false };
    orde = null;
    kartuAktif = null;
  }

  window.KedaiFoto = Object.freeze({
    pasang: pasang, // dipanggil orderpenjaga.js tiap detail order digambar
    reset: reset, // dipanggil orderpenjaga.js saat Keluar
  });
})();
