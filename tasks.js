/*
====================================================
 FOCUS FLOW - TASK MANAGEMENT
 File: tasks.js

 Fungsi file ini:
 1. Mengecek pengguna yang sedang login.
 2. Mengambil data tugas dari Firebase.
 3. Menambahkan tugas baru.
 4. Menghitung statistik tugas.
 5. Menandai tugas selesai atau belum selesai.
 6. Mengedit nama dan deadline tugas.
 7. Menghapus tugas.
 8. Mencari tugas berdasarkan nama.
 9. Memfilter tugas berdasarkan status.
 10. Menampilkan kalender tugas bulanan.
 11. Menampilkan daftar tugas berdasarkan tanggal.
====================================================
*/


// ==================================================
// 1. MENGHUBUNGKAN FILE DENGAN FIREBASE
// ==================================================

// Mengambil auth untuk mengetahui pengguna yang login.
// Mengambil db untuk mengakses database Firestore.
import { auth, db } from "./firebase.js";


// Mengambil fungsi yang diperlukan dari Firestore.
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


// Mengambil fungsi untuk memantau status login pengguna.
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";


// ==================================================
// 2. VARIABEL UTAMA
// ==================================================

// Menyimpan informasi pengguna yang sedang login.
let currentUser = null;

// Menyimpan seluruh data tugas dari Firebase.
let allTasks = [];

// Menyimpan tanggal yang sedang dipilih pada kalender.
// Format tanggal: YYYY-MM-DD.
let selectedDate = getLocalDateString(new Date());

// Menyimpan bulan yang sedang ditampilkan pada kalender.
let displayedMonth = new Date();


// ==================================================
// 3. FUNGSI MEMBUAT FORMAT TANGGAL
// ==================================================

/*
Fungsi ini mengubah tanggal menjadi format YYYY-MM-DD.

Contoh:
Tanggal 9 November 2026 menjadi:
2026-11-09

Format ini sama dengan nilai yang dihasilkan
oleh input HTML bertipe date.
*/

