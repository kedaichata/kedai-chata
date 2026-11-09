// public/orderownercatatan.js
// ORD.10: form tambah catatan owner di detail order (order.md O12, O14; kontrak catatan_tambah dan catatan_dibaca
// di Handoff #18). Dipakai orderowner.js (layar Order Masuk dan Semua Order). Daftar catatan (baca saja) tetap
// digambar oleh orderowner.js; berkas ini hanya form tambah catatan dan penanda "sudah dibaca".
// Berkas ini TIDAK memanggil server untuk catatan_tambah: pengiriman lewat fungsi `kirim` milik orderowner.js
// (alat.kirim), jadi kunci tombol, 409, 404, dan muat ulang detail memakai jalur yang sama dengan Setuju dan Tolak.
//
// Aturan yang dijaga:
// - Aplikasi hanya mengirim aksi, id order, dan isi catatan. Peran, nama penulis, dan waktu TIDAK pernah dikirim;
//   server yang menentukan dan yang menolak (catatan_tambah: 409 bila status Diproses ke atas, terkunci, atau penuh).
// - Form hanya tampil saat Menunggu atau Disetujui (O12). Server tetap yang memutuskan.
// - Catatan tidak bisa diedit atau dihapus; berubah pikiran = tambah catatan baru.
// - Batas karakter dan jumlah ada di database dan tidak terbaca aplikasi (Handoff #4); server yang menolak dan
//   pesannya ditampilkan apa adanya.
// - catatan_dibaca dipanggil saat detail tampil, hanya bila isi catatan berubah sejak terakhir ditandai (hemat
//   panggilan, tanpa polling). Gagal diam-diam, tidak ada yang ditampilkan.
// - Tanda "Catatan baru" di kartu daftar TIDAK dikerjakan di sini (ditunda ke NTF.07, keputusan ketua 9 Nov 2026).
// - Semua teks dipasang lewat textContent, bukan innerHTML.
// - Isian yang belum terkirim dikosongkan saat pindah order, kembali ke daftar, setelah terkirim, dan saat Keluar.
// Dimuat SEBELUM orderowner.js di index.html (orderowner.js tetap aman bila berkas ini tidak termuat).

(function () {
  "use strict";

  var PESAN_KOSONG = "Tulis catatannya dulu.";
  var PESAN_UMUM = "Catatan belum bisa dikirim. Coba lagi sebentar lagi.";
  var INFO_SUKSES = "Catatan terkirim.";

  // alat dari orderowner.js: awalan, buat, buatTombol, sedangKirim(), kirim(aksi, isi, infoSukses, pesanUmum),
  // pesan(teks), panggil(aksi, isi) (hanya untuk catatan_dibaca).
  function buatCatatan(alat) {
    var buat = alat.buat;
    var buatTombol = alat.buatTombol;
    var draft = ""; // isi kolom yang belum terkirim; bertahan saat layar digambar ulang
    var kunciDibaca = ""; // catatan terakhir yang sudah ditandai dibaca (id order, jumlah, waktu terakhir)

    function bolehTambah(o) {
      return !!o && (o.status === "Menunggu" || o.status === "Disetujui");
    }

    // Kosongkan isian saja (pindah order, kembali ke daftar, catatan terkirim).
    function kosongkanIsian() {
      draft = "";
    }

    // Keluar: tidak ada yang tersisa.
    function reset() {
      draft = "";
      kunciDibaca = "";
    }

    function kirimCatatan(o) {
      if (alat.sedangKirim()) return;
      var isi = draft.trim();
      if (isi === "") {
        alat.pesan(PESAN_KOSONG);
        return;
      }
      alat.kirim(
        "catatan_tambah",
        { id: o.id, isi: isi },
        INFO_SUKSES,
        PESAN_UMUM,
      );
    }

    // Kartu form tambah catatan; null bila status tidak mengizinkan.
    function kartu(o) {
      if (!bolehTambah(o)) return null;
      var k = buat("div", "kartu");
      k.appendChild(buat("h2", "kartu__judul", "Tambah catatan"));

      var isian = buat("div", "isian");
      var label = buat(
        "label",
        "isian__label",
        "Catatan tampil ke customer pemilik order",
      );
      var idKolom = alat.awalan + "-catatan-baru";
      label.htmlFor = idKolom;
      isian.appendChild(label);
      var kolom = buat("textarea", "isian__kolom");
      kolom.id = idKolom;
      kolom.rows = 3;
      kolom.value = draft;
      kolom.disabled = alat.sedangKirim();
      kolom.addEventListener("input", function () {
        draft = kolom.value;
      });
      isian.appendChild(kolom);
      isian.appendChild(
        buat(
          "p",
          "isian__bantuan",
          "Catatan tidak bisa diubah atau dihapus. Kalau salah, tambah catatan baru.",
        ),
      );
      k.appendChild(isian);

      var baris = buat("div", "baris-tombol");
      var tombol = buatTombol(
        "Kirim catatan",
        "tombol--utama",
        function () {
          kirimCatatan(o);
        },
        alat.sedangKirim(),
      );
      tombol.id = alat.awalan + "-tombol-catatan-kirim";
      baris.appendChild(tombol);
      k.appendChild(baris);
      return k;
    }

    // Tandai catatan sudah dibaca (catatan_dibaca) setelah detail tampil.
    function tandaiDibaca(o) {
      if (!o || !o.catatan || o.catatan.length === 0) return;
      if (typeof alat.panggil !== "function") return;
      var terakhir = o.catatan[o.catatan.length - 1];
      var kunci = o.id + ":" + o.catatan.length + ":" + terakhir.waktu;
      if (kunci === kunciDibaca) return;
      kunciDibaca = kunci;
      alat.panggil("catatan_dibaca", { id: o.id }).catch(function () {
        // Gagal (misalnya offline): coba lagi saat detail dimuat berikutnya.
        if (kunciDibaca === kunci) kunciDibaca = "";
      });
    }

    return {
      kartu: kartu,
      kosongkanIsian: kosongkanIsian,
      reset: reset,
      tandaiDibaca: tandaiDibaca,
    };
  }

  window.KedaiOrderOwnerCatatan = Object.freeze({ buat: buatCatatan });
})();
