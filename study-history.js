// ============================================================
// FOCUS FLOW - STUDY HISTORY
// ============================================================
//
// Fungsi:
// 1. Mengambil riwayat belajar dari Firebase.
// 2. Menampilkan kartu riwayat belajar.
// 3. Menghitung jumlah sesi fokus.
// 4. Menghitung total waktu fokus.
// 5. Menampilkan tanggal dan waktu sesi belajar.
//
// ============================================================


// ============================================================
// BAGIAN 1: MENGHUBUNGKAN FIREBASE
// ============================================================

// Mengambil autentikasi dan database dari firebase.js.
import { auth, db } from "./firebase.js";

// Mengambil fungsi Firestore dengan versi yang sama
// seperti versi Firebase di firebase.js.
import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// Mengambil fungsi Authentication dengan versi yang sama.
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";


// ============================================================
// BAGIAN 2: MENGAMBIL ELEMEN HTML
// ============================================================

// Tempat menampilkan daftar kartu riwayat belajar.
const studyHistoryList =
    document.getElementById("study-history-list");

// Tempat menampilkan jumlah sesi fokus.
const totalFocusSessions =
    document.getElementById("total-focus-sessions");

// Tempat menampilkan total waktu fokus.
const totalFocusMinutes =
    document.getElementById("total-focus-minutes");


// ============================================================
// BAGIAN 3: FUNGSI MENGATUR RINGKASAN AWAL
// ============================================================

function resetSummary() {

    // Mengembalikan jumlah sesi ke angka nol.
    if (totalFocusSessions) {
        totalFocusSessions.textContent = "0";
    }

    // Mengembalikan total waktu ke nol menit.
    if (totalFocusMinutes) {
        totalFocusMinutes.textContent = "0 menit";
    }

}


// ============================================================
// BAGIAN 4: MEMERIKSA STATUS LOGIN PENGGUNA
// ============================================================

// Memantau perubahan status login Firebase.
onAuthStateChanged(auth, async (user) => {

    // Jika pengguna belum login.
    if (!user) {

        // Mengatur ulang angka ringkasan.
        resetSummary();

        // Menampilkan pesan kepada pengguna.
        if (studyHistoryList) {
            studyHistoryList.innerHTML = `
                <p class="empty-history">
                    Silakan login untuk melihat riwayat belajar.
                </p>
            `;
        }

        return;
    }

    // Jika pengguna sudah login,
    // ambil riwayat belajar berdasarkan UID pengguna.
    await loadStudyHistory(user.uid);

});


// ============================================================
// BAGIAN 5: MENGAMBIL RIWAYAT DARI FIREBASE
// ============================================================

