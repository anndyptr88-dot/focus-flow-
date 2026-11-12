// ============================================================
// FOCUS FLOW - STUDY CHART
// ============================================================
//
// Fungsi:
// 1. Mengambil riwayat belajar dari Firebase.
// 2. Menghitung total menit fokus setiap hari.
// 3. Mengambil data 7 hari terakhir.
// 4. Menampilkan hasil dalam bentuk grafik batang.
//
// ============================================================


// ============================================================
// BAGIAN 1: MENGHUBUNGKAN STUDY CHART DENGAN FIREBASE
// ============================================================

// Mengambil autentikasi dan database dari firebase.js.
import { auth, db } from "./firebase.js";

// Mengambil fungsi Firestore versi 13.2.0.
// collection = menentukan lokasi koleksi.
// getDocs   = mengambil data.
// query     = membuat permintaan data.
// orderBy   = mengurutkan data.
import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// Mengambil fungsi untuk memantau status login.
// PENTING: Import ini hanya boleh ditulis satu kali.
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";


// ============================================================
// BAGIAN 2: MENGAMBIL ELEMEN HTML
// ============================================================

// Tempat untuk menampilkan pesan grafik.
const chartMessage =
    document.getElementById("study-chart-message");

// Tempat untuk menampilkan batang grafik.
const chartBars =
    document.getElementById("study-chart-bars");


// ============================================================
// BAGIAN 3: MEMBUAT FORMAT TANGGAL
// ============================================================

// Fungsi ini digunakan untuk mengubah tanggal
// menjadi format tahun-bulan-tanggal.
// Contoh hasil: 2026-11-07.

function getDateKey(date) {

    // Mengambil tahun dari tanggal.
    const year = date.getFullYear();

    // Mengambil bulan dan menambahkan angka nol jika perlu.
    const month = String(date.getMonth() + 1).padStart(2, "0");

    // Mengambil tanggal dan menambahkan angka nol jika perlu.
    const day = String(date.getDate()).padStart(2, "0");

    // Menggabungkan tahun, bulan, dan tanggal.
    return `${year}-${month}-${day}`;

}


// ============================================================
// BAGIAN 4: MEMANTAU STATUS LOGIN
// ============================================================

// Firebase memeriksa apakah pengguna sudah login.
onAuthStateChanged(auth, async (user) => {

    // Jika pengguna belum login.
    if (!user) {

        // Menampilkan pesan.
        if (chartMessage) {
            chartMessage.textContent =
                "Silakan login untuk melihat grafik belajar.";
        }

        // Mengosongkan grafik.
        if (chartBars) {
            chartBars.innerHTML = "";
        }

        return;
    }

    // Jika pengguna sudah login,
    // tampilkan grafik berdasarkan UID pengguna.
    await loadStudyChart(user.uid);

});


// ============================================================
// BAGIAN 5: MENGAMBIL DATA RIWAYAT BELAJAR
// ============================================================

