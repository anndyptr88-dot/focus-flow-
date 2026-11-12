/* ============================================================
   FOCUS FLOW - GLOBAL THEME
   File: theme.js

   FUNGSI:
   1. Mengatur tema warna seluruh halaman Focus Flow.
   2. Membaca tema terakhir dari Local Storage.
   3. Mengambil tema pengguna dari Firebase Firestore.
   4. Menyamakan tema ketika pengguna berpindah halaman.
============================================================ */


/* ============================================================
   BAGIAN 1: IMPORT FIREBASE
============================================================ */

// Mengambil koneksi Firebase dari firebase.js.
import { auth, db } from "./firebase.js";

// Mengambil fungsi untuk memeriksa pengguna yang login.
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

// Mengambil fungsi untuk membaca data Firestore.
import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


/* ============================================================
   BAGIAN 2: PENGATURAN TEMA DEFAULT
============================================================ */

// Tema yang digunakan jika belum ada tema tersimpan.
const DEFAULT_THEME = "lavender";

// Nama kunci untuk menyimpan tema di Local Storage.
const THEME_STORAGE_KEY = "focusFlowTheme";


/* ============================================================
   BAGIAN 3: DAFTAR WARNA TEMA
============================================================ */

// Setiap tema memiliki warna CSS yang berbeda.

const themeColors = {

    lavender: {
        primary: "#9275e8",
        primaryDark: "#7658d2",
        primaryLight: "#e9e1ff",
        background: "#f8f6ff",
        card: "#ffffff",
        textDark: "#332b4a",
        textMuted: "#8b849d",
        border: "#ece6f8"
    },

    pink: {
        primary: "#e879a9",
        primaryDark: "#cf5d91",
        primaryLight: "#ffe2ef",
        background: "#fff5fa",
        card: "#ffffff",
        textDark: "#4a2b3b",
        textMuted: "#a18494",
        border: "#f7dfeb"
    },

    blue: {
        primary: "#6c9ee8",
        primaryDark: "#4e7fc9",
        primaryLight: "#deebff",
        background: "#f3f8ff",
        card: "#ffffff",
        textDark: "#263b57",
        textMuted: "#8494aa",
        border: "#e0ebf9"
    },

    green: {
        primary: "#70b99a",
        primaryDark: "#4d9979",
        primaryLight: "#ddf5e9",
        background: "#f3fbf6",
        card: "#ffffff",
        textDark: "#294638",
        textMuted: "#839b8e",
        border: "#e0f0e6"
    }

};


/* ============================================================
   BAGIAN 4: FUNGSI MENERAPKAN TEMA
============================================================ */

// Fungsi ini mengubah CSS Variables pada halaman.

function applyGlobalTheme(theme) {

    // Memastikan tema yang digunakan tersedia.
    const selectedTheme = themeColors[theme]
        ? theme
        : DEFAULT_THEME;

    // Mengambil kumpulan warna tema.
    const colors = themeColors[selectedTheme];

    // Mengubah warna CSS utama.
    document.documentElement.style.setProperty(
        "--primary",
        colors.primary
    );

    document.documentElement.style.setProperty(
        "--primary-dark",
        colors.primaryDark
    );

    document.documentElement.style.setProperty(
        "--primary-light",
        colors.primaryLight
    );

    document.documentElement.style.setProperty(
        "--background",
        colors.background
    );

    document.documentElement.style.setProperty(
        "--card",
        colors.card
    );

    document.documentElement.style.setProperty(
        "--text-dark",
        colors.textDark
    );

    document.documentElement.style.setProperty(
        "--text-muted",
        colors.textMuted
    );

    document.documentElement.style.setProperty(
        "--border",
        colors.border
    );

    // Menyimpan tema yang sedang diterapkan.
    document.documentElement.setAttribute(
        "data-theme",
        selectedTheme
    );

}


/* ============================================================
   BAGIAN 5: MEMBACA TEMA DARI LOCAL STORAGE
============================================================ */

// Local Storage membantu menampilkan tema lebih cepat
// sebelum tema terbaru diperiksa dari Firebase.

function loadLocalTheme() {

    try {

        // Membaca tema yang pernah disimpan.
        const savedTheme = localStorage.getItem(
            THEME_STORAGE_KEY
        );

        // Jika tema tersedia dan valid, gunakan tema tersebut.
        if (savedTheme && themeColors[savedTheme]) {

            applyGlobalTheme(savedTheme);

        } else {

            // Jika belum ada tema, gunakan Lavender.
            applyGlobalTheme(DEFAULT_THEME);

        }

    } catch (error) {

        // Jika Local Storage tidak dapat digunakan.
        console.error(
            "Gagal membaca tema lokal:",
            error
        );

        applyGlobalTheme(DEFAULT_THEME);

    }

}


/* ============================================================
   BAGIAN 6: MENGAMBIL TEMA DARI FIREBASE
============================================================ */

// Fungsi ini mengambil tema berdasarkan akun pengguna.

async function loadFirebaseTheme(user) {

    try {

        // Lokasi dokumen pengaturan pengguna.
        const settingsRef = doc(
            db,
            "users",
            user.uid,
            "settings",
            "preferences"
        );

        // Membaca dokumen pengaturan.
        const settingsSnapshot = await getDoc(settingsRef);

        // Tema default jika dokumen belum tersedia.
        let savedTheme = DEFAULT_THEME;

        // Jika dokumen pengaturan ditemukan.
        if (settingsSnapshot.exists()) {

            // Mengambil data tema dari Firestore.
            const settingsData = settingsSnapshot.data();

            savedTheme = settingsData.theme || DEFAULT_THEME;

        }

        // Memastikan tema valid.
        if (!themeColors[savedTheme]) {

            savedTheme = DEFAULT_THEME;

        }

        // Menerapkan tema dari Firebase.
        applyGlobalTheme(savedTheme);

        // Menyimpan tema terbaru ke Local Storage.
        localStorage.setItem(
            THEME_STORAGE_KEY,
            savedTheme
        );

    } catch (error) {

        // Menampilkan kesalahan di Console.
        console.error(
            "Gagal mengambil tema dari Firebase:",
            error
        );

        // Tema lokal tetap digunakan jika Firebase gagal.
        loadLocalTheme();

    }

}


/* ============================================================
   BAGIAN 7: MENJALANKAN TEMA GLOBAL
============================================================ */

// Pertama, tampilkan tema lokal agar tidak perlu
// menunggu proses pengambilan data dari Firebase.

loadLocalTheme();

// Setelah itu, periksa status login pengguna.
onAuthStateChanged(auth, (user) => {

    // Jika pengguna sudah login, ambil tema dari Firebase.
    if (user) {

        loadFirebaseTheme(user);

    }

});
