import { db } from "./firebase-config.js";
import { collection, query, where, getDocs } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginBtn = document.getElementById("loginSubmit");

// fungsi notifikasi
function showNotif(msg) {
    const notif = document.getElementById("notifBox");
    const text = document.getElementById("notifText");

    text.innerText = msg;
    notif.classList.add("show");

    setTimeout(() => {
        notif.classList.remove("show");
    }, 2500);
}

loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        showNotif("Email & Password harus diisi!");
        return;
    }

    try {
        // mencari user di Firestore berdasarkan email
        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            showNotif("Email tidak ditemukan!");
            return;
        }

        let userData = null;
        querySnapshot.forEach((doc) => {
            userData = doc.data();
        });

        // cek password
        if (userData.password !== password) {
            showNotif("Password salah!");
            return;
        }

        // cek role dan redirect
        if (userData.role === "admin") {
            window.location.href = "admin/index.html";
        } else {
            window.location.href = "pelanggan/index.html";
        }

    } catch (err) {
        showNotif("Terjadi kesalahan, coba lagi!");
    }
});