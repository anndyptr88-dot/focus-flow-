/* ============================================================
   FOCUS FLOW - STUDY SCHEDULE JAVASCRIPT
   File: study-schedule.js

   FUNGSI:
   1. Menghubungkan Study Schedule dengan Firebase.
   2. Membaca tema dari Settings.
   3. Menampilkan data pengguna.
   4. Menampilkan kalender.
   5. Menambahkan jadwal belajar.
   6. Mengedit jadwal belajar.
   7. Menghapus jadwal belajar.
   8. Menampilkan statistik jadwal.
============================================================ */


/* ============================================================
   1. IMPORT FIREBASE
============================================================ */

// Mengambil auth dan db dari file konfigurasi Firebase.
// Pastikan firebase.js sudah tersedia di folder project.

import { auth, db } from "./firebase.js";


// Mengambil fungsi Firebase Authentication.

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";


// Mengambil fungsi Firestore.

import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


/* ============================================================
   2. MENGAMBIL ELEMENT HTML
============================================================ */

// Element kalender.

const calendarMonth = document.getElementById("calendarMonth");
const calendarDays = document.getElementById("calendarDays");

const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");


// Element daftar jadwal.

const scheduleList = document.getElementById("scheduleList");

const selectedDateTitle =
    document.getElementById("selectedDateTitle");

const selectedDateDescription =
    document.getElementById("selectedDateDescription");


// Element statistik.

const totalSchedules =
    document.getElementById("totalSchedules");

const todaySchedules =
    document.getElementById("todaySchedules");

const totalDuration =
    document.getElementById("totalDuration");


// Element modal.

const scheduleModal =
    document.getElementById("scheduleModal");

const scheduleForm =
    document.getElementById("scheduleForm");

const modalTitle =
    document.getElementById("modalTitle");

const addScheduleBtn =
    document.getElementById("addScheduleBtn");

const closeModalBtn =
    document.getElementById("closeModal");

const cancelModalBtn =
    document.getElementById("cancelModal");

const saveScheduleBtn =
    document.getElementById("saveScheduleBtn");


// Element input form.

const subjectInput =
    document.getElementById("subjectInput");

const dateInput =
    document.getElementById("dateInput");

const startTimeInput =
    document.getElementById("startTimeInput");

const endTimeInput =
    document.getElementById("endTimeInput");

const noteInput =
    document.getElementById("noteInput");


// Element profil.

const userName =
    document.getElementById("userName");

const userEmail =
    document.getElementById("userEmail");

const todayDate =
    document.getElementById("todayDate");


// Element loading.

const loadingOverlay =
    document.getElementById("loadingOverlay");


// Element sidebar.

const sidebar =
    document.getElementById("sidebar");

const menuToggle =
    document.getElementById("menuToggle");



/* ============================================================
   3. VARIABLE GLOBAL
============================================================ */

// Menyimpan pengguna yang sedang login.

let currentUser = null;


// Menyimpan semua jadwal dari Firestore.

let schedules = [];


// Menyimpan tanggal yang sedang dipilih.

let selectedDate = getLocalDateString(new Date());


// Menyimpan bulan yang sedang ditampilkan kalender.

let currentCalendarDate = new Date();


// Menyimpan ID jadwal yang sedang diedit.
// Jika null, berarti sedang menambahkan jadwal baru.

let editingScheduleId = null;



/* ============================================================
   4. DATA TEMA
============================================================ */

// Tema mengikuti pilihan warna yang disimpan di Settings.

const studyScheduleThemes = {

    lavender: {
        primary: "#9275e8",
        primaryDark: "#7658d2",
        primaryLight: "#eee8ff",
        background: "#f8f7fc",
        white: "#ffffff",
        textDark: "#302747",
        textMuted: "#817993",
        border: "#eeeaf5"
    },

    pink: {
        primary: "#ec8fb5",
        primaryDark: "#d66e99",
        primaryLight: "#ffe5ef",
        background: "#fff0f6",
        white: "#ffffff",
        textDark: "#4a2938",
        textMuted: "#987586",
        border: "#f5dce7"
    },

    blue: {
        primary: "#75a8e8",
        primaryDark: "#528bd2",
        primaryLight: "#e3f0ff",
        background: "#edf6ff",
        white: "#ffffff",
        textDark: "#263b55",
        textMuted: "#788da8",
        border: "#dce9f7"
    },

    green: {
        primary: "#79bd99",
        primaryDark: "#55a77a",
        primaryLight: "#e1f5e9",
        background: "#edf9f1",
        white: "#ffffff",
        textDark: "#294638",
        textMuted: "#789386",
        border: "#dcefe3"
    }

};