function getLocalDateString(date) {

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


// ==================================================
// 4. FUNGSI MENGUBAH TANGGAL MENJADI TAMPILAN INDONESIA
// ==================================================

/*
Fungsi ini digunakan agar tanggal lebih mudah dibaca.

Contoh:
2026-11-09 menjadi:
Senin, 9 November 2026
*/

function formatDateIndonesia(dateString) {

    if (!dateString) {
        return "Tanpa deadline";
    }

    const parts = dateString.split("-");

    const date = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

    return date.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

}


// ==================================================
// 5. MEMERIKSA STATUS LOGIN PENGGUNA
// ==================================================

// Firebase memeriksa apakah pengguna sudah login.
onAuthStateChanged(auth, async (user) => {

    if (user) {

        // Menyimpan informasi pengguna yang login.
        currentUser = user;

        // Mengambil data tugas milik pengguna.
        await loadTasks();

    } else {

        // Jika belum login, kembali ke halaman login.
        window.location.href = "login.html";

    }

});


// ==================================================
// 6. MENGAMBIL DATA TUGAS DARI FIREBASE
// ==================================================

async function loadTasks() {

    // Menghentikan proses jika pengguna belum login.
    if (!currentUser) return;

    // Mengambil elemen daftar tugas.
    const taskList = document.getElementById("task-list");

    try {

        // Mengakses koleksi tugas milik pengguna.
        const taskRef = collection(
            db,
            "users",
            currentUser.uid,
            "tasks"
        );

        // Mengurutkan tugas berdasarkan waktu dibuat.
        const taskQuery = query(
            taskRef,
            orderBy("createdAt", "desc")
        );

        // Mengambil dokumen tugas dari Firebase.
        const snapshot = await getDocs(taskQuery);

        // Mengubah data Firebase menjadi array JavaScript.
        allTasks = snapshot.docs.map((taskDocument) => {

            return {
                id: taskDocument.id,
                data: taskDocument.data()
            };

        });


        // Memperbarui statistik tugas.
        updateTaskStatistics();

        // Menampilkan daftar tugas utama.
        renderTasks();

        // Memperbarui kalender bulanan.
        renderCalendar();

        // Memperbarui daftar tugas harian.
        renderDailyTasks();

    } catch (error) {

        console.error("Gagal mengambil tugas:", error);

        if (taskList) {
            taskList.textContent = "Gagal memuat tugas.";
        }

    }

}


// ==================================================
// 7. MENGHITUNG STATISTIK TUGAS
// ==================================================

function updateTaskStatistics() {

    // Menghitung seluruh tugas.
    const total = allTasks.length;

    // Menghitung tugas yang selesai.
    const completed = allTasks.filter((task) => {

        return task.data.completed === true;

    }).length;

    // Menghitung tugas yang belum selesai.
    const pending = total - completed;


    // Mengambil elemen statistik dari HTML.
    const totalElement = document.getElementById("total-tasks");

    const completedElement = document.getElementById("completed-tasks");

    const pendingElement = document.getElementById("pending-tasks");


    // Menampilkan statistik jika elemennya tersedia.
    if (totalElement) {
        totalElement.textContent = total;
    }

    if (completedElement) {
        completedElement.textContent = completed;
    }

    if (pendingElement) {
        pendingElement.textContent = pending;
    }

}


// ==================================================
// 8. MENAMPILKAN DAFTAR TUGAS UTAMA
// ==================================================

function renderTasks() {

    // Mengambil tempat untuk menampilkan tugas.
    const taskList = document.getElementById("task-list");

    if (!taskList) return;

    // Mengambil nilai pencarian.
    const searchInput = document.getElementById("task-search");

    const searchText = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    // Mengambil nilai filter.
    const filterInput = document.getElementById("task-filter");

    const selectedFilter = filterInput
        ? filterInput.value
        : "all";


    // Menghapus tampilan tugas sebelumnya.
    taskList.innerHTML = "";


    // Menampilkan pesan jika belum ada tugas.
    if (allTasks.length === 0) {

        taskList.textContent =
            "Belum ada tugas. Yuk, tambahkan tugas!";

        return;

    }


    // Menyaring tugas berdasarkan pencarian dan status.
    const filteredTasks = allTasks.filter((taskItem) => {

        const task = taskItem.data;

        const taskTitle = (task.title || "").toLowerCase();

        // Memeriksa kesesuaian nama tugas.
        const matchesSearch = taskTitle.includes(searchText);

        // Memeriksa kesesuaian status.
        let matchesFilter = true;

        if (selectedFilter === "pending") {

            matchesFilter = task.completed !== true;

        } else if (selectedFilter === "completed") {

            matchesFilter = task.completed === true;

        }

        return matchesSearch && matchesFilter;

    });


    // Menampilkan pesan jika tidak ada hasil.
    if (filteredTasks.length === 0) {

        taskList.textContent =
            "Tugas yang kamu cari tidak ditemukan.";

        return;

    }


    // Membuat kartu untuk setiap tugas.
    filteredTasks.forEach((taskItem) => {

        const taskId = taskItem.id;

        const task = taskItem.data;


        // Membuat wadah kartu tugas.
        const item = document.createElement("div");

        item.className = "task-item";


        // Membuat checkbox status tugas.
        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.checked = task.completed === true;

        checkbox.title = "Tandai tugas selesai";


        // Membuat nama tugas.
        const title = document.createElement("span");

        title.textContent = task.title || "(Tanpa nama tugas)";

        if (task.completed === true) {

            title.classList.add("completed-task-title");

        }


        // Membuat informasi deadline.
        const deadline = document.createElement("span");

        deadline.textContent = task.deadline
            ? "Deadline: " + formatDateIndonesia(task.deadline)
            : "Tanpa deadline";


        // Membuat tombol edit.
        const editButton = document.createElement("button");

        editButton.type = "button";

        editButton.textContent = "Edit";

        editButton.className = "edit-btn";

        editButton.addEventListener("click", () => {

            showEditForm(taskId, task, item);

        });


        // Membuat tombol hapus.
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";

        deleteButton.textContent = "Hapus";

        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", async () => {

            const confirmation = confirm(
                "Apakah kamu yakin ingin menghapus tugas ini?"
            );

            if (confirmation) {

                await deleteTask(taskId);

            }

        });


        // Mengubah status tugas ketika checkbox diklik.
        checkbox.addEventListener("change", async () => {

            await changeTaskStatus(taskId, checkbox.checked);

        });


        // Memasukkan semua komponen ke dalam kartu.
        item.appendChild(checkbox);

        item.appendChild(title);

        item.appendChild(deadline);

        item.appendChild(editButton);

        item.appendChild(deleteButton);


        // Menampilkan kartu pada daftar tugas.
        taskList.appendChild(item);

    });

}


