/* ============================================================
   FOCUS FLOW - POMODORO TIMER
   Nama file: pomodoro.js

   FUNGSI UTAMA:
   1. Mengambil pengaturan waktu dari Firebase Settings.
   2. Menjalankan hitung mundur waktu fokus.
   3. Menjalankan waktu istirahat pendek.
   4. Menjalankan waktu istirahat panjang.
   5. Memberikan istirahat panjang setiap 4 sesi fokus.
   6. Menyediakan tombol Mulai, Jeda, dan Reset.
   7. Berpindah sesi secara otomatis.
   8. Menyimpan riwayat fokus ke Firebase.

   CATATAN:
   - Durasi yang diatur pengguna menggunakan menit.
   - Hitung mundur timer menggunakan detik.
   - Riwayat fokus disimpan berdasarkan akun pengguna.
   ============================================================ */


/* ============================================================
   BAGIAN 1: MENGHUBUNGKAN FIREBASE
   ============================================================ */

// Mengambil auth untuk mengetahui siapa pengguna yang login.
// db digunakan untuk mengambil dan menyimpan data di Firestore.
import { auth, db } from "./firebase.js";


// Mengambil fungsi yang diperlukan untuk mengelola data Firebase.
import {
    collection,
    addDoc,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


// Mengambil fungsi untuk mengetahui perubahan status login pengguna.
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";



/* ============================================================
   BAGIAN 2: MENGAMBIL ELEMEN DARI HTML
   ============================================================ */

// timerDisplay digunakan untuk mengambil tempat angka timer.
// Contohnya, bagian HTML yang menampilkan angka 25:00.
const timerDisplay = document.getElementById("timer-display");


// timerMode digunakan untuk mengambil tempat nama sesi.
// Contohnya, tulisan Waktu Fokus atau Short Break.
const timerMode = document.getElementById("timer-mode");


// startButton digunakan untuk mengambil tombol Mulai.
// Tombol ini digunakan untuk menjalankan hitung mundur.
const startButton = document.getElementById("start-timer");


// pauseButton digunakan untuk mengambil tombol Jeda.
// Tombol ini digunakan untuk menghentikan timer sementara.
const pauseButton = document.getElementById("pause-timer");


// resetButton digunakan untuk mengambil tombol Reset.
// Tombol ini digunakan untuk mengembalikan waktu ke awal sesi.
const resetButton = document.getElementById("reset-timer");



/* ============================================================
   BAGIAN 3: DURASI DEFAULT POMODORO
   ============================================================ */

// DEFAULT_FOCUS_DURATION menyimpan waktu fokus bawaan.
// Jika pengguna belum mengatur waktu sendiri, sistem memakai 25 menit.
const DEFAULT_FOCUS_DURATION = 25;


// DEFAULT_SHORT_BREAK_DURATION menyimpan waktu istirahat pendek bawaan.
// Jika belum diatur, pengguna mendapatkan waktu istirahat 5 menit.
const DEFAULT_SHORT_BREAK_DURATION = 5;


// DEFAULT_LONG_BREAK_DURATION menyimpan waktu istirahat panjang bawaan.
// Jika belum diatur, pengguna mendapatkan waktu istirahat 15 menit.
const DEFAULT_LONG_BREAK_DURATION = 15;


// FOCUS_SESSIONS_BEFORE_LONG_BREAK menentukan jumlah sesi fokus.
// Setelah 4 sesi fokus selesai, sistem memberikan Long Break.
const FOCUS_SESSIONS_BEFORE_LONG_BREAK = 4;



/* ============================================================
   BAGIAN 4: VARIABEL UTAMA TIMER
   ============================================================ */

// focusDuration menyimpan lama waktu fokus yang dipilih pengguna.
// Nilainya akan diambil dari halaman Settings.
let focusDuration = DEFAULT_FOCUS_DURATION;


// shortBreakDuration menyimpan lama waktu istirahat pendek.
// Nilainya juga bisa berubah sesuai pengaturan pengguna.
let shortBreakDuration = DEFAULT_SHORT_BREAK_DURATION;


// longBreakDuration menyimpan lama waktu istirahat panjang.
// Nilainya diambil dari pengaturan Pomodoro di Settings.
let longBreakDuration = DEFAULT_LONG_BREAK_DURATION;


// timerInterval digunakan untuk menyimpan proses hitung mundur.
// Jika nilainya null, berarti timer sedang tidak berjalan.
// Jika timer berjalan, variabel ini menyimpan ID intervalnya.
let timerInterval = null;


// isFocusSession digunakan untuk mengetahui sesi yang sedang berjalan.
// true berarti pengguna sedang fokus.
// false berarti pengguna sedang dalam waktu istirahat.
let isFocusSession = true;


// isLongBreak digunakan untuk membedakan jenis waktu istirahat.
// true berarti sedang Long Break.
// false berarti bukan Long Break.
let isLongBreak = false;


// completedFocusSessions digunakan untuk menghitung sesi fokus selesai.
// Setiap kali satu sesi fokus selesai, jumlahnya bertambah satu.
// Setelah mencapai empat sesi, hitungannya kembali ke nol.
let completedFocusSessions = 0;


// secondsRemaining menyimpan sisa waktu timer dalam satuan detik.
// Contohnya, 25 menit akan disimpan sebagai 1500 detik.
// Nilainya akan berkurang satu setiap detik.
let secondsRemaining = focusDuration * 60;


// activeSessionDurationSeconds menyimpan durasi awal sesi yang berjalan.
// Data ini digunakan untuk mencatat berapa lama sesi berlangsung.
let activeSessionDurationSeconds = focusDuration * 60;


// currentUser menyimpan informasi akun yang sedang login.
// Informasi ini diperlukan agar riwayat belajar masuk ke akun yang benar.
let currentUser = null;


// isSwitchingSession digunakan untuk mencegah sistem berpindah sesi
// berkali-kali secara bersamaan ketika timer mencapai nol.
let isSwitchingSession = false;



/* ============================================================
   BAGIAN 5: MENGAMBIL PENGATURAN DARI FIREBASE
   ============================================================ */

// Fungsi loadPomodoroSettings digunakan untuk mengambil durasi
// fokus dan istirahat yang sudah diatur pengguna di halaman Settings.
//
// Parameter user berisi informasi akun pengguna yang sedang login.
async function loadPomodoroSettings(user) {

    // Jika belum ada pengguna yang login,
    // sistem menggunakan durasi bawaan.
    if (!user) {

        focusDuration = DEFAULT_FOCUS_DURATION;

        shortBreakDuration = DEFAULT_SHORT_BREAK_DURATION;

        longBreakDuration = DEFAULT_LONG_BREAK_DURATION;

        return;

    }


    try {

        // settingsRef menunjukkan lokasi pengaturan pengguna.
        // Setiap pengguna memiliki tempat penyimpanan sendiri.
        const settingsRef = doc(
            db,
            "users",
            user.uid,
            "settings",
            "preferences"
        );


        // settingsSnapshot menyimpan hasil pengambilan data Settings.
        const settingsSnapshot = await getDoc(settingsRef);


        // Memeriksa apakah data pengaturan pengguna tersedia.
        if (settingsSnapshot.exists()) {

            // settingsData menyimpan isi pengaturan pengguna.
            // Dari sini sistem bisa membaca durasi Pomodoro.
            const settingsData = settingsSnapshot.data();


            // Mengambil waktu fokus dari Firebase.
            // Number digunakan agar nilainya berbentuk angka.
            // Jika datanya kosong, sistem memakai waktu bawaan.
            focusDuration = Number(
                settingsData.focusDuration
            ) || DEFAULT_FOCUS_DURATION;


            // Mengambil waktu istirahat pendek dari Firebase.
            shortBreakDuration = Number(
                settingsData.shortBreakDuration
            ) || DEFAULT_SHORT_BREAK_DURATION;


            // Mengambil waktu istirahat panjang dari Firebase.
            longBreakDuration = Number(
                settingsData.longBreakDuration
            ) || DEFAULT_LONG_BREAK_DURATION;


            // Menampilkan informasi pengaturan di Console.
            console.log("Pengaturan Pomodoro berhasil diambil.");

            console.log("Durasi Fokus:", focusDuration);

            console.log("Durasi Short Break:", shortBreakDuration);

            console.log("Durasi Long Break:", longBreakDuration);


        } else {

            // Jika pengguna belum memiliki data Settings,
            // sistem menggunakan durasi bawaan.

            focusDuration = DEFAULT_FOCUS_DURATION;

            shortBreakDuration = DEFAULT_SHORT_BREAK_DURATION;

            longBreakDuration = DEFAULT_LONG_BREAK_DURATION;


            console.warn(
                "Pengaturan belum tersedia. Menggunakan durasi default."
            );

        }


    } catch (error) {

        // error menyimpan informasi kesalahan jika Firebase gagal dibaca.
        console.error(
            "Gagal mengambil pengaturan Pomodoro:",
            error
        );


        // Jika terjadi kesalahan, sistem tetap bisa berjalan
        // menggunakan durasi bawaan.
        focusDuration = DEFAULT_FOCUS_DURATION;

        shortBreakDuration = DEFAULT_SHORT_BREAK_DURATION;

        longBreakDuration = DEFAULT_LONG_BREAK_DURATION;

    }

}



/* ============================================================
   BAGIAN 6: MEMANTAU STATUS LOGIN PENGGUNA
   ============================================================ */

// onAuthStateChanged digunakan untuk mengetahui
// apakah pengguna sudah login atau keluar dari akun.
//
// user berisi informasi akun yang sedang aktif.
onAuthStateChanged(auth, async (user) => {

    // Menyimpan akun yang sedang login.
    // Informasi ini diperlukan untuk menyimpan riwayat belajar.
    currentUser = user;


    // Mengambil durasi Pomodoro milik pengguna dari Firebase.
    await loadPomodoroSettings(user);


    // Jika pengguna sedang berada di sesi fokus
    // dan timer belum berjalan, perbarui durasi awalnya.
    if (isFocusSession && timerInterval === null) {

        // Mengubah menit menjadi detik.
        secondsRemaining = focusDuration * 60;

        // Menyimpan durasi awal sesi fokus dalam detik.
        activeSessionDurationSeconds = focusDuration * 60;

    }


    // Memperbarui angka dan nama sesi pada halaman.
    updateDisplay();


    // Memperbarui kondisi tombol Mulai dan Jeda.
    updateButtonState();

});



/* ============================================================
   BAGIAN 7: MENAMPILKAN WAKTU DAN NAMA SESI
   ============================================================ */

// Fungsi updateDisplay digunakan untuk memperbarui
// tampilan angka timer dan nama sesi pada halaman.
function updateDisplay() {

    // minutes digunakan untuk mengambil jumlah menit tersisa.
    // Math.floor membulatkan hasil ke bawah.
    const minutes = Math.floor(
        secondsRemaining / 60
    );


    // seconds digunakan untuk mengambil sisa detik.
    // Operator % mengambil sisa hasil pembagian.
    const seconds = secondsRemaining % 60;


    // formattedMinutes mengubah angka menit menjadi dua digit.
    // Contohnya angka 5 akan ditampilkan menjadi 05.
    const formattedMinutes = String(
        minutes
    ).padStart(2, "0");


    // formattedSeconds mengubah angka detik menjadi dua digit.
    // Contohnya angka 9 akan ditampilkan menjadi 09.
    const formattedSeconds = String(
        seconds
    ).padStart(2, "0");


    // Memeriksa apakah tempat angka timer tersedia di HTML.
    if (timerDisplay) {

        // Menampilkan waktu dengan format menit:detik.
        // Contohnya 25:00 atau 04:09.
        timerDisplay.textContent =
            `${formattedMinutes}:${formattedSeconds}`;

    }


    // Memeriksa apakah tempat nama sesi tersedia di HTML.
    if (timerMode) {

        // Jika sedang fokus, tampilkan Waktu Fokus.
        if (isFocusSession) {

            timerMode.textContent = "Waktu Fokus";

        }

        // Jika bukan fokus dan merupakan istirahat panjang,
        // tampilkan nama Long Break.
        else if (isLongBreak) {

            timerMode.textContent = "Long Break";

        }

        // Jika bukan fokus dan bukan istirahat panjang,
        // berarti pengguna sedang Short Break.
        else {

            timerMode.textContent = "Short Break";

        }

    }

}



/* ============================================================
   BAGIAN 8: MENGATUR STATUS TOMBOL
   ============================================================ */

// Fungsi updateButtonState digunakan untuk mengatur
// tombol mana yang bisa ditekan sesuai kondisi timer.
function updateButtonState() {

    // Memeriksa apakah tombol Mulai tersedia.
    if (startButton) {

        // Tombol Mulai dinonaktifkan jika timer sedang berjalan.
        // Jika timer berhenti, tombol Mulai bisa digunakan.
        startButton.disabled =
            timerInterval !== null;

    }


    // Memeriksa apakah tombol Jeda tersedia.
    if (pauseButton) {

        // Tombol Jeda hanya bisa digunakan ketika timer berjalan.
        pauseButton.disabled =
            timerInterval === null;

    }

}



/* ============================================================
   BAGIAN 9: MENYIMPAN RIWAYAT FOKUS KE FIREBASE
   ============================================================ */

// Fungsi saveFocusHistory digunakan untuk menyimpan
// catatan sesi fokus yang berhasil diselesaikan.
async function saveFocusHistory() {

    // user mengambil informasi akun yang sedang aktif.
    // Jika currentUser kosong, sistem mencoba mengambil akun
    // langsung dari Firebase Authentication.
    const user = currentUser || auth.currentUser;


    // Jika tidak ada akun yang login,
    // riwayat tidak bisa disimpan ke akun pengguna.
    if (!user) {

        console.warn(
            "Riwayat tidak disimpan karena pengguna belum login."
        );

        return false;

    }


    try {

        // historyRef menunjukkan tempat penyimpanan riwayat belajar.
        // Setiap pengguna memiliki koleksi riwayat sendiri.
        const historyRef = collection(
            db,
            "users",
            user.uid,
            "studyHistory"
        );


        // Menambahkan catatan sesi fokus baru ke Firebase.
        await addDoc(historyRef, {

            // Menandakan bahwa riwayat ini merupakan sesi fokus.
            sessionType: "focus",

            // Menyimpan durasi sesi fokus dalam satuan menit.
            durationMinutes:
                activeSessionDurationSeconds / 60,

            // Mencatat waktu penyimpanan berdasarkan waktu server.
            createdAt: serverTimestamp()

        });


        // Memberikan informasi bahwa riwayat berhasil disimpan.
        console.log(
            "Riwayat fokus berhasil disimpan."
        );


        // Mengembalikan nilai true karena penyimpanan berhasil.
        return true;


    } catch (error) {

        // Menampilkan informasi jika penyimpanan gagal.
        console.error(
            "Gagal menyimpan riwayat fokus:",
            error
        );


        // Mengembalikan nilai false karena penyimpanan gagal.
        return false;

    }

}



/* ============================================================
   BAGIAN 10: MENENTUKAN SESI BERIKUTNYA
   ============================================================ */

// Fungsi switchSession digunakan untuk berpindah
// dari sesi fokus ke istirahat atau sebaliknya.
async function switchSession() {

    // Jika sistem sedang berpindah sesi,
    // hentikan proses agar tidak berjalan dua kali.
    if (isSwitchingSession) {

        return;

    }


    // Menandakan bahwa proses perpindahan sesi sedang berjalan.
    isSwitchingSession = true;


    try {

        // finishedFocusSession digunakan untuk mengetahui
        // apakah sesi yang baru selesai adalah sesi fokus.
        const finishedFocusSession = isFocusSession;


        // Jika sesi yang selesai adalah sesi fokus,
        // simpan riwayatnya ke Firebase.
        if (finishedFocusSession) {

            await saveFocusHistory();


            // Menambah jumlah sesi fokus yang sudah selesai.
            completedFocusSessions++;

        }


        // Memeriksa apakah sesi yang selesai merupakan sesi fokus.
        if (finishedFocusSession) {

            // Jika jumlah sesi fokus sudah mencapai empat,
            // pengguna mendapatkan istirahat panjang.
            if (
                completedFocusSessions >=
                FOCUS_SESSIONS_BEFORE_LONG_BREAK
            ) {

                // Mengubah status menjadi sesi istirahat.
                isFocusSession = false;

                // Memberi tanda bahwa istirahatnya adalah Long Break.
                isLongBreak = true;


                // Mengubah durasi Long Break dari menit ke detik.
                secondsRemaining =
                    longBreakDuration * 60;


                // Menyimpan durasi awal Long Break.
                activeSessionDurationSeconds =
                    longBreakDuration * 60;


                // Mengulang hitungan sesi fokus dari awal.
                completedFocusSessions = 0;


            } else {

                // Jika belum mencapai empat sesi,
                // pengguna mendapatkan istirahat pendek.

                // Mengubah status menjadi sesi istirahat.
                isFocusSession = false;

                // Memberi tanda bahwa istirahatnya bukan Long Break.
                isLongBreak = false;


                // Mengubah durasi Short Break menjadi detik.
                secondsRemaining =
                    shortBreakDuration * 60;


                // Menyimpan durasi awal Short Break.
                activeSessionDurationSeconds =
                    shortBreakDuration * 60;

            }


        } else {

            // Jika sesi istirahat selesai,
            // sistem kembali ke sesi fokus.

            // Mengubah status menjadi sesi fokus.
            isFocusSession = true;

            // Menghapus tanda Long Break.
            isLongBreak = false;


            // Mengatur waktu fokus sesuai Settings pengguna.
            secondsRemaining =
                focusDuration * 60;


            // Menyimpan durasi awal sesi fokus.
            activeSessionDurationSeconds =
                focusDuration * 60;

        }


        // Memperbarui tampilan agar nama sesi dan waktunya berubah.
        updateDisplay();


    } finally {

        // Menandakan bahwa proses perpindahan sesi sudah selesai.
        // Dengan begitu, sistem bisa melakukan perpindahan berikutnya.
        isSwitchingSession = false;

    }


    // Langsung menjalankan sesi berikutnya secara otomatis.
    startTimer();

}



/* ============================================================
   BAGIAN 11: MENJALANKAN TIMER
   ============================================================ */

// Fungsi startTimer digunakan untuk menjalankan hitung mundur.
function startTimer() {

    // Jika timer sudah berjalan, jangan membuat hitung mundur baru.
    if (timerInterval !== null) {

        return;

    }


    // Jika waktu sudah habis, timer tidak bisa dijalankan.
    if (secondsRemaining <= 0) {

        return;

    }


    // Memastikan angka timer sudah diperbarui sebelum berjalan.
    updateDisplay();


    // setInterval menjalankan perintah setiap satu detik.
    // Hasilnya disimpan di timerInterval agar bisa dihentikan.
    timerInterval = setInterval(async () => {

        // Mengurangi sisa waktu sebanyak satu detik.
        secondsRemaining--;


        // Memperbarui angka yang terlihat di halaman.
        updateDisplay();


        // Memeriksa apakah sisa waktu sudah mencapai nol.
        if (secondsRemaining <= 0) {

            // Memastikan waktu tidak menjadi angka negatif.
            secondsRemaining = 0;


            // Menampilkan angka 00:00.
            updateDisplay();


            // Menghentikan proses hitung mundur.
            clearInterval(timerInterval);


            // Mengosongkan timerInterval sebagai tanda timer berhenti.
            timerInterval = null;


            // Memperbarui kondisi tombol.
            updateButtonState();


            // Memindahkan timer ke sesi berikutnya.
            await switchSession();

        }

    }, 1000);


    // Memperbarui tombol setelah timer mulai berjalan.
    updateButtonState();

}



/* ============================================================
   BAGIAN 12: MENJEDA TIMER
   ============================================================ */

// Fungsi pauseTimer digunakan untuk menghentikan
// hitung mundur sementara tanpa menghapus sisa waktunya.
function pauseTimer() {

    // Memeriksa apakah timer sedang berjalan.
    if (timerInterval !== null) {

        // Menghentikan hitung mundur yang sedang berjalan.
        clearInterval(timerInterval);


        // Mengosongkan penanda timer berjalan.
        // Sisa waktu tetap tersimpan di secondsRemaining.
        timerInterval = null;

    }


    // Memperbarui kondisi tombol setelah timer dijeda.
    updateButtonState();

}



/* ============================================================
   BAGIAN 13: MENGATUR ULANG TIMER
   ============================================================ */

// Fungsi resetTimer digunakan untuk mengembalikan
// waktu ke durasi awal sesi yang sedang dipilih.
function resetTimer() {

    // Jika timer sedang berjalan, hentikan terlebih dahulu.
    if (timerInterval !== null) {

        clearInterval(timerInterval);

        timerInterval = null;

    }


    // Memeriksa apakah pengguna sedang berada di sesi fokus.
    if (isFocusSession) {

        // Mengembalikan waktu fokus sesuai Settings.
        secondsRemaining = focusDuration * 60;

        // Mengembalikan durasi awal sesi fokus.
        activeSessionDurationSeconds =
            focusDuration * 60;

    }


    // Jika sedang Long Break, kembalikan waktu istirahat panjang.
    else if (isLongBreak) {

        secondsRemaining = longBreakDuration * 60;

        activeSessionDurationSeconds =
            longBreakDuration * 60;

    }


    // Jika bukan fokus dan bukan Long Break,
    // berarti pengguna sedang Short Break.
    else {

        secondsRemaining = shortBreakDuration * 60;

        activeSessionDurationSeconds =
            shortBreakDuration * 60;

    }


    // Memperbarui angka dan nama sesi pada halaman.
    updateDisplay();


    // Mengatur kembali kondisi tombol.
    updateButtonState();

}



/* ============================================================
   BAGIAN 14: MENGHUBUNGKAN TOMBOL DENGAN FUNGSI
   ============================================================ */

// Jika tombol Mulai ditemukan di HTML,
// ketika tombol ditekan, fungsi startTimer dijalankan.
if (startButton) {

    startButton.addEventListener(
        "click",
        startTimer
    );

}


// Jika tombol Jeda ditemukan di HTML,
// ketika tombol ditekan, fungsi pauseTimer dijalankan.
if (pauseButton) {

    pauseButton.addEventListener(
        "click",
        pauseTimer
    );

}


// Jika tombol Reset ditemukan di HTML,
// ketika tombol ditekan, fungsi resetTimer dijalankan.
if (resetButton) {

    resetButton.addEventListener(
        "click",
        resetTimer
    );

}



/* ============================================================
   BAGIAN 15: MENAMPILKAN KONDISI AWAL TIMER
   ============================================================ */

// Menampilkan angka timer ketika halaman pertama kali dibuka.
updateDisplay();


// Mengatur kondisi tombol Mulai dan Jeda pada awal halaman.
updateButtonState();



/* ============================================================
   SELESAI - FOCUS FLOW POMODORO TIMER

   RINGKASAN FITUR:
   - Durasi fokus diambil dari Firebase Settings.
   - Durasi Short Break diambil dari Firebase Settings.
   - Durasi Long Break diambil dari Firebase Settings.
   - Long Break diberikan setiap empat sesi fokus.
   - Timer memiliki tombol Mulai, Jeda, dan Reset.
   - Timer berpindah sesi secara otomatis.
   - Riwayat sesi fokus disimpan ke Firestore.

   ============================================================ */