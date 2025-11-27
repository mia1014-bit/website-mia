import { db, auth } from "./js/firebase-config.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// Ambil cart dari localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const checkoutList = document.getElementById("checkoutList");
const totalEl = document.getElementById("total");
const checkoutBtn = document.getElementById("checkoutBtn");

// Render isi keranjang
function renderCart() {
  checkoutList.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    checkoutList.innerHTML = "<p>Keranjang kosong!</p>";
    totalEl.textContent = "";
    return;
  }

  cart.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "checkout-item";
    div.innerHTML = `
            <img src="../img/${item.img}" alt="${item.name}">
            <div>
                <h3>${item.name}</h3>
                <p>Harga: Rp ${item.price}</p>
            </div>
            <button onclick="removeItem(${i})">Hapus</button>
        `;
    checkoutList.appendChild(div);
    total += item.price;
  });

  totalEl.textContent = `Total: Rp ${total}`;
}

// Hapus item dari keranjang
window.removeItem = function (index) {
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
};

// Checkout
checkoutBtn.addEventListener("click", async () => {
  if (cart.length === 0) {
    alert("Keranjang kosong!");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("Anda harus login untuk melakukan checkout!");
    window.location.href = "index.html";
    return;
  }

  const paymentMethod = prompt(
    "Masukkan metode pembayaran (Tunai/Transfer/Dompet Digital):"
  );
  if (paymentMethod) {
    try {
      // Buat array baru yang bersih dari data keranjang
      const orderItems = cart.map((item) => {
        return {
          name: item.name,
          price: item.price,
          img: item.img,
        };
      });

      const total = cart.reduce((sum, item) => sum + item.price, 0);
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userEmail: user.email,
        items: orderItems, // Gunakan array yang sudah bersih
        total: total,
        paymentMethod: paymentMethod,
        createdAt: serverTimestamp(),
      });
      alert(
        `Pembayaran berhasil dengan metode ${paymentMethod}.\nTotal: Rp ${total}`
      );
      cart = [];
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    } catch (error) {
      console.error("Error placing order: ", error);
      alert("Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.");
    }
  }
});

// Render saat halaman dibuka
renderCart();