// ==================================================
// 9. MENGUBAH STATUS TUGAS
// ==================================================

async function changeTaskStatus(taskId, completed) {

    if (!currentUser) return;

    try {

        // Memperbarui status tugas pada Firebase.
        await updateDoc(
            doc(db, "users", currentUser.uid, "tasks", taskId),
            {
                completed: completed
            }
        );

        // Mengambil ulang data terbaru.
        await loadTasks();

    } catch (error) {

        console.error("Gagal mengubah status tugas:", error);

        alert("Status tugas gagal diperbarui.");

    }

}


// ==================================================
// 10. MENAMPILKAN FORM EDIT TUGAS
// ==================================================

function showEditForm(taskId, task, taskItem) {

    // Membuat formulir edit.
    const editForm = document.createElement("form");

    editForm.className = "task-edit-form";


    // Membuat label nama tugas.
    const titleLabel = document.createElement("label");

    titleLabel.textContent = "Nama tugas";


    // Membuat input nama tugas.
    const titleInput = document.createElement("input");

    titleInput.type = "text";

    titleInput.className = "task-edit-input";

    titleInput.value = task.title || "";

    titleInput.required = true;


    // Membuat label deadline.
    const dateLabel = document.createElement("label");

    dateLabel.textContent = "Deadline";


    // Membuat input deadline.
    const dateInput = document.createElement("input");

    dateInput.type = "date";

    dateInput.className = "task-edit-input";

    dateInput.value = task.deadline || "";


    // Membuat wadah tombol.
    const actions = document.createElement("div");

    actions.className = "task-edit-actions";


    // Membuat tombol simpan.
    const saveButton = document.createElement("button");

    saveButton.type = "submit";

    saveButton.textContent = "Simpan";

    saveButton.className = "task-save-btn";


    // Membuat tombol batal.
    const cancelButton = document.createElement("button");

    cancelButton.type = "button";

    cancelButton.textContent = "Batal";

    cancelButton.className = "task-cancel-btn";


    // Mengembalikan tampilan daftar jika batal.
    cancelButton.addEventListener("click", () => {

        renderTasks();

    });


    // Menyusun tombol.
    actions.appendChild(saveButton);

    actions.appendChild(cancelButton);


    // Menyusun formulir.
    editForm.appendChild(titleLabel);

    editForm.appendChild(titleInput);

    editForm.appendChild(dateLabel);

    editForm.appendChild(dateInput);

    editForm.appendChild(actions);


    // Mengganti kartu lama dengan formulir edit.
    taskItem.innerHTML = "";

    taskItem.appendChild(editForm);


    // Menyimpan perubahan ketika formulir dikirim.
    editForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const newTitle = titleInput.value.trim();

        const newDeadline = dateInput.value;


        // Memeriksa nama tugas.
        if (newTitle === "") {

            alert("Nama tugas tidak boleh kosong.");

            return;

        }

        if (!currentUser) return;


        try {

            // Memperbarui data tugas pada Firebase.
            await updateDoc(
                doc(db, "users", currentUser.uid, "tasks", taskId),
                {
                    title: newTitle,
                    deadline: newDeadline
                }
            );

            // Memperbarui daftar dan kalender.
            await loadTasks();

            alert("Tugas berhasil diperbarui.");

        } catch (error) {

            console.error("Gagal mengedit tugas:", error);

            alert("Tugas gagal diperbarui.");

        }

    });

}


