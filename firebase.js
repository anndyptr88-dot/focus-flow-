/* =========================================================
   FOCUS FLOW
   FILE: firebase.js

   FUNGSI UTAMA:
   1. Menghubungkan website Focus Flow ke Firebase.
   2. Menyiapkan Firebase Authentication.
   3. Menyiapkan Firestore Database.
   4. Menyediakan koneksi Firebase untuk file JavaScript lain.
   ========================================================= */


/* =========================================================
   1. MENGIMPOR FUNGSI FIREBASE
   ========================================================= */

// initializeApp digunakan untuk menghubungkan website
// dengan project Firebase berdasarkan konfigurasi yang diberikan.
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

// getAuth digunakan untuk mengaktifkan layanan Firebase Authentication.
// Layanan ini menangani proses pendaftaran, login, dan logout pengguna.
import { getAuth } from
  "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

// getFirestore digunakan untuk mengaktifkan Firestore Database.
// Firestore berfungsi menyimpan dan membaca data aplikasi.
import { getFirestore } from
  "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


/* =========================================================
   2. KONFIGURASI FIREBASE
   ========================================================= */

// firebaseConfig adalah objek yang menyimpan identitas
// dan informasi koneksi project Firebase Focus Flow.
//
// Setiap properti digunakan agar website dapat mengenali
// project Firebase yang akan dihubungkan.

const firebaseConfig = {

  // Kunci identifikasi aplikasi Firebase untuk koneksi layanan.
  apiKey: "AIzaSyBMhdVx0deBclC98r_AreuklHVdPo6U15Y",

  // Alamat domain yang digunakan untuk Firebase Authentication.
  authDomain: "focus-flow-796a7.firebaseapp.com",

  // ID unik project Firebase milik Focus Flow.
  projectId: "focus-flow-796a7",

  // Alamat penyimpanan file Firebase Storage.
  storageBucket: "focus-flow-796a7.firebasestorage.app",

  // ID pengirim pesan Firebase Cloud Messaging.
  messagingSenderId: "66681439988",

  // ID aplikasi web yang terdaftar pada Firebase.
  appId: "1:66681439988:web:c4f6536987025cea7f40a1",

  // ID pengukuran Google Analytics untuk aplikasi.
  measurementId: "G-GYMWRXRS5N"

};


/* =========================================================
   3. MENGINISIALISASI FIREBASE
   ========================================================= */

// initializeApp(firebaseConfig) menjalankan koneksi
// antara website Focus Flow dengan project Firebase.
//
// Variabel app:
// Menyimpan objek aplikasi Firebase yang sudah diinisialisasi.
//
// firebaseConfig:
// Objek konfigurasi yang berisi identitas project Firebase.

const app = initializeApp(firebaseConfig);


/* =========================================================
   4. MENYIAPKAN FIREBASE AUTHENTICATION
   ========================================================= */

// getAuth(app) mengaktifkan layanan Authentication
// berdasarkan aplikasi Firebase yang sudah dibuat.
//
// Variabel auth:
// Menyimpan layanan Authentication.
//
// export:
// Memungkinkan variabel auth digunakan oleh file JavaScript lain.
//
// Contoh penggunaannya:
// import { auth } from "./firebase.js";

export const auth = getAuth(app);


/* =========================================================
   5. MENYIAPKAN FIRESTORE DATABASE
   ========================================================= */

// getFirestore(app) menghubungkan aplikasi dengan
// layanan Cloud Firestore.
//
// Variabel db:
// Menyimpan koneksi Firestore Database.
//
// Database ini digunakan untuk menyimpan data pengguna,
// seperti tugas, jadwal belajar, pengaturan, dan riwayat belajar.
//
// export:
// Memungkinkan variabel db digunakan oleh file JavaScript lain.
//
// Contoh penggunaannya:
// import { db } from "./firebase.js";

export const db = getFirestore(app);


/* =========================================================
   6. RINGKASAN HASIL KONEKSI
   ========================================================= */

// Setelah file ini dijalankan:
//
// 1. Variabel app berisi koneksi aplikasi Firebase.
// 2. Variabel auth menyediakan layanan Authentication.
// 3. Variabel db menyediakan layanan Firestore Database.
//
// File JavaScript lain dapat menggunakan auth dan db
// tanpa harus menginisialisasi Firebase kembali.
//
// Contoh:
// import { auth, db } from "./firebase.js";
//
// CATATAN:
// File ini hanya menyiapkan koneksi Firebase.
// Proses login, pengelolaan tugas, jadwal belajar,
// dan penyimpanan data dilakukan oleh file JavaScript lain.

/* ===================== SELESAI ===================== */