async function loadStudyHistory(userId) {

    // Memeriksa apakah tempat menampilkan riwayat tersedia.
    if (!studyHistoryList) {

        console.error(
            "Elemen study-history-list tidak ditemukan."
        );

        return;
    }

    // Menampilkan pesan saat data sedang dimuat.
    studyHistoryList.innerHTML = `
        <p class="loading-history">
            Memuat riwayat belajar...
        </p>
    `;

    try {

        // Menentukan lokasi penyimpanan riwayat di Firestore.
        const historyRef = collection(
            db,
            "users",
            userId,
            "studyHistory"
        );

        // Mengurutkan riwayat dari yang terbaru.
        const historyQuery = query(
            historyRef,
            orderBy("createdAt", "desc")
        );

        // Mengambil semua dokumen riwayat.
        const querySnapshot = await getDocs(historyQuery);


        // ====================================================
        // BAGIAN 6: MEMERIKSA APAKAH RIWAYAT KOSONG
        // ====================================================

        // Menghapus angka ringkasan sebelumnya.
        resetSummary();

        // Jika belum ada riwayat belajar.
        if (querySnapshot.empty) {

            // Menampilkan pesan bahwa riwayat masih kosong.
            studyHistoryList.innerHTML = `
                <p class="empty-history">
                    Belum ada riwayat belajar.
                    Mulai sesi fokus untuk mencatat aktivitasmu!
                </p>
            `;

            return;
        }


        // ====================================================
        // BAGIAN 7: MENGHITUNG PRODUKTIVITAS
        // ====================================================

        // Variabel untuk menghitung jumlah sesi.
        let sessionCount = 0;

        // Variabel untuk menghitung total menit belajar.
        let totalMinutes = 0;

        // Membersihkan daftar riwayat sebelum ditampilkan.
        studyHistoryList.innerHTML = "";

        // Mengulang setiap dokumen riwayat dari Firebase.
        querySnapshot.forEach((documentSnapshot) => {

            // Mengambil data dari dokumen.
            const history = documentSnapshot.data();

            // Mengambil durasi sesi.
            // Jika tidak ditemukan, gunakan 25 menit.
            const duration =
                Number(history.durationMinutes) || 25;

            // Menambahkan satu pada jumlah sesi.
            sessionCount++;

            // Menambahkan durasi ke total waktu belajar.
            totalMinutes += duration;


            // =================================================
            // BAGIAN 8: MENGUBAH TANGGAL DAN WAKTU
            // =================================================

            // Menentukan tulisan awal tanggal.
            let dateText = "Waktu tidak tersedia";

            // Memeriksa apakah tanggal tersedia.
            if (
                history.createdAt &&
                typeof history.createdAt.toDate === "function"
            ) {

                // Mengubah timestamp Firebase menjadi tanggal.
                const date = history.createdAt.toDate();

                // Mengatur format tanggal dan waktu Indonesia.
                dateText = date.toLocaleString("id-ID", {
                    dateStyle: "long",
                    timeStyle: "short"
                });

            }


            // =================================================
            // BAGIAN 9: MEMBUAT KARTU RIWAYAT
            // =================================================

            // Membuat elemen div untuk kartu riwayat.
            const historyCard = document.createElement("div");

            // Memberikan class CSS pada kartu.
            historyCard.className = "study-history-item";

            // Membuat judul kartu.
            const title = document.createElement("h3");

            // Mengisi judul kartu.
            title.textContent = "Sesi Fokus Selesai";

            // Membuat keterangan tanggal.
            const dateElement = document.createElement("p");

            // Memberikan class tanggal.
            dateElement.className = "study-history-date";

            // Mengisi tanggal dan waktu.
            dateElement.textContent = dateText;

            // Membuat keterangan durasi.
            const durationElement = document.createElement("p");

            // Memberikan class durasi.
            durationElement.className = "study-history-duration";

            // Mengisi durasi belajar.
            durationElement.textContent =
                `Durasi: ${duration} menit`;

            // Memasukkan judul ke dalam kartu.
            historyCard.appendChild(title);

            // Memasukkan tanggal ke dalam kartu.
            historyCard.appendChild(dateElement);

            // Memasukkan durasi ke dalam kartu.
            historyCard.appendChild(durationElement);

            // Memasukkan kartu ke daftar riwayat.
            studyHistoryList.appendChild(historyCard);

        });


        // ====================================================
        // BAGIAN 10: MENAMPILKAN HASIL RINGKASAN
        // ====================================================

        // Menampilkan jumlah sesi fokus yang selesai.
        if (totalFocusSessions) {

            totalFocusSessions.textContent = sessionCount;

        }

        // Menampilkan total menit belajar.
        if (totalFocusMinutes) {

            totalFocusMinutes.textContent =
                `${totalMinutes} menit`;

        }

    } catch (error) {

        // Menampilkan informasi kesalahan di Console.
        console.error(
            "Gagal mengambil riwayat belajar:",
            error
        );

        // Menampilkan pesan kesalahan pada halaman.
        studyHistoryList.innerHTML = `
            <p class="empty-history">
                Riwayat belajar gagal dimuat.
                Silakan coba lagi.
            </p>
        `;

    }



}