async function loadStudyChart(userId) {

    // Memastikan elemen grafik tersedia.
    if (!chartMessage || !chartBars) {

        console.error(
            "Elemen grafik tidak ditemukan di HTML."
        );

        return;
    }

    // Menampilkan pesan pemuatan.
    chartMessage.textContent = "Memuat grafik belajar...";

    // Membersihkan grafik sebelumnya.
    chartBars.innerHTML = "";

    try {

        // Menentukan lokasi riwayat belajar pengguna.
        const historyRef = collection(
            db,
            "users",
            userId,
            "studyHistory"
        );

        // Mengurutkan data berdasarkan tanggal terbaru.
        const historyQuery = query(
            historyRef,
            orderBy("createdAt", "desc")
        );

        // Mengambil data dari Firebase.
        const querySnapshot = await getDocs(historyQuery);


        // ====================================================
        // BAGIAN 6: MENENTUKAN 7 HARI TERAKHIR
        // ====================================================

        // Mengambil tanggal hari ini.
        const today = new Date();

        // Mengatur waktu menjadi pukul 00.00.
        today.setHours(0, 0, 0, 0);

        // Menghitung tanggal awal, yaitu enam hari sebelum hari ini.
        const startDate = new Date(today);

        startDate.setDate(today.getDate() - 6);


        // ====================================================
        // BAGIAN 7: MENYIAPKAN DATA GRAFIK
        // ====================================================

        // Menyediakan tujuh tempat untuk menyimpan total menit.
        const dailyData = {};

        // Mengisi data awal untuk tujuh hari.
        for (let i = 0; i < 7; i++) {

            // Membuat tanggal untuk masing-masing hari.
            const date = new Date(startDate);

            date.setDate(startDate.getDate() + i);

            // Mengubah tanggal menjadi kunci.
            const dateKey = getDateKey(date);

            // Pada awalnya, total menit setiap hari adalah nol.
            dailyData[dateKey] = {
                date: date,
                minutes: 0
            };

        }


        // ====================================================
        // BAGIAN 8: MENGHITUNG MENIT FOKUS SETIAP HARI
        // ====================================================

        // Mengulang seluruh data riwayat dari Firebase.
        querySnapshot.forEach((documentSnapshot) => {

            // Mengambil isi dokumen.
            const history = documentSnapshot.data();

            // Memeriksa apakah tanggal tersedia.
            if (
                !history.createdAt ||
                typeof history.createdAt.toDate !== "function"
            ) {

                return;

            }

            // Mengubah waktu Firebase menjadi tanggal JavaScript.
            const sessionDate = history.createdAt.toDate();

            // Mendapatkan kunci tanggal sesi.
            const dateKey = getDateKey(sessionDate);

            // Mengambil durasi sesi.
            const duration =
                Number(history.durationMinutes) || 25;

            // Menambahkan durasi jika tanggal termasuk
            // dalam tujuh hari yang sedang ditampilkan.
            if (dailyData[dateKey]) {

                dailyData[dateKey].minutes += duration;

            }

        });


        // ====================================================
        // BAGIAN 9: MENENTUKAN NILAI TERTINGGI GRAFIK
        // ====================================================

        // Mengambil seluruh total menit harian.
        const dailyMinutes = Object.values(dailyData).map(
            (item) => item.minutes
        );

        // Menentukan nilai menit paling tinggi.
        const maxMinutes = Math.max(0, ...dailyMinutes);


        // ====================================================
        // BAGIAN 10: MENAMPILKAN PESAN GRAFIK
        // ====================================================

        // Memeriksa apakah ada sesi fokus selama tujuh hari.
        if (maxMinutes === 0) {

            chartMessage.textContent =
                "Belum ada sesi fokus dalam 7 hari terakhir.";

        } else {

            chartMessage.textContent =
                "Grafik menunjukkan total menit fokus setiap hari.";

        }


        // ====================================================
        // BAGIAN 11: MEMBUAT BATANG GRAFIK
        // ====================================================

        // Mengulang data setiap hari untuk membuat grafik.
        Object.values(dailyData).forEach((item) => {

            // Mengambil tanggal.
            const date = item.date;

            // Mengambil total menit fokus pada tanggal tersebut.
            const minutes = item.minutes;


            // ------------------------------------------------
            // MEMBUAT KOLOM HARI
            // ------------------------------------------------

            // Membuat elemen kolom untuk satu hari.
            const column = document.createElement("div");

            // Memberikan class CSS.
            column.className = "study-chart-column";


            // ------------------------------------------------
            // MEMBUAT AREA BATANG
            // ------------------------------------------------

            // Membuat tempat untuk nilai dan batang grafik.
            const barArea = document.createElement("div");

            barArea.className = "study-chart-bar-area";


            // ------------------------------------------------
            // MEMBUAT ANGKA DURASI
            // ------------------------------------------------

            // Membuat teks untuk menunjukkan jumlah menit.
            const value = document.createElement("span");

            value.className = "study-chart-value";

            // Menampilkan angka durasi.
            value.textContent = `${minutes}m`;


            // ------------------------------------------------
            // MENGHITUNG TINGGI BATANG
            // ------------------------------------------------

            // Jika ada data, tinggi batang dihitung berdasarkan
            // perbandingan menit hari tersebut dengan nilai tertinggi.
            // Jika belum ada data, tingginya nol.
            let barHeight = 0;

            if (maxMinutes > 0) {

                barHeight = (minutes / maxMinutes) * 100;

            }

            // Membuat elemen batang grafik.
            const bar = document.createElement("div");

            bar.className = "study-chart-bar";

            // Mengatur tinggi batang sesuai perhitungan.
            bar.style.height = `${barHeight}%`;

            // Menambahkan keterangan saat batang diarahkan kursor.
            bar.title = `${minutes} menit`;


            // ------------------------------------------------
            // MEMBUAT LABEL HARI
            // ------------------------------------------------

            // Membuat tulisan nama hari.
            const label = document.createElement("span");

            label.className = "study-chart-label";

            // Mengubah tanggal menjadi nama hari Indonesia.
            label.textContent = date.toLocaleDateString(
                "id-ID",
                {
                    weekday: "short"
                }
            );


            // ------------------------------------------------
            // MENYUSUN ELEMEN GRAFIK
            // ------------------------------------------------

            // Memasukkan angka ke area batang.
            barArea.appendChild(value);

            // Memasukkan batang ke area batang.
            barArea.appendChild(bar);

            // Memasukkan area batang ke kolom.
            column.appendChild(barArea);

            // Memasukkan nama hari ke kolom.
            column.appendChild(label);

            // Memasukkan kolom ke dalam grafik utama.
            chartBars.appendChild(column);

        });


    } catch (error) {

        // Menampilkan informasi kesalahan di Console.
        console.error(
            "Gagal memuat grafik produktivitas:",
            error
        );

        // Menampilkan pesan jika data gagal diambil.
        chartMessage.textContent =
            "Grafik gagal dimuat. Periksa koneksi dan Firebase.";

    }



}


// ============================================================
// SELESAI
// ============================================================
//
// Grafik produktivitas sekarang menampilkan:
// - Total menit fokus selama 7 hari terakhir.
// - Tujuh batang yang mewakili masing-masing hari.
// - Tinggi batang berdasarkan durasi fokus.
// - Data yang diambil dari Firebase.
//
// ============================================================
