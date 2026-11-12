/* =========================================================
   FOCUS FLOW - AUTHENTICATION
   FILE: script.js

   FUNGSI UTAMA:
   1. Mendaftarkan akun pengguna baru.
   2. Melakukan login menggunakan email dan password.
   3. Menyimpan nama pengguna pada profil Firebase.
   4. Melakukan logout.
   5. Melindungi halaman Dashboard agar hanya bisa dibuka
      oleh pengguna yang sudah login.

   CATATAN:
   Nama dan email pengguna pada Study Schedule diatur
   melalui file study-schedule.js, bukan file ini.
   ========================================================= */


/* =========================================================
   BAGIAN 1: MENGHUBUNGKAN JAVASCRIPT DENGAN FIREBASE
   ========================================================= */

// Mengambil layanan Authentication dari firebase.js.
// Variabel auth digunakan untuk proses login, register,
// logout, dan pemeriksaan status pengguna.
import { auth } from "./firebase.js";

// Mengambil fungsi-fungsi yang diperlukan dari Firebase Authentication.
import {
    createUserWithEmailAndPassword, // Membuat akun baru.
    signInWithEmailAndPassword,     // Memeriksa email dan password saat login.
    signOut,                        // Mengeluarkan pengguna dari akun.
    onAuthStateChanged,             // Memantau status login pengguna.
    updateProfile                   // Menyimpan nama pada profil Firebase.
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";


/* =========================================================
   BAGIAN 2: PENDAFTARAN AKUN BARU
   ========================================================= */

// Mengambil form pendaftaran dari register.html.
// getElementById mencari elemen HTML berdasarkan ID-nya.
const registerForm = document.getElementById("register-form");

// Memeriksa apakah form pendaftaran tersedia.
// Pemeriksaan ini diperlukan karena script.js juga digunakan
// oleh halaman lain selain halaman Register.
if (registerForm) {

    // addEventListener mendeteksi ketika form dikirim.
    // async digunakan agar proses Firebase bisa memakai await.
    registerForm.addEventListener("submit", async (event) => {

        // Mencegah halaman melakukan refresh otomatis
        // ketika tombol daftar ditekan.
        event.preventDefault();


        /* -----------------------------------------------
           A. MENGAMBIL DATA PENDAFTARAN
           ----------------------------------------------- */

        // Mengambil nama pengguna dari input dengan ID "name".
        // trim() menghapus spasi di awal dan akhir teks.
        const name = document.getElementById("name").value.trim();

        // Mengambil email pengguna dari input dengan ID "email".
        const email = document.getElementById("email").value.trim();

        // Mengambil password yang dimasukkan pengguna.
        const password = document.getElementById("password").value;

        // Mengambil password konfirmasi.
        // Nilainya digunakan untuk memastikan kedua password sama.
        const confirmPassword =
            document.getElementById("confirm-password").value;


        /* -----------------------------------------------
           B. MEMERIKSA DATA PENDAFTARAN
           ----------------------------------------------- */

        // Memeriksa apakah password dan konfirmasi password berbeda.
        if (password !== confirmPassword) {

            // Memberikan pemberitahuan kepada pengguna.
            alert("Password dan konfirmasi password tidak sama.");

            // Menghentikan proses pendaftaran.
            return;
        }

        // Memeriksa apakah nama pengguna masih kosong.
        if (name === "") {

            // Menampilkan pesan peringatan.
            alert("Nama tidak boleh kosong.");

            // Menghentikan proses pendaftaran.
            return;
        }


        /* -----------------------------------------------
           C. MEMBUAT AKUN DI FIREBASE
           ----------------------------------------------- */

        // try digunakan untuk menjalankan proses yang mungkin
        // menghasilkan kesalahan.
        try {

            // Membuat akun baru menggunakan email dan password.
            //
            // auth     = layanan Authentication Firebase.
            // email    = email yang dimasukkan pengguna.
            // password = password yang dimasukkan pengguna.
            //
            // await menunggu sampai Firebase selesai membuat akun.
            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            // Mengambil informasi akun yang baru dibuat.
            // userCredential.user berisi data pengguna Firebase.
            const user = userCredential.user;


            /* -------------------------------------------
               D. MENYIMPAN NAMA PADA PROFIL FIREBASE
               ------------------------------------------- */

            // updateProfile digunakan untuk memperbarui profil akun.
            await updateProfile(user, {

                // displayName menyimpan nama pengguna
                // agar bisa dibaca kembali dari Firebase.
                displayName: name

            });

            // Memberikan informasi bahwa pendaftaran berhasil.
            alert("Pendaftaran berhasil! Silakan login.");

            // Mengarahkan pengguna menuju halaman Login.
            window.location.href = "login.html";


        } catch (error) {

            // Menampilkan detail kesalahan pada Console browser.
            // error berisi informasi kesalahan dari Firebase.
            console.error("Pendaftaran gagal:", error);


            /* -------------------------------------------
               E. MENANGANI KESALAHAN PENDAFTARAN
               ------------------------------------------- */

            // Memeriksa apakah email sudah digunakan.
            if (error.code === "auth/email-already-in-use") {

                alert("Email sudah terdaftar.");

            }

            // Memeriksa apakah format email tidak valid.
            else if (error.code === "auth/invalid-email") {

                alert("Format email tidak valid.");

            }

            // Memeriksa apakah password terlalu lemah.
            else if (error.code === "auth/weak-password") {

                alert("Password terlalu lemah. Gunakan password yang lebih kuat.");

            }

            // Menangani kesalahan lain yang tidak termasuk
            // dalam tiga kondisi di atas.
            else {

                alert("Pendaftaran gagal. Silakan coba kembali.");

            }

        }

    });

}


/* =========================================================
   BAGIAN 3: LOGIN PENGGUNA
   ========================================================= */

// Mengambil form login dari login.html.
// Form tersebut harus memiliki ID "login-form".
const loginForm = document.getElementById("login-form");

// Memeriksa apakah form login tersedia pada halaman.
if (loginForm) {

    // Menjalankan fungsi ketika pengguna mengirim form login.
    loginForm.addEventListener("submit", async (event) => {

        // Mencegah halaman melakukan refresh otomatis.
        event.preventDefault();


        /* -----------------------------------------------
           A. MENGAMBIL DATA LOGIN
           ----------------------------------------------- */

        // Mengambil email dari input dengan ID "email".
        const email = document.getElementById("email").value.trim();

        // Mengambil password dari input dengan ID "password".
        const password = document.getElementById("password").value;


        /* -----------------------------------------------
           B. MEMERIKSA AKUN PENGGUNA
           ----------------------------------------------- */

        try {

            // Memeriksa email dan password melalui Firebase.
            //
            // Jika data benar, Firebase akan mengizinkan login.
            // Jika data salah, proses akan masuk ke bagian catch.
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            // Menampilkan pesan bahwa login berhasil.
            alert("Login berhasil! Selamat datang di Focus Flow.");

            // Mengarahkan pengguna ke halaman Dashboard.
            window.location.href = "dashboard.html";


        } catch (error) {

            // Menampilkan informasi kesalahan pada Console browser.
            console.error("Login gagal:", error);


            /* -------------------------------------------
               C. MENANGANI KESALAHAN LOGIN
               ------------------------------------------- */

            // Memeriksa apakah email atau password salah.
            if (
                error.code === "auth/invalid-credential" ||
                error.code === "auth/wrong-password" ||
                error.code === "auth/user-not-found"
            ) {

                alert("Email atau password salah.");

            }

            // Memeriksa apakah format email tidak valid.
            else if (error.code === "auth/invalid-email") {

                alert("Format email tidak valid.");

            }

            // Menampilkan pesan untuk kesalahan lainnya.
            else {

                alert("Login gagal. Silakan coba kembali.");

            }

        }

    });

}


/* =========================================================
   BAGIAN 4: LOGOUT PENGGUNA
   ========================================================= */

// Mengambil tombol Logout dari dashboard.html.
// Tombol tersebut harus memiliki ID "logout-btn".
const logoutButton = document.getElementById("logout-btn");

// Memeriksa apakah tombol Logout tersedia.
if (logoutButton) {

    // Menjalankan proses ketika tombol Logout ditekan.
    logoutButton.addEventListener("click", async () => {

        // Menampilkan pertanyaan konfirmasi kepada pengguna.
        // Hasilnya berupa true jika setuju dan false jika batal.
        const confirmLogout = confirm(
            "Apakah kamu yakin ingin logout?"
        );

        // Jika pengguna memilih batal, proses logout dihentikan.
        if (!confirmLogout) return;


        /* -----------------------------------------------
           A. MENJALANKAN LOGOUT
           ----------------------------------------------- */

        try {

            // Mengeluarkan akun pengguna dari Firebase.
            await signOut(auth);

            // Menampilkan pemberitahuan logout berhasil.
            alert("Logout berhasil.");

            // Mengarahkan pengguna ke halaman Login.
            window.location.href = "login.html";


        } catch (error) {

            // Menampilkan detail kesalahan pada Console browser.
            console.error("Logout gagal:", error);

            // Memberikan pemberitahuan jika logout gagal.
            alert("Logout gagal. Silakan coba kembali.");

        }

    });

}


/* =========================================================
   BAGIAN 5: MELINDUNGI HALAMAN DASHBOARD
   ========================================================= */

// Memeriksa apakah tombol Logout tersedia.
// Pada proyek ini, tombol tersebut digunakan sebagai penanda
// bahwa halaman yang sedang dibuka adalah Dashboard.
if (logoutButton) {

    // onAuthStateChanged memantau perubahan status login.
    //
    // Parameter auth adalah layanan Authentication Firebase.
    // Parameter user berisi data pengguna jika sudah login.
    // Jika belum login, nilai user adalah null.
    onAuthStateChanged(auth, (user) => {

        // Memeriksa apakah pengguna belum login.
        if (!user) {

            // Jika belum login, pengguna diarahkan ke Login.
            window.location.href = "login.html";

            // Menghentikan proses berikutnya.
            return;

        }

        // Jika pengguna sudah login, halaman Dashboard
        // dapat tetap dibuka.
        //
        // Nama pengguna tidak ditampilkan di Dashboard
        // sesuai keputusan desain Focus Flow.

    });

}


/* =========================================================
   SELESAI
   ========================================================= */

// File script.js sekarang menangani:
//
// 1. Pendaftaran akun baru.
// 2. Penyimpanan nama pada profil Firebase.
// 3. Login menggunakan email dan password.
// 4. Logout dari akun.
// 5. Perlindungan halaman Dashboard.
//
// Catatan:
// Pengaturan nama dan email pada Study Schedule
// tetap ditangani oleh file study-schedule.js.