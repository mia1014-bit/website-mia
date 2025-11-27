import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const formTitle = document.getElementById("formTitle");
const nameInput = document.getElementById("name");
const nameGroup = document.getElementById("nameGroup");
const confirmPasswordInput = document.getElementById("confirmPassword");
const confirmGroup = document.getElementById("confirmGroup");
const submitBtn = document.getElementById("submitBtn");
const switchText = document.getElementById("switchText");

let isRegisterMode = false;

// Fungsi Notifikasi Toast
function showToast(message, type = "error") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast-notification ${type} show`;

  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
  }, 3000);
}

// Toggle Mode Login/Register
function toggleMode() {
  isRegisterMode = !isRegisterMode;

  // Mengambil referensi elemen subtitle dan btnText di dalam tombol
  const subtitle = document.querySelector(".subtitle");
  const btnText = document.getElementById("btnText");

  if (isRegisterMode) {
    formTitle.textContent = "Buat Akun Baru 📝";
    subtitle.textContent = "Isi data untuk mendaftar";
    btnText.textContent = "✨ Daftar Sekarang";
    nameGroup.style.display = "block";
    nameInput.required = true;
    confirmGroup.style.display = "block";
    confirmPasswordInput.required = true;
    switchText.innerHTML = `Sudah punya akun? <a href="#" data-mode="login">Login di sini 🚀</a>`;
  } else {
    formTitle.textContent = "Selamat Datang! 👋";
    subtitle.textContent = "Login untuk mulai berbelanja kue favorit";
    btnText.textContent = "🚀 Login Sekarang";
    nameGroup.style.display = "none";
    nameInput.required = false;
    nameInput.value = "";
    confirmGroup.style.display = "none";
    confirmPasswordInput.required = false;
    confirmPasswordInput.value = "";
    switchText.innerHTML = `Belum punya akun? <a href="#" data-mode="register">Daftar di sini ✨</a>`;
  }
}

// Handle Register
async function handleRegister(email, password, name) {
  const confirmPassword = confirmPasswordInput.value.trim();

  // Validasi nama tidak boleh kosong
  if (name.length < 3) {
    showToast("❌ Nama minimal 3 karakter!", "error");
    return;
  }

  // Validasi password minimal 6 karakter
  if (password.length < 6) {
    showToast("❌ Password minimal 6 karakter!", "error");
    return;
  }

  // Validasi konfirmasi password
  if (password !== confirmPassword) {
    showToast("❌ Konfirmasi password tidak cocok!", "error");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Simpan data tambahan ke Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      role: "customer", // Role default untuk user baru
      createdAt: new Date().toISOString(),
    });

    // Logout otomatis setelah registrasi
    await auth.signOut();

    showToast(
      "✅ Registrasi berhasil! Silakan login untuk melanjutkan.",
      "success"
    );

    // Kembali ke mode login setelah 2 detik
    setTimeout(() => {
      toggleMode(); // Switch ke mode login
      // Pre-fill email yang baru didaftarkan
      document.getElementById("email").value = email;
      document.getElementById("password").value = "";
    }, 2000);
  } catch (error) {
    let message = "❌ Registrasi gagal. Coba lagi.";
    if (error.code === "auth/email-already-in-use") {
      message = "❌ Email sudah terdaftar!";
    } else if (error.code === "auth/weak-password") {
      message = "❌ Password terlalu lemah (minimal 6 karakter)!";
    } else if (error.code === "auth/invalid-email") {
      message = "❌ Format email tidak valid!";
    }
    showToast(message, "error");
    console.error("Registration error:", error);
  }
}

// Handle Login
async function handleLogin(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Ambil data user dari Firestore untuk cek role
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      showToast("✅ Login Berhasil! Mengarahkan...", "success");

      // Arahkan sesuai role dari database
      setTimeout(() => {
        if (userData.role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else {
          window.location.href = "katalog.html";
        }
      }, 1500);
    } else {
      // Default jika data user tidak ditemukan di firestore
      console.log(
        "Data user tidak ditemukan di Firestore, mengarahkan ke halaman pelanggan."
      );
      showToast("✅ Login Berhasil! Mengarahkan...", "success");
      setTimeout(() => {
        window.location.href = "katalog.html";
      }, 1500);
    }
  } catch (error) {
    let message = "";

    switch (error.code) {
      case "auth/user-not-found":
        message = "❌ Email tidak ditemukan!";
        break;
      case "auth/wrong-password":
        message = "❌ Password salah!";
        break;
      case "auth/invalid-email":
        message = "❌ Format email tidak valid!";
        break;
      case "auth/invalid-credential":
        message = "❌ Email atau password salah!";
        break;
      case "auth/too-many-requests":
        message = "❌ Terlalu banyak percobaan login. Coba lagi nanti.";
        break;
      default:
        message = "❌ Login gagal, periksa kembali email & password.";
        break;
    }

    showToast(message, "error");
    console.error("Login error:", error);
  }
}

// Form Submit Handler
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (isRegisterMode) {
    const name = nameInput.value.trim();
    handleRegister(email, password, name);
  } else {
    handleLogin(email, password);
  }
});

// Event Delegation untuk handle klik pada link switch mode
switchText.addEventListener("click", (e) => {
  // Cek apakah elemen yang diklik adalah <a>
  if (e.target.tagName === "A") {
    e.preventDefault();
    toggleMode();
  }
});