/* ============================================================
   5. FUNGSI MENERAPKAN TEMA
============================================================ */

// Fungsi ini mengubah warna CSS berdasarkan tema.

function applyStudyScheduleTheme(themeName) {

    // Jika tema tidak ditemukan, gunakan Lavender.

    const theme =
        studyScheduleThemes[themeName] ||
        studyScheduleThemes.lavender;


    // Mengubah variabel CSS pada seluruh halaman.

    document.documentElement.style.setProperty(
        "--primary",
        theme.primary
    );

    document.documentElement.style.setProperty(
        "--primary-dark",
        theme.primaryDark
    );

    document.documentElement.style.setProperty(
        "--primary-light",
        theme.primaryLight
    );

    document.documentElement.style.setProperty(
        "--background",
        theme.background
    );

    document.documentElement.style.setProperty(
        "--white",
        theme.white
    );

    document.documentElement.style.setProperty(
        "--text-dark",
        theme.textDark
    );

    document.documentElement.style.setProperty(
        "--text-muted",
        theme.textMuted
    );

    document.documentElement.style.setProperty(
        "--border",
        theme.border
    );


    // Menandai tema yang sedang digunakan.

    document.documentElement.setAttribute(
        "data-theme",
        themeName
    );

}



/* ============================================================
   6. MEMBACA TEMA DARI FIREBASE
============================================================ */

// Tema dibaca dari:
// users / UID pengguna / settings / preferences

async function loadStudyScheduleTheme(user) {

    try {

        const settingsRef = doc(
            db,
            "users",
            user.uid,
            "settings",
            "preferences"
        );


        const settingsSnapshot =
            await getDoc(settingsRef);


        // Jika dokumen Settings tersedia.

        if (settingsSnapshot.exists()) {

            const settingsData =
                settingsSnapshot.data();

            const savedTheme =
                settingsData.theme || "lavender";


            applyStudyScheduleTheme(savedTheme);

        } else {

            // Tema default jika Settings belum tersedia.

            applyStudyScheduleTheme("lavender");

        }

    } catch (error) {

        console.error(
            "Gagal membaca tema:",
            error
        );

        // Jika terjadi error, gunakan tema Lavender.

        applyStudyScheduleTheme("lavender");

    }

}



/* ============================================================
   7. FUNGSI TANGGAL
============================================================ */

// Menghasilkan format tanggal YYYY-MM-DD.
// Format ini digunakan agar tanggal konsisten saat disimpan.

function getLocalDateString(date) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}



// Mengubah tanggal menjadi format Indonesia.

function formatDateIndonesia(dateString) {

    const date = new Date(
        dateString + "T00:00:00"
    );


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}



// Mengubah waktu 24 jam menjadi tampilan yang lebih mudah dibaca.

function formatTime(timeString) {

    if (!timeString) {
        return "-";
    }

    return timeString;

}



/* ============================================================
   8. MENAMPILKAN TANGGAL HARI INI
============================================================ */

