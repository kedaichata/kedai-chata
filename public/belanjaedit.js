// public/belanjaedit.js
// BLJ.05 (giliran 2b): ubah barang, batalkan barang, dan ubah judul catatan Belanja Warung (belanja.md BL5, BL7, BL8).
// Dipanggil dari belanja.js, hanya untuk catatan milik sendiri yang belum terkunci (tombol tidak digambar di tempat lain).
// Satu kotak dialog dipakai untuk tiga keperluan. Dimuat SETELAH akun.js (memakai window.KedaiAkun) dan SEBELUM belanja.js.
//
// Aksi `kedai` yang dipakai (Handoff #3):
//   belanja_item_ubah {id (item), nama, harga} -> {ok, item: {id, nama, harga}}
//   belanja_item_batal {id (item)}             -> {ok, item: {id}}
//   belanja_judul_ubah {id (catatan), judul}   -> {ok, belanja: {id, judul}}
//   Harga dikirim sebagai ANGKA JSON. Pesan galat dari server sudah ramah dan tanpa angka; layar tinggal menampilkannya.
//
// Aturan yang dijaga:
// - Aplikasi hanya mengirim id, nama, harga, atau judul. Tidak ada total, peran, atau penginput. Yang menolak bukan penginput,
//   catatan terkunci, atau item sudah dibatalkan adalah server (BL7, BL9); tombol di layar hanya kemudahan.
// - Cek di layar hanya kemudahan (nama tidak kosong, harga angka bulat minimal 1). Batas panjang dan harga diputuskan server.
// - Batalkan barang tidak bisa dibatalkan lagi (item Dibatalkan tidak bisa diaktifkan atau diedit): dialog menjelaskannya dengan jujur (BL8).
// - Tanpa localStorage. Semua teks lewat textContent. Galat mentah tidak ditampilkan. Tanpa polling.
// - Keluar akun: dialog ditutup dan isiannya dibuang.
// - Gaya di belanja.css (kelas blj-).

(function () {
  "use strict";

  var A = window.KedaiAkun;
  var layarUtama = document.getElementById("layar-sementara");
  var navOwner = document.getElementById("nav-owner");
  if (!A || !layarUtama || !navOwner) {
    // Bagian index.html atau akun.js belum lengkap: edit tidak dipasang, aplikasi lain tetap jalan.
    return;
  }

  var PESAN_UMUM = "Perubahan belum bisa disimpan. Coba lagi sebentar lagi.";
  var PESAN_OFFLINE = "Belum ada internet. Sambungkan internet lalu coba lagi.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";
  var MAKS_DIGIT = 15;

  // Keadaan di memori.
  var mode = ""; // "item", "batal", atau "judul"
  var idSasaran = ""; // id item (mode item dan batal) atau id catatan (mode judul)
  var onSelesai = null;
  var terbuka = false;
  var sedangKirim = false;

  // Unsur dialog (dibuat saat pertama dibuka).
  var dlg = null;
  var elJudul = null;
  var elIsi = null;
  var bungkusNama = null;
  var elNama = null;
  var galatNama = null;
  var bungkusHarga = null;
  var elHarga = null;
  var galatHarga = null;
  var bungkusJudul = null;
  var elJudulIn = null;
  var elGalat = null;
  var tKembali = null;
  var tYa = null;

  function buat(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks !== undefined) e.textContent = teks;
    return e;
  }

  function setGalat(p, teks) {
    if (!p) return;
    p.textContent = teks || "";
    p.hidden = !teks;
  }

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

  function rapikanTeks(t) {
    return String(t).replace(/\s+/g, " ").trim();
  }

  function titikRibuan(digit) {
    return digit.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Isian harga: hanya angka, titik ribuan otomatis ("45000" jadi "45.000").
  function rapikanHarga() {
    var v = elHarga.value;
    var pos = v.length;
    try {
      if (typeof elHarga.selectionStart === "number") {
        pos = elHarga.selectionStart;
      }
    } catch (err) {
      pos = v.length;
    }
    var digit = v.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAKS_DIGIT);
    var sebelum = v.slice(0, pos).replace(/\D/g, "").length;
    if (sebelum > digit.length) sebelum = digit.length;
    var f = titikRibuan(digit);
    if (f !== v) {
      elHarga.value = f;
      var baru = 0;
      var hitung = 0;
      while (baru < f.length && hitung < sebelum) {
        if (/\d/.test(f.charAt(baru))) hitung++;
        baru++;
      }
      try {
        elHarga.setSelectionRange(baru, baru);
      } catch (err2) {
        // Tidak masalah: kursor di akhir.
      }
    }
    setGalat(galatHarga, "");
  }

  // ------------------------------------------------------------
  // Kerangka dialog
  // ------------------------------------------------------------

  function buatIsian(idKolom, label) {
    var bungkus = buat("div", "isian");
    var lab = buat("label", "isian__label", label);
    lab.setAttribute("for", idKolom);
    bungkus.appendChild(lab);
    return bungkus;
  }

  function buatDialog() {
    if (dlg) return;
    dlg = buat("div", "blj-dialog blj-edit-dialog");
    dlg.hidden = true;
    var latar = buat("div", "blj-dialog__latar");
    var kotak = buat("div", "blj-dialog__kotak");
    kotak.setAttribute("role", "alertdialog");
    kotak.setAttribute("aria-modal", "true");
    kotak.setAttribute("aria-labelledby", "blj-edit-judul");

    elJudul = buat("h2", "blj-dialog__judul", "");
    elJudul.id = "blj-edit-judul";
    elIsi = buat("p", "blj-dialog__isi", "");

    bungkusNama = buatIsian("blj-ed-nama", "Nama barang");
    elNama = buat("input", "isian__kolom");
    elNama.id = "blj-ed-nama";
    elNama.type = "text";
    elNama.autocomplete = "off";
    elNama.setAttribute("enterkeyhint", "next");
    galatNama = buat("p", "isian__galat");
    galatNama.hidden = true;
    bungkusNama.appendChild(elNama);
    bungkusNama.appendChild(galatNama);

    bungkusHarga = buatIsian("blj-ed-harga", "Harga (Rp)");
    elHarga = buat("input", "isian__kolom");
    elHarga.id = "blj-ed-harga";
    elHarga.type = "text";
    elHarga.setAttribute("inputmode", "numeric");
    elHarga.autocomplete = "off";
    elHarga.setAttribute("enterkeyhint", "done");
    galatHarga = buat("p", "isian__galat");
    galatHarga.hidden = true;
    bungkusHarga.appendChild(elHarga);
    bungkusHarga.appendChild(galatHarga);

    bungkusJudul = buatIsian("blj-ed-judul", "Judul catatan");
    elJudulIn = buat("input", "isian__kolom");
    elJudulIn.id = "blj-ed-judul";
    elJudulIn.type = "text";
    elJudulIn.autocomplete = "off";
    elJudulIn.setAttribute("enterkeyhint", "done");
    bungkusJudul.appendChild(elJudulIn);

    elGalat = buat("p", "isian__galat");
    elGalat.setAttribute("role", "alert");
    elGalat.hidden = true;

    var baris = buat("div", "baris-tombol");
    tKembali = buat("button", "tombol tombol--sekunder", "Kembali");
    tKembali.type = "button";
    tYa = buat("button", "tombol tombol--utama", "Simpan");
    tYa.type = "button";
    baris.appendChild(tKembali);
    baris.appendChild(tYa);

    kotak.appendChild(elJudul);
    kotak.appendChild(elIsi);
    kotak.appendChild(bungkusNama);
    kotak.appendChild(bungkusHarga);
    kotak.appendChild(bungkusJudul);
    kotak.appendChild(elGalat);
    kotak.appendChild(baris);
    dlg.appendChild(latar);
    dlg.appendChild(kotak);
    document.body.appendChild(dlg);

    latar.addEventListener("click", tutup);
    tKembali.addEventListener("click", tutup);
    tYa.addEventListener("click", kirim);
    elHarga.addEventListener("input", rapikanHarga);
    elNama.addEventListener("input", function () {
      setGalat(galatNama, "");
    });
    // Enter di nama pindah ke harga; Enter di harga atau judul menyimpan.
    elNama.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        elHarga.focus();
      }
    });
    elHarga.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        kirim();
      }
    });
    elJudulIn.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        kirim();
      }
    });
  }

  // Atur tampilan dialog sesuai keperluan, lalu tampilkan.
  function tampil(opsi) {
    buatDialog();
    mode = opsi.mode;
    idSasaran = opsi.id;
    onSelesai = typeof opsi.onSelesai === "function" ? opsi.onSelesai : null;
    sedangKirim = false;
    setGalat(elGalat, "");
    setGalat(galatNama, "");
    setGalat(galatHarga, "");
    elNama.value = "";
    elHarga.value = "";
    elJudulIn.value = "";
    tKembali.disabled = false;
    tYa.disabled = false;
    bungkusNama.hidden = true;
    bungkusHarga.hidden = true;
    bungkusJudul.hidden = true;

    if (mode === "item") {
      elJudul.textContent = "Ubah barang";
      elIsi.textContent =
        "Ubah nama atau harganya. Harga adalah total barang itu, misalnya Ayam 2 kg harganya 45.000.";
      bungkusNama.hidden = false;
      bungkusHarga.hidden = false;
      elNama.value = typeof opsi.nama === "string" ? opsi.nama : "";
      var angka = Math.round(Number(opsi.harga) || 0);
      elHarga.value = angka > 0 ? titikRibuan(String(angka)) : "";
      tKembali.className = "tombol tombol--sekunder";
      tKembali.textContent = "Kembali";
      tYa.className = "tombol tombol--utama";
      tYa.textContent = "Simpan perubahan";
    } else if (mode === "judul") {
      elJudul.textContent = "Ubah judul";
      elIsi.textContent = "Judul bisa diubah selama catatan belum dikunci.";
      bungkusJudul.hidden = false;
      elJudulIn.value = typeof opsi.judul === "string" ? opsi.judul : "";
      tKembali.className = "tombol tombol--sekunder";
      tKembali.textContent = "Kembali";
      tYa.className = "tombol tombol--utama";
      tYa.textContent = "Simpan judul";
    } else {
      // Batalkan barang: tombol aman (Kembali) jadi tombol utama, Ya berpinggir merah (DS12).
      var nama = typeof opsi.nama === "string" ? opsi.nama : "";
      elJudul.textContent = "Batalkan barang ini?";
      elIsi.textContent =
        (nama ? "Barang: " + nama + ". " : "") +
        "Barang yang dibatalkan tidak ikut dihitung. Barangnya tetap tampil dicoret, dan tidak bisa dihidupkan atau diubah lagi. Kalau cuma salah nama atau harga, pakai Ubah saja.";
      tKembali.className = "tombol tombol--utama";
      tKembali.textContent = "Kembali";
      tYa.className = "tombol tombol--bahaya";
      tYa.textContent = "Ya, batalkan barang";
    }

    terbuka = true;
    dlg.hidden = false;
    if (mode === "item") {
      elNama.focus();
    } else if (mode === "judul") {
      elJudulIn.focus();
    } else {
      tKembali.focus();
    }
  }

  function tutup() {
    if (!dlg || sedangKirim) return;
    terbuka = false;
    onSelesai = null;
    dlg.hidden = true;
  }

  // ------------------------------------------------------------
  // Kirim
  // ------------------------------------------------------------

  function aturSibuk(sibuk, teksSibuk, teksNormal) {
    sedangKirim = sibuk;
    tYa.disabled = sibuk;
    tKembali.disabled = sibuk;
    tYa.textContent = sibuk ? teksSibuk : teksNormal;
  }

  function kirim() {
    if (!terbuka || sedangKirim) return;
    setGalat(elGalat, "");
    setGalat(galatNama, "");
    setGalat(galatHarga, "");

    var aksi = "";
    var data = {};
    var teksNormal = tYa.textContent;
    var teksSibuk = "Menyimpan...";

    if (mode === "item") {
      var nama = rapikanTeks(elNama.value);
      var digit = elHarga.value.replace(/\D/g, "");
      var harga = digit === "" ? 0 : Number(digit);
      var lengkap = true;
      if (nama === "") {
        setGalat(galatNama, "Tulis nama barangnya dulu, misalnya Ayam 2 kg.");
        lengkap = false;
      }
      if (!isFinite(harga) || harga < 1) {
        setGalat(galatHarga, "Isi harga dengan angka, misalnya 45.000.");
        lengkap = false;
      }
      if (!lengkap) {
        if (nama === "") {
          elNama.focus();
        } else {
          elHarga.focus();
        }
        return;
      }
      aksi = "belanja_item_ubah";
      data = { id: idSasaran, nama: nama, harga: harga };
    } else if (mode === "judul") {
      aksi = "belanja_judul_ubah";
      data = { id: idSasaran, judul: rapikanTeks(elJudulIn.value) };
    } else {
      aksi = "belanja_item_batal";
      data = { id: idSasaran };
      teksSibuk = "Membatalkan...";
    }

    if (!navigator.onLine) {
      setGalat(elGalat, PESAN_OFFLINE);
      return;
    }

    aturSibuk(true, teksSibuk, teksNormal);
    A.panggilKedai(aksi, data)
      .then(function (h) {
        if (h && h.status === 200 && h.data && h.data.ok === true) {
          var balik = onSelesai;
          sedangKirim = false;
          tutup();
          if (typeof balik === "function") balik();
          return;
        }
        aturSibuk(false, teksSibuk, teksNormal);
        setGalat(
          elGalat,
          h && h.status === 401 ? PESAN_SESI : pesanServer(h) || PESAN_UMUM,
        );
      })
      .catch(function () {
        aturSibuk(false, teksSibuk, teksNormal);
        setGalat(elGalat, navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE);
      });
  }

  // ------------------------------------------------------------
  // Pintu masuk (dipanggil belanja.js) dan Keluar akun
  // ------------------------------------------------------------

  // opsi: {id (item), nama, harga, onSelesai}
  function ubahItem(opsi) {
    if (!opsi || typeof opsi.id !== "string" || !opsi.id) return;
    tampil({
      mode: "item",
      id: opsi.id,
      nama: opsi.nama,
      harga: opsi.harga,
      onSelesai: opsi.onSelesai,
    });
  }

  // opsi: {id (item), nama, onSelesai}
  function batalItem(opsi) {
    if (!opsi || typeof opsi.id !== "string" || !opsi.id) return;
    tampil({
      mode: "batal",
      id: opsi.id,
      nama: opsi.nama,
      onSelesai: opsi.onSelesai,
    });
  }

  // opsi: {id (catatan), judul, onSelesai}
  function ubahJudul(opsi) {
    if (!opsi || typeof opsi.id !== "string" || !opsi.id) return;
    tampil({
      mode: "judul",
      id: opsi.id,
      judul: opsi.judul,
      onSelesai: opsi.onSelesai,
    });
  }

  // Keluar akun atau peran berubah: dialog ditutup, isian dibuang.
  function reset() {
    sedangKirim = false;
    terbuka = false;
    onSelesai = null;
    if (dlg) {
      dlg.hidden = true;
      elNama.value = "";
      elHarga.value = "";
      elJudulIn.value = "";
      setGalat(elGalat, "");
    }
  }

  // Esc: menutup dialog ini saja. stopImmediatePropagation supaya belanja.js (dimuat sesudah ini) tidak ikut menutup layar Belanja.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !terbuka) return;
    e.stopImmediatePropagation();
    tutup();
  });

  var keluarYa = document.getElementById("keluar-ya");
  if (keluarYa) keluarYa.addEventListener("click", reset);

  new MutationObserver(function () {
    if (layarUtama.hidden) reset();
  }).observe(layarUtama, { attributes: true, attributeFilter: ["hidden"] });

  new MutationObserver(function () {
    if (navOwner.hidden) reset();
  }).observe(navOwner, { attributes: true, attributeFilter: ["hidden"] });

  window.KedaiBelanjaEdit = Object.freeze({
    ubahItem: ubahItem,
    batalItem: batalItem,
    ubahJudul: ubahJudul,
    reset: reset,
  });
})();