// ==================================================
// 11. MENAMBAHKAN TUGAS BARU
// ==================================================

// Mengambil formulir tambah tugas dari HTML.
const taskForm = document.getElementById("task-form");

if (taskForm) {

    taskForm.addEventListener("submit", async (event) => {

        // Mencegah halaman melakukan refresh.
        event.preventDefault();

        if (!currentUser) {

            alert("Silakan login terlebih dahulu.");

            return;

        }

        // Mengambil input tugas.
        const taskInput = document.getElementById("task-input");

        const taskDate = document.getElementById("task-date");

        const title = taskInput.value.trim();

        const deadline = taskDate.value;


        // Memastikan nama tugas tidak kosong.
        if (title === "") {

            alert("Nama tugas tidak boleh kosong.");

            return;

        }


        try {

            // Menyimpan tugas baru pada koleksi pengguna.
            await addDoc(
                collection(db, "users", currentUser.uid, "tasks"),
                {
                    title: title,
                    deadline: deadline,
                    completed: false,
                    createdAt: serverTimestamp()
                }
            );

            // Mengosongkan formulir.
            taskInput.value = "";

            taskDate.value = "";

            // Memperbarui semua tampilan tugas.
            await loadTasks();

        } catch (error) {

            console.error("Gagal menambahkan tugas:", error);

            alert("Tugas gagal ditambahkan.");

        }

    });

}


// ==================================================
// 12. MENGHAPUS TUGAS
// ==================================================

async function deleteTask(taskId) {

    if (!currentUser) return;

    try {

        // Menghapus tugas berdasarkan ID dokumen.
        await deleteDoc(
            doc(db, "users", currentUser.uid, "tasks", taskId)
        );

        // Memperbarui daftar tugas dan kalender.
        await loadTasks();

    } catch (error) {

        console.error("Gagal menghapus tugas:", error);

        alert("Tugas gagal dihapus.");

    }

}


// ==================================================
// 13. FITUR PENCARIAN
// ==================================================

const taskSearch = document.getElementById("task-search");

if (taskSearch) {

    taskSearch.addEventListener("input", () => {

        // Menampilkan tugas sesuai kata pencarian.
        renderTasks();

    });

}


// ==================================================
// 14. FITUR FILTER
// ==================================================

const taskFilter = document.getElementById("task-filter");

if (taskFilter) {

    taskFilter.addEventListener("change", () => {

        // Menampilkan tugas sesuai status yang dipilih.
        renderTasks();

    });

}


// ==================================================
// 15. MENAMPILKAN KALENDER BULANAN
// ==================================================

function renderCalendar() {

    // Mengambil elemen kalender dari HTML.
    const calendarGrid = document.getElementById("calendar-grid");

    const monthLabel = document.getElementById("calendar-month-label");

    // Jika elemen kalender belum tersedia, hentikan proses.
    if (!calendarGrid || !monthLabel) return;


    // Mengambil tahun dan bulan yang sedang ditampilkan.
    const year = displayedMonth.getFullYear();

    const month = displayedMonth.getMonth();


    // Menampilkan nama bulan dan tahun.
    monthLabel.textContent = new Date(year, month, 1)
        .toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric"
        });


    // Menghapus kalender sebelumnya.
    calendarGrid.innerHTML = "";


    // Membuat nama hari.
    const dayNames = [
        "Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"
    ];

    dayNames.forEach((dayName) => {

        const dayHeader = document.createElement("div");

        dayHeader.className = "calendar-weekday";

        dayHeader.textContent = dayName;

        calendarGrid.appendChild(dayHeader);

    });


    // Menentukan hari pertama pada bulan tersebut.
    const firstDay = new Date(year, month, 1).getDay();

    // Menentukan jumlah hari dalam bulan tersebut.
    const totalDays = new Date(year, month + 1, 0).getDate();


    // Membuat kotak kosong sebelum tanggal pertama.
    for (let i = 0; i < firstDay; i++) {

        const emptyDay = document.createElement("div");

        emptyDay.className = "calendar-empty";

        calendarGrid.appendChild(emptyDay);

    }


    // Membuat tombol untuk setiap tanggal.
    for (let day = 1; day <= totalDays; day++) {

        const dateString = getLocalDateString(
            new Date(year, month, day)
        );


        // Memeriksa apakah tanggal memiliki tugas.
        const tasksOnDate = allTasks.filter((taskItem) => {

            return taskItem.data.deadline === dateString;

        });


        // Membuat tombol tanggal.
        const dayButton = document.createElement("button");

        dayButton.type = "button";

        dayButton.className = "calendar-day";

        dayButton.textContent = day;

        dayButton.dataset.date = dateString;


        // Memberi tanda jika tanggal sedang dipilih.
        if (dateString === selectedDate) {

            dayButton.classList.add("selected");

        }


        // Memberi tanda jika tanggal memiliki tugas.
        if (tasksOnDate.length > 0) {

            dayButton.classList.add("has-tasks");

            // Membuat titik penanda tugas.
            const taskDot = document.createElement("span");

            taskDot.className = "calendar-task-dot";

            dayButton.appendChild(taskDot);

        }


        // Memberi tanda khusus untuk tanggal hari ini.
        if (dateString === getLocalDateString(new Date())) {

            dayButton.classList.add("today");

        }


        // Ketika tanggal dipilih, tampilkan tugas hari tersebut.
        dayButton.addEventListener("click", () => {

            selectedDate = dateString;

            // Memperbarui kalender.
            renderCalendar();

            // Memperbarui daftar tugas harian.
            renderDailyTasks();

            // Berpindah ke tampilan harian.
            showCalendarView("day");

        });


        // Memasukkan tombol tanggal ke kalender.
        calendarGrid.appendChild(dayButton);

    }

}


// ==================================================
// 16. MENAMPILKAN DAFTAR TUGAS HARIAN
// ==================================================

function renderDailyTasks() {

    // Mengambil elemen daftar tugas harian.
    const dailyTaskList = document.getElementById("daily-task-list");

    const selectedDateLabel = document.getElementById("selected-date-label");

    if (!dailyTaskList) return;


    // Menampilkan tanggal yang dipilih.
    if (selectedDateLabel) {

        selectedDateLabel.textContent =
            formatDateIndonesia(selectedDate);

    }


    // Menghapus daftar sebelumnya.
    dailyTaskList.innerHTML = "";


    // Mengambil tugas yang memiliki deadline sesuai tanggal.
    const dailyTasks = allTasks.filter((taskItem) => {

        return taskItem.data.deadline === selectedDate;

    });


    // Jika tidak ada tugas pada tanggal tersebut.
    if (dailyTasks.length === 0) {

        dailyTaskList.textContent =
            "Tidak ada tugas pada tanggal ini.";

        return;

    }


    // Mengurutkan tugas agar yang belum selesai tampil dahulu.
    dailyTasks.sort((a, b) => {

        return Number(a.data.completed === true) -
               Number(b.data.completed === true);

    });


    // Menampilkan setiap tugas.
    dailyTasks.forEach((taskItem) => {

        const task = taskItem.data;


        // Membuat kartu tugas harian.
        const taskCard = document.createElement("div");

        taskCard.className = "daily-task-card";


        // Membuat nama tugas.
        const taskTitle = document.createElement("span");

        taskTitle.className = "daily-task-title";

        taskTitle.textContent = task.title || "(Tanpa nama tugas)";


        // Membuat keterangan status.
        const taskStatus = document.createElement("span");

        taskStatus.className = "daily-task-status";

        if (task.completed === true) {

            taskStatus.textContent = "Selesai";

            taskStatus.classList.add("completed");

        } else {

            taskStatus.textContent = "Belum selesai";

            taskStatus.classList.add("pending");

        }


        // Menyusun kartu.
        taskCard.appendChild(taskTitle);

        taskCard.appendChild(taskStatus);


        // Menampilkan kartu pada daftar harian.
        dailyTaskList.appendChild(taskCard);

    });

}