function displayTodayDate() {

    const now = new Date();


    todayDate.textContent =
        now.toLocaleDateString(
            "id-ID",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

}



/* ============================================================
   9. MENAMPILKAN PROFIL PENGGUNA
============================================================ */

function displayUserProfile(user) {

    // Mengambil nama pengguna dari Firebase Authentication.

    userName.textContent =
        user.displayName || "Student";


    // Mengambil email pengguna.

    userEmail.textContent =
        user.email || "Email tidak tersedia";

}



/* ============================================================
   10. LOADING
============================================================ */

function showLoading() {

    loadingOverlay.classList.add("show");

}


function hideLoading() {

    loadingOverlay.classList.remove("show");

}



/* ============================================================
   11. MEMUAT JADWAL DARI FIRESTORE
============================================================ */

// Lokasi data:
// users / UID pengguna / studySchedules / ID jadwal

async function loadSchedules() {

    if (!currentUser) {
        return;
    }


    try {

        showLoading();


        // Mengambil koleksi jadwal milik pengguna.

        const schedulesRef = collection(
            db,
            "users",
            currentUser.uid,
            "studySchedules"
        );


        // Mengurutkan jadwal berdasarkan tanggal.

        const schedulesQuery = query(
            schedulesRef,
            orderBy("date", "asc")
        );


        const snapshot =
            await getDocs(schedulesQuery);


        // Mengosongkan array jadwal.

        schedules = [];


        // Memasukkan data Firestore ke array.

        snapshot.forEach((documentSnapshot) => {

            schedules.push({

                id: documentSnapshot.id,

                ...documentSnapshot.data()

            });

        });


        // Menampilkan ulang kalender, jadwal, dan statistik.

        renderCalendar();

        renderSchedules();

        updateStatistics();


    } catch (error) {

        console.error(
            "Gagal memuat jadwal:",
            error
        );


        alert(
            "Jadwal gagal dimuat. Periksa koneksi Firebase."
        );


    } finally {

        hideLoading();

    }

}



/* ============================================================
   12. MEMBUAT KALENDER
============================================================ */

function renderCalendar() {

    // Mengambil tahun dan bulan yang sedang ditampilkan.

    const year =
        currentCalendarDate.getFullYear();

    const month =
        currentCalendarDate.getMonth();


    // Menampilkan nama bulan dan tahun.

    calendarMonth.textContent =
        currentCalendarDate.toLocaleDateString(
            "id-ID",
            {
                month: "long",
                year: "numeric"
            }
        );


    // Menentukan hari pertama dalam bulan.

    const firstDay =
        new Date(year, month, 1).getDay();


    // Menentukan jumlah hari dalam bulan.

    const daysInMonth =
        new Date(year, month + 1, 0).getDate();


    // Mengosongkan kalender sebelumnya.

    calendarDays.innerHTML = "";


    // Membuat kotak kosong sebelum tanggal 1.

    for (let i = 0; i < firstDay; i++) {

        const emptyDay =
            document.createElement("div");

        emptyDay.className =
            "calendar-day empty";

        calendarDays.appendChild(emptyDay);

    }


    // Membuat setiap tanggal.

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dateObject =
            new Date(year, month, day);


        const dateString =
            getLocalDateString(dateObject);


        const dayElement =
            document.createElement("div");


        dayElement.className =
            "calendar-day";


        dayElement.textContent =
            day;


        // Memeriksa apakah tanggal adalah hari ini.

        const todayString =
            getLocalDateString(new Date());


        if (dateString === todayString) {

            dayElement.classList.add("today");

        }


        // Memeriksa apakah tanggal dipilih.

        if (dateString === selectedDate) {

            dayElement.classList.add("selected");

        }


        // Memeriksa apakah ada jadwal pada tanggal tersebut.

        const hasSchedule =
            schedules.some(
                schedule =>
                    schedule.date === dateString
            );


        if (hasSchedule) {

            dayElement.classList.add(
                "has-schedule"
            );

        }


        // Ketika tanggal diklik.

        dayElement.addEventListener(
            "click",
            () => {

                selectedDate =
                    dateString;


                renderCalendar();

                renderSchedules();

            }
        );


        // Menambahkan tanggal ke kalender.

        calendarDays.appendChild(
            dayElement
        );

    }

}



/* ============================================================
   13. NAVIGASI BULAN KALENDER
============================================================ */

// Tombol bulan sebelumnya.

prevMonthBtn.addEventListener(
    "click",
    () => {

        currentCalendarDate.setMonth(
            currentCalendarDate.getMonth() - 1
        );


        renderCalendar();

    }
);


// Tombol bulan berikutnya.

nextMonthBtn.addEventListener(
    "click",
    () => {

        currentCalendarDate.setMonth(
            currentCalendarDate.getMonth() + 1
        );


        renderCalendar();

    }
);



/* ============================================================
   14. MENAMPILKAN JADWAL BERDASARKAN TANGGAL
============================================================ */

