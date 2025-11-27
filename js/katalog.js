import { db } from "./firebase-config.js";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let products = []; // Array ini akan diisi dari Firestore
const cart = JSON.parse(localStorage.getItem("cart")) || [];
const productList = document.getElementById("productList");
const promoSection = document.getElementById("promoSection");
const productsCollectionRef = collection(db, "products");

// Promo
const promos = [
  "🛍️ Promo 1: Produk di atas Rp 30.000 diskon 10% (Kode: PROMO30)",
  "🛍️ Promo 2: Produk di atas Rp 25.000 diskon 5% (Kode: PROMO21)",
  "🛍️ Promo 3: Belanja di atas Rp 100.000 diskon 20% (Kode: SALE100)",
  "🛍️ Promo 4: Belanja di atas Rp 50.000 diskon 15% (Kode: SALE50)",
];
promoSection.innerHTML = promos.map((p) => `<p>${p}</p>`).join("");

// Fungsi untuk update badge keranjang
function updateCartBadge() {
  const cartBadge = document.getElementById("cartBadge");
  if (cartBadge) {
    const currentCart = JSON.parse(localStorage.getItem("cart")) || [];
    cartBadge.textContent = currentCart.length;
    
    // Tambahkan animasi bounce saat badge update
    cartBadge.style.animation = "none";
    setTimeout(() => {
      cartBadge.style.animation = "bounce 0.5s ease";
    }, 10);
  }
}

// Render Produk
function renderProducts(docs, categoryFilter = "semua", searchTerm = "") {
  productList.innerHTML = "";
  products = []; // Kosongkan array lokal
  
  let filteredCount = 0;
  
  docs.forEach((doc) => {
    const productData = doc.data();
    const product = { id: doc.id, ...productData };

    // Logika filter kategori
    const categoryMatch =
      categoryFilter === "semua" || product.category === categoryFilter;

    // Logika filter pencarian (case-insensitive)
    const searchMatch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (!categoryMatch || !searchMatch) {
      return; // Lewati produk ini jika tidak cocok dengan salah satu filter
    }

    products.push(product); // Isi array lokal dengan data dari Firestore
    filteredCount++;

    const div = document.createElement("div");
    div.className = "product-item";
    div.innerHTML = `
        <img src="${product.img}" alt="${product.name}" />
        <h3>${product.name}</h3>
        <p>${product.desc}</p>
        <div class="star-rating">
          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
        </div>
        <p>💰 Harga: Rp ${product.price.toLocaleString('id-ID')}</p>
        <button onclick="addToCart('${product.id}')">🛒 Tambah ke Keranjang</button>
    `;
    productList.appendChild(div);
  });
  
  // Tampilkan pesan jika tidak ada produk yang cocok
  if (filteredCount === 0) {
    productList.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 4em; margin-bottom: 20px;">🔍</div>
        <h3 style="color: #ff4081; font-size: 1.5em; margin-bottom: 10px;">Produk Tidak Ditemukan</h3>
        <p style="color: #666; font-size: 1.1em;">Coba kata kunci lain atau pilih kategori berbeda</p>
      </div>
    `;
  }
}

// Fungsi Add to Cart dengan Update Badge
window.addToCart = async function (id) {
  try {
    // Ambil data produk terbaru langsung dari Firestore
    const productRef = doc(db, "products", id);
    const docSnap = await getDoc(productRef);

    if (docSnap.exists()) {
      const product = { id: docSnap.id, ...docSnap.data() };
      
      // Ambil cart terbaru dari localStorage
      const currentCart = JSON.parse(localStorage.getItem("cart")) || [];
      currentCart.push(product);
      
      // Simpan kembali ke localStorage
      localStorage.setItem("cart", JSON.stringify(currentCart));
      
      // Update badge keranjang
      updateCartBadge();
      
      // Tampilkan toast notifikasi
      showToast(`✅ ${product.name} berhasil ditambahkan ke keranjang!`, "success");
    } else {
      showToast("❌ Produk tidak ditemukan!", "error");
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    showToast("❌ Gagal menambahkan ke keranjang.", "error");
  }
};

// Fungsi Notifikasi Toast
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast-notification ${type} show`;

  // Sembunyikan setelah 3 detik
  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
  }, 3000);
}

// --- Logika untuk Filter Kategori ---
let allProductDocs = []; // Simpan semua dokumen produk di sini
const searchInput = document.getElementById("searchInput");

// Fungsi untuk me-render ulang produk berdasarkan filter dan pencarian saat ini
function applyFilters() {
  const currentCategory =
    document.querySelector(".filter-btn.active").dataset.category;
  const currentSearchTerm = searchInput.value;
  renderProducts(allProductDocs, currentCategory, currentSearchTerm);
}

// Tambahkan event listener ke tombol filter
document.querySelectorAll(".filter-btn").forEach((button) => {
  button.addEventListener("click", () => {
    // Hapus kelas 'active' dari semua tombol
    document
      .querySelectorAll(".filter-btn")
      .forEach((btn) => btn.classList.remove("active"));
    // Tambahkan kelas 'active' ke tombol yang diklik
    button.classList.add("active");

    applyFilters();
  });
});

// Tambahkan event listener ke bar pencarian
searchInput.addEventListener("input", applyFilters);

// Dapatkan data produk secara real-time dan tampilkan
onSnapshot(productsCollectionRef, (snapshot) => {
  allProductDocs = snapshot.docs; // Perbarui data lokal saat ada perubahan di database
  applyFilters(); // Render produk dengan filter dan pencarian yang sedang aktif
});

// Update badge saat halaman dimuat
updateCartBadge();

// Update badge saat tab/window menjadi aktif kembali
window.addEventListener('focus', updateCartBadge);

// Update badge saat localStorage berubah (dari tab lain)
window.addEventListener('storage', (e) => {
  if (e.key === 'cart') {
    updateCartBadge();
  }
});