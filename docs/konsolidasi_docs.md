## Prompt

```
Ini sesi STRATEGI, bukan sesi kode. Tugasmu hari ini: mengonsolidasi satu dokumen (nama berkasnya disebut ketua di awal sesi) supaya isinya hanya keadaan terakhir DAN ukurannya jauh lebih kecil.

Latar: dokumen docs/ menumpuk blok catatan susulan dan handoff yang saling menimpa ("yang paling akhir menang"). Pembaca harus merangkai urutan blok untuk tahu keadaan sekarang, dan dokumen yang gemuk membuat sesi kehilangan konteks. Keputusan ketua: yang tercatat cukup yang akhir, dan dokumen harus ramping. Konsolidasi dilakukan di sesi strategi; aturan "docs/ tidak dirapikan di sesi kode" (AGENTS.md bagian 2, aturan 7) tidak berubah. Berkas asli sudah disalin ketua ke `/docs/archive/`; jangan diubah dan jangan dirujuk di dokumen baru.

TUJUAN UKURAN
Targetnya dokumen baru sekitar separuh dari ukuran asli atau lebih kecil. Di akhir, laporkan ukuran sebelum dan sesudah (perkiraan jumlah baris atau KB). Bila hasilnya hanya turun sedikit, katakan jujur dan sebutkan bagian mana yang masih gemuk beserta alasannya.

ATURAN KERAS
1. Tidak ada kode, SQL, atau pengaturan yang diubah, dijalankan, atau disarankan untuk dijalankan. Hanya dokumen.
2. Jangan mengarang. Isi hanya dari berkas yang dilampirkan. Keputusan tanpa alasan tertulis tetap "alasan belum tercatat". Hal yang belum terbukti tetap "belum terbukti" atau "belum dicek". Jangan mengubah "belum" menjadi "sudah" tanpa dasar tertulis di berkas atau di jawaban ketua.
3. Bagian-bagian dokumen TIDAK BOLEH dihilangkan: judul dan nomor bagian tetap ada, karena dirujuk dokumen lain dan sheet TODO. Isinya boleh dirampingkan, bagiannya tidak boleh hilang. Nomor keputusan (MG1, AN6, BT7, dan sejenisnya) dan nomor butir sheet (MGR.24, SEC-50a, dan sejenisnya) tidak diubah atau dinomori ulang.
4. Dokumen baru TIDAK BOLEH memuat log atau jejak perubahan. Tulis seolah versi lama tidak pernah ada. Dilarang: kalimat seperti "dipangkas pada ...", "diringkas di konsolidasi ...", "sebelumnya ...", "tidak berlaku lagi", blok riwayat, hash commit, atau rujukan ke berkas arsip. Tulis isinya langsung dalam keadaan terakhir, secara natural. Bagian Catatan Susulan tetap ada sebagai bagian kosong dengan format standarnya (`_(belum ada blok)_`).
5. HANDOFF. Jumlah dan nomor handoff TETAP (10 handoff tetap 10), begitu juga judul `### Handoff #N | tanggal | PIC` dan bagian Handoff dan Catatan. Isinya boleh diringkas besar-besaran:
   a. Handoff yang tugasnya sudah selesai (semua handoff kecuali yang terakhir): ringkas menjadi 3 sampai 5 baris saja. Isi yang dipertahankan: tugas dan hasil akhirnya, keputusan baru yang MASIH berlaku (lengkap dengan "alasan belum tercatat" bila itu yang tertulis), dan nama berkas hanya bila dirujuk bagian lain. Buang: daftar berkas yang berubah secara rinci, hasil tes, bukti, nama commit, dan "Saran giliran berikutnya".
   b. Keputusan di handoff lama yang sudah tertimpa keputusan yang lebih baru: buang, cukup keadaan akhirnya (di bagian utama).
   c. Sebuah butir "Belum beres" ditulis sekali, di handoff tempat ia pertama muncul. Handoff berikutnya tidak mengulangnya kecuali ada kemajuan atau perubahan status. Butir yang sudah beres dihapus; hasilnya cukup ada di bagian atau handoff yang menyelesaikannya. Sebuah butir dianggap beres hanya bila ada blok atau handoff lebih baru yang tertulis menyelesaikannya, atau ketua menyatakannya selesai; ragu berarti anggap belum beres.
   d. HANDOFF TERAKHIR dipertahankan lebih lengkap dan memuat daftar semua butir yang masih terbuka, satu baris per butir, karena sesi berikutnya membaca handoff paling akhir (AGENTS.md bagian 11). Bagian "Saran giliran berikutnya" hanya ada di handoff terakhir.
6. "Belum terbukti", "alasan belum tercatat", "menunggu OK", dan "ditunda" yang masih terbuka tidak boleh hilang. Konsolidasi hanya membuang yang sudah tertimpa atau sudah selesai dan tidak dirujuk lagi.
7. Bila dua teks bertentangan, yang paling akhir menang. Bila urutan atau tanggalnya tidak jelas, tanyakan ke ketua, jangan menebak.
8. Data pribadi nyata, rahasia, kunci, dan token tidak ditulis (AGENTS.md bagian 7).
9. Ikuti gaya dokumen yang ada: bahasa Indonesia, kalimat pendek, tabel keputusan bernomor, tanpa tanda pisah panjang.
10. Jangan menyentuh dokumen lain. Bila dokumen lain merujuk teks yang berubah, daftarkan di akhir sebagai butir "perlu blok susulan di berkas X".
11. Bila berkasnya `AGENTS.md`: ekstra hati-hati. Semua aturan harus utuh. Tampilkan perubahan per bagian dan tunggu persetujuan tiap bagian.
12. Buang narasi kegiatan commit, push, `[skip ci]`, logout, dan menutup browser dari isi dokumen. Sebut commit hanya bila itu bukti teknis yang dirujuk, tanpa narasi kegiatannya. Aturan git yang memang bagian dari AGENTS.md (misalnya bagian 8) tetap utuh. Satu pengecualian: perubahan kode atau berkas aplikasi yang berhenti di tengah (sudah diubah tetapi belum di-commit atau di-push) wajib disebut lengkap dengan nama berkasnya.