function renderSchedules() {

    // Mengubah judul tanggal.

    selectedDateTitle.textContent =
        formatDateIndonesia(selectedDate);


    selectedDateDescription.textContent =
        "Jadwal belajar pada tanggal yang dipilih.";


    // Mengambil jadwal sesuai tanggal yang dipilih.

    const filteredSchedules =
        schedules.filter(
            schedule =>
                schedule.date === selectedDate
        );


    // Mengurutkan jadwal berdasarkan waktu mulai.

    filteredSchedules.sort(
        (a, b) =>
            (a.startTime || "").localeCompare(
                b.startTime || ""
            )
    );


    // Mengosongkan daftar jadwal.

    scheduleList.innerHTML = "";


    // Jika tidak ada jadwal.

    if (filteredSchedules.length === 0) {

        scheduleList.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-calendar-plus"></i>

                <h3>No Study Schedule</h3>

                <p>
                    Belum ada jadwal belajar pada tanggal ini.
                    Klik Add Schedule untuk menambahkan jadwal.
                </p>

            </div>

        `;


        return;

    }


    // Menampilkan semua jadwal.

    filteredSchedules.forEach(
        schedule => {

            const scheduleElement =
                document.createElement("div");


            scheduleElement.className =
                "schedule-item";


            // Membuat tampilan jadwal.

            scheduleElement.innerHTML = `

                <div class="schedule-time">

                    <h4>
                        ${formatTime(schedule.startTime)}
                    </h4>

                    <p>
                        ${formatTime(schedule.endTime)}
                    </p>

                </div>


                <div class="schedule-details">

                    <h3>
                        ${escapeHTML(schedule.subject || "Untitled")}
                    </h3>

                    <p class="schedule-date">

                        <i class="fa-regular fa-calendar"></i>

                        ${formatDateIndonesia(schedule.date)}

                    </p>

                    <p>
                        ${escapeHTML(schedule.note || "Tidak ada catatan.")}
                    </p>

                </div>


                <div class="schedule-actions">

                    <button
                        class="schedule-action-btn edit-btn"
                        title="Edit Schedule"
                        data-id="${schedule.id}">

                        <i class="fa-solid fa-pen"></i>

                    </button>


                    <button
                        class="schedule-action-btn delete-btn"
                        title="Delete Schedule"
                        data-id="${schedule.id}">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>

            `;


            // Menambahkan jadwal ke daftar.

            scheduleList.appendChild(
                scheduleElement
            );

        }
    );


    // Memasang fungsi tombol Edit.

    document.querySelectorAll(".edit-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const scheduleId =
                        button.dataset.id;


                    editSchedule(
                        scheduleId
                    );

                }
            );

        });


    // Memasang fungsi tombol Delete.

    document.querySelectorAll(".delete-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const scheduleId =
                        button.dataset.id;


                    deleteSchedule(
                        scheduleId
                    );

                }
            );

        });

}



/* ============================================================
   15. MENGHITUNG STATISTIK
============================================================ */

function updateStatistics() {

    // Menghitung total jadwal.

    totalSchedules.textContent =
        schedules.length;


    // Mengambil tanggal hari ini.

    const todayString =
        getLocalDateString(new Date());


    // Menghitung jadwal hari ini.

    const todayScheduleCount =
        schedules.filter(
            schedule =>
                schedule.date === todayString
        ).length;


    todaySchedules.textContent =
        todayScheduleCount;


    // Menghitung total durasi belajar.

    let totalMinutes = 0;


    schedules.forEach(
        schedule => {

            if (
                schedule.startTime &&
                schedule.endTime
            ) {

                const start =
                    convertTimeToMinutes(
                        schedule.startTime
                    );


                const end =
                    convertTimeToMinutes(
                        schedule.endTime
                    );


                const duration =
                    end - start;


                if (duration > 0) {

                    totalMinutes += duration;

                }

            }

        }
    );


    // Mengubah menit menjadi jam.

    const hours =
        Math.floor(totalMinutes / 60);


    const minutes =
        totalMinutes % 60;


    if (minutes === 0) {

        totalDuration.textContent =
            `${hours} Jam`;

    } else {

        totalDuration.textContent =
            `${hours} Jam ${minutes} Menit`;

    }

}



// Mengubah format waktu HH:MM menjadi menit.

function convertTimeToMinutes(timeString) {

    const parts =
        timeString.split(":");


    const hours =
        Number(parts[0]);


    const minutes =
        Number(parts[1]);


    return (
        hours * 60 +
        minutes
    );

}



/* ============================================================
   16. MEMBUKA MODAL
============================================================ */

function openModal() {

    scheduleModal.classList.add("show");

}



// Menutup modal.

function closeModal() {

    scheduleModal.classList.remove("show");

}



// Tombol Add Schedule.

addScheduleBtn.addEventListener(
    "click",
    () => {

        editingScheduleId = null;


        scheduleForm.reset();


        modalTitle.textContent =
            "Add Study Schedule";


        saveScheduleBtn.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            Save Schedule
        `;


        // Mengisi tanggal sesuai tanggal yang dipilih.

        dateInput.value =
            selectedDate;


        openModal();

    }
);