// ==================================================
// 17. MENGATUR TAMPILAN BULANAN DAN HARIAN
// ==================================================

function showCalendarView(view) {

    // Mengambil wadah tampilan bulanan.
    const monthView = document.getElementById("calendar-month-view");

    // Mengambil wadah tampilan harian.
    const dayView = document.getElementById("calendar-day-view");


    // Mengambil tombol pilihan tampilan.
    const monthButton = document.querySelector(
        '[data-calendar-view="month"]'
    );

    const dayButton = document.querySelector(
        '[data-calendar-view="day"]'
    );


    // Menampilkan kalender bulanan.
    if (monthView) {

        monthView.hidden = view !== "month";

    }

    // Menampilkan daftar harian.
    if (dayView) {

        dayView.hidden = view !== "day";

    }


    // Memberi tanda pada tombol yang sedang aktif.
    if (monthButton) {

        monthButton.classList.toggle("active", view === "month");

    }

    if (dayButton) {

        dayButton.classList.toggle("active", view === "day");

    }

}


// ==================================================
// 18. TOMBOL BERPINDAH BULAN
// ==================================================

// Mengambil tombol bulan sebelumnya.
const previousMonthButton = document.getElementById("calendar-prev");

if (previousMonthButton) {

    previousMonthButton.addEventListener("click", () => {

        // Mengurangi bulan sebanyak satu.
        displayedMonth.setMonth(displayedMonth.getMonth() - 1);

        renderCalendar();

    });

}


// Mengambil tombol bulan berikutnya.
const nextMonthButton = document.getElementById("calendar-next");

if (nextMonthButton) {

    nextMonthButton.addEventListener("click", () => {

        // Menambah bulan sebanyak satu.
        displayedMonth.setMonth(displayedMonth.getMonth() + 1);

        renderCalendar();

    });

}


// ==================================================
// 19. TOMBOL KEMBALI KE TANGGAL HARI INI
// ==================================================

const todayButton = document.getElementById("calendar-today");

if (todayButton) {

    todayButton.addEventListener("click", () => {

        // Mengambil tanggal hari ini.
        const today = new Date();

        selectedDate = getLocalDateString(today);

        displayedMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

        // Memperbarui kalender dan daftar harian.
        renderCalendar();

        renderDailyTasks();

    });

}


// ==================================================
// 20. TOMBOL PILIHAN BULANAN DAN HARIAN
// ==================================================

// Mengambil tombol tampilan bulanan.
const monthViewButton = document.querySelector(
    '[data-calendar-view="month"]'
);

if (monthViewButton) {

    monthViewButton.addEventListener("click", () => {

        showCalendarView("month");

    });

}


// Mengambil tombol tampilan harian.
const dayViewButton = document.querySelector(
    '[data-calendar-view="day"]'
);

if (dayViewButton) {

    dayViewButton.addEventListener("click", () => {

        renderDailyTasks();

        showCalendarView("day");

    });

}


// ==================================================
// 21. TAMPILAN KALENDER PERTAMA KALI
// ==================================================

// Menampilkan kalender bulanan ketika halaman dibuka.
showCalendarView("month");