CARA BERTANYA (supaya ketua tidak merasa diaudit)
- Baca dulu semua yang bisa dijawab dari berkas dan sheet (screenshot) yang dilampirkan. Jangan menanyakan hal yang sudah tertulis.
- Tanyakan hanya hal yang benar-benar ambigu dan berisiko: dua teks bertentangan tanpa tanggal, atau butir terbuka yang tidak jelas sudah beres atau belum. Maksimal sekitar 3 pertanyaan, dikumpulkan dalam satu giliran, masing-masing dengan pilihan jawaban singkat dan rekomendasimu.
- Bila ketua berkata "semua sudah selesai" atau screenshot sheet menunjukkan 100%, anggap tugas sheet selesai. Butir "belum terbukti" yang bukan tugas sheet tetap dicatat satu baris di handoff terakhir, tanpa meminta ketua menambah butir sheet baru.
- Jangan membuat ketua mengonfirmasi butir satu per satu.

LANGKAH
Langkah 1 (baca dan rencana, satu giliran). Baca seluruh berkas. Laporkan singkat: struktur bagian, jumlah blok susulan dan handoff, rentang tanggal, dan ukuran perkiraan. Lalu langsung beri RENCANA dalam bahasa mudah: (a) per bagian, apa yang diperbarui, dirampingkan, atau dibiarkan; (b) tabel pertentangan: teks lama | ditimpa oleh | isi akhir; (c) perlakuan handoff: mana yang diringkas, butir terbuka yang dipertahankan di handoff terakhir; (d) yang dibuang dan alasannya; (e) rujukan dari dokumen lain yang terlihat di lampiran (jangan menebak yang tidak terlampir; cukup minta ketua menyebut bila ada lagi); (f) pertanyaan seperlunya sesuai bagian CARA BERTANYA. Tunggu persetujuan ketua.
Langkah 2 (tulis). Tulis versi baru, bagian demi bagian bila panjang, sesuai aturan 3 sampai 5 dan 12. Header memakai pola dokumen yang ada: "Versi X.Y (tanggal), hasil sesi strategi". Kirim sebagai berkas md utuh.
Langkah 3 (periksa dan serahkan). Daftar centang: semua bagian dan nomor bagian masih ada; semua nomor keputusan lama masih ada atau tercatat dibuang beserta alasannya; semua butir terbuka dari rencana ada di versi baru; jumlah dan nomor handoff sama dengan aslinya; tidak ada butir "Belum beres" yang terbawa berulang; handoff terakhir memuat semua butir terbuka; tidak ada narasi commit atau push; tidak ada kalimat bernada log; tidak ada fakta baru tanpa sumber; ukuran sebelum dan sesudah dilaporkan. Lalu daftar dokumen lain yang perlu blok susulan, dan ringkasan perubahan (maksimal sepuluh baris) untuk dicatat ketua di luar dokumen.

Mulai dari Langkah 1.
```

---

## Blok keputusan ketua (draf, untuk `AGENTS.md` bagian 12)

```markdown
### 2026-11-21: Keputusan ketua: dokumen `docs/` boleh dikonsolidasi di sesi strategi, handoff lama diringkas

- **Alasan:** dokumen yang menggemuk membuat sesi kehilangan konteks. Konsolidasi dilakukan agar dokumen ramping dan hanya memuat keadaan terakhir.
- **Jalur:** konsolidasi satu dokumen per sesi, **di sesi strategi**, setelah isi dokumen stabil. Aturan 7 (bagian 2) tidak berubah: sesi kode tetap tidak merapikan dokumen dan hanya menambah blok susulan.
- **Rencana dulu:** AI menjelaskan rencana (per bagian, pertentangan, perlakuan handoff, yang dibuang) dan menunggu persetujuan ketua sebelum menulis. Pertanyaan ke ketua dibatasi dan dikumpulkan dalam satu giliran.
- **Yang dipertahankan:** judul dan nomor bagian, nomor keputusan, dan nomor butir sheet (dirujuk dokumen lain dan sheet TODO); butir "belum terbukti", "alasan belum tercatat", "menunggu OK", dan "ditunda" yang masih terbuka.
- **Handoff:** jumlah, nomor, dan judul handoff tetap. Handoff yang tugasnya sudah selesai diringkas menjadi sekitar 3 sampai 5 baris (tugas dan hasil, keputusan yang masih berlaku); rincian berkas yang berubah, hasil tes, dan saran giliran berikutnya dibuang. Handoff terakhir tetap lengkap dan memuat daftar semua butir yang masih terbuka, satu baris per butir.
- **Narasi commit dan push:** tidak dimuat di isi dokumen. Pengecualian tetap: perubahan kode atau berkas aplikasi yang berhenti di tengah wajib disebut dengan nama berkasnya.
- **Hasil:** isi bagian utama langsung dalam keadaan terakhir, tanpa log atau jejak perubahan. Bagian Catatan Susulan dikosongkan. Berkas asli disalin ketua ke `docs/archive/` sebelum konsolidasi dan tidak dirujuk dari dokumen baru.
- **Pertentangan dengan catatan lama:** tidak ada yang dibatalkan; ini menambah jalur sesi strategi di samping aturan 7 dan melonggarkan perlakuan handoff lama. Yang paling akhir menang.
```