// Tombol close.

closeModalBtn.addEventListener(
    "click",
    closeModal
);


// Tombol cancel.

cancelModalBtn.addEventListener(
    "click",
    closeModal
);


// Menutup modal ketika area luar modal diklik.

scheduleModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target === scheduleModal
        ) {

            closeModal();

        }

    }
);



/* ============================================================
   17. MENAMBAHKAN JADWAL
============================================================ */

scheduleForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!currentUser) {

            alert(
                "Silakan login terlebih dahulu."
            );

            return;

        }


        // Mengambil data dari form.

        const subject =
            subjectInput.value.trim();


        const date =
            dateInput.value;


        const startTime =
            startTimeInput.value;


        const endTime =
            endTimeInput.value;


        const note =
            noteInput.value.trim();


        // Validasi form.

        if (
            !subject ||
            !date ||
            !startTime ||
            !endTime
        ) {

            alert(
                "Silakan lengkapi semua data yang wajib diisi."
            );

            return;

        }


        // Memastikan waktu selesai lebih besar dari waktu mulai.

        if (
            endTime <= startTime
        ) {

            alert(
                "Waktu selesai harus lebih besar dari waktu mulai."
            );

            return;

        }


        try {

            saveScheduleBtn.disabled =
                true;


            saveScheduleBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Saving...
            `;


            // Lokasi koleksi jadwal.

            const schedulesRef =
                collection(
                    db,
                    "users",
                    currentUser.uid,
                    "studySchedules"
                );


            // Menyimpan jadwal baru ke Firestore.

            await addDoc(
                schedulesRef,
                {

                    subject: subject,

                    date: date,

                    startTime: startTime,

                    endTime: endTime,

                    note: note,

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }
            );


            // Memilih tanggal jadwal yang baru dibuat.

            selectedDate =
                date;


            currentCalendarDate =
                new Date(
                    date + "T00:00:00"
                );


            // Menutup modal.

            closeModal();


            // Memuat ulang data.

            await loadSchedules();


            alert(
                "Jadwal belajar berhasil ditambahkan!"
            );


        } catch (error) {

            console.error(
                "Gagal menambahkan jadwal:",
                error
            );


            alert(
                "Jadwal gagal ditambahkan. Periksa Firebase."
            );


        } finally {

            saveScheduleBtn.disabled =
                false;


            saveScheduleBtn.innerHTML = `
                <i class="fa-solid fa-floppy-disk"></i>
                Save Schedule
            `;

        }

    }
);



/* ============================================================
   18. EDIT JADWAL
============================================================ */

function editSchedule(scheduleId) {

    // Mencari jadwal berdasarkan ID.

    const schedule =
        schedules.find(
            item =>
                item.id === scheduleId
        );


    // Jika jadwal tidak ditemukan.

    if (!schedule) {

        alert(
            "Jadwal tidak ditemukan."
        );

        return;

    }


    // Menyimpan ID jadwal yang sedang diedit.

    editingScheduleId =
        scheduleId;


    // Mengisi form dengan data jadwal sebelumnya.

    subjectInput.value =
        schedule.subject || "";


    dateInput.value =
        schedule.date || "";


    startTimeInput.value =
        schedule.startTime || "";


    endTimeInput.value =
        schedule.endTime || "";


    noteInput.value =
        schedule.note || "";


    // Mengubah judul modal.

    modalTitle.textContent =
        "Edit Study Schedule";


    saveScheduleBtn.innerHTML = `
        <i class="fa-solid fa-floppy-disk"></i>
        Update Schedule
    `;


    // Membuka modal.

    openModal();

}



/* ============================================================
   19. UPDATE JADWAL
============================================================ */

// Fungsi ini dijalankan saat form disubmit
// jika editingScheduleId tidak null.

async function updateScheduleData() {

    if (!currentUser) {

        return;

    }


    const subject =
        subjectInput.value.trim();


    const date =
        dateInput.value;


    const startTime =
        startTimeInput.value;


    const endTime =
        endTimeInput.value;


    const note =
        noteInput.value.trim();


    // Validasi waktu.

    if (
        endTime <= startTime
    ) {

        alert(
            "Waktu selesai harus lebih besar dari waktu mulai."
        );

        return;

    }


    try {

        saveScheduleBtn.disabled =
            true;


        // Referensi dokumen jadwal.

        const scheduleRef =
            doc(
                db,
                "users",
                currentUser.uid,
                "studySchedules",
                editingScheduleId
            );


        // Mengubah data jadwal.

        await updateDoc(
            scheduleRef,
            {

                subject: subject,

                date: date,

                startTime: startTime,

                endTime: endTime,

                note: note,

                updatedAt:
                    serverTimestamp()

            }
        );


        // Mengubah tanggal terpilih.

        selectedDate =
            date;


        currentCalendarDate =
            new Date(
                date + "T00:00:00"
            );


        closeModal();


        await loadSchedules();


        alert(
            "Jadwal berhasil diperbarui!"
        );


    } catch (error) {

        console.error(
            "Gagal mengubah jadwal:",
            error
        );


        alert(
            "Jadwal gagal diperbarui."
        );


    } finally {

        saveScheduleBtn.disabled =
            false;

    }

}



/* ============================================================
   20. MEMBEDAKAN TAMBAH DAN EDIT
============================================================ */

// Mengganti fungsi submit agar:
// - editingScheduleId null = tambah jadwal.
// - editingScheduleId terisi = update jadwal.

scheduleForm.addEventListener(
    "submit",
    async (event) => {

        // Event submit sudah ditangani pada bagian 17.
        // Fungsi ini sengaja tidak melakukan proses tambahan.

    }
);


// Menggunakan event handler tambahan untuk proses edit.

const originalSubmitHandler =
    scheduleForm.onsubmit;


// Karena event listener di bagian 17 menggunakan addEventListener,
// proses edit dijalankan melalui pemeriksaan berikut.

scheduleForm.addEventListener(
    "submit",
    async (event) => {

        if (
            editingScheduleId !== null
        ) {

            event.preventDefault();


            await updateScheduleData();

        }

    }
);



/* ============================================================
   21. MENGHAPUS JADWAL
============================================================ */

async function deleteSchedule(scheduleId) {

    // Meminta konfirmasi pengguna.

    const confirmation =
        confirm(
            "Apakah kamu yakin ingin menghapus jadwal ini?"
        );


    // Jika pengguna membatalkan.

    if (!confirmation) {

        return;

    }


    try {

        showLoading();


        // Referensi dokumen yang akan dihapus.

        const scheduleRef =
            doc(
                db,
                "users",
                currentUser.uid,
                "studySchedules",
                scheduleId
            );


        // Menghapus dokumen dari Firestore.

        await deleteDoc(
            scheduleRef
        );


        // Memuat ulang jadwal.

        await loadSchedules();


        alert(
            "Jadwal berhasil dihapus!"
        );


    } catch (error) {

        console.error(
            "Gagal menghapus jadwal:",
            error
        );


        alert(
            "Jadwal gagal dihapus."
        );


    } finally {

        hideLoading();

    }

}



/* ============================================================
   22. MENGAMANKAN TEKS HTML
============================================================ */

// Fungsi ini mencegah teks input pengguna
// ditampilkan sebagai HTML yang tidak diinginkan.

function escapeHTML(text) {

    return String(text)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}



/* ============================================================
   23. SIDEBAR MOBILE
============================================================ */

// Tombol menu untuk membuka dan menutup sidebar.

menuToggle.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle(
            "open"
        );

    }
);



/* ============================================================
   24. FIREBASE AUTHENTICATION
============================================================ */

// Memeriksa pengguna yang sedang login.

onAuthStateChanged(
    auth,
    async (user) => {

        if (user) {

            // Menyimpan pengguna aktif.

            currentUser =
                user;


            // Menampilkan profil.

            displayUserProfile(
                user
            );


            // Menampilkan tanggal hari ini.

            displayTodayDate();


            // Membaca tema dari Settings.

            await loadStudyScheduleTheme(
                user
            );


            // Memuat jadwal dari Firebase.

            await loadSchedules();


        } else {

            // Jika belum login, arahkan ke login.

            window.location.href =
                "login.html";

        }

    }
);
