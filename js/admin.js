import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- ELEMEN NAVIGASI & SECTION ---
const navProducts = document.getElementById("navProducts");
const navCustomers = document.getElementById("navCustomers");
const navOrders = document.getElementById("navOrders");

const productsSection = document.getElementById("productsSection");
const customersSection = document.getElementById("customersSection");
const ordersSection = document.getElementById("ordersSection");

const allNavBtns = document.querySelectorAll(".nav-btn");
const allSections = document.querySelectorAll(".admin-section");

// --- ELEMEN KONTEN ---
const addProductForm = document.getElementById("addProductForm");
const productList = document.getElementById("productList");
const customerList = document.getElementById("customerList");
const orderList = document.getElementById("orderList");

// --- FUNGSI UNTUK MENAMPILKAN NOTIFIKASI ---
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast-notification ${type} show`;
  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
  }, 3000);
}

// --- FUNGSI UNTUK NAVIGASI TAB ---
function switchTab(activeBtn, activeSection) {
  // Sembunyikan semua section
  allSections.forEach((section) => (section.style.display = "none"));
  // Non-aktifkan semua tombol nav
  allNavBtns.forEach((btn) => btn.classList.remove("active"));

  // Tampilkan section yang aktif
  activeSection.style.display = "block";
  // Aktifkan tombol nav yang sesuai
  activeBtn.classList.add("active");
}

navProducts.addEventListener("click", () => {
  switchTab(navProducts, productsSection);
  loadProducts();
});
navCustomers.addEventListener("click", () => {
  switchTab(navCustomers, customersSection);
  loadCustomers();
});
navOrders.addEventListener("click", () => {
  switchTab(navOrders, ordersSection);
  loadOrders();
});

// --- FUNGSI UNTUK MEMUAT DATA ---

// 1. Memuat Produk (Contoh, bisa disesuaikan dengan kode Anda yang sudah ada)
async function loadProducts() {
  // Logika untuk memuat dan menampilkan produk dari Firestore
  // Anda bisa memindahkan logika yang sudah ada untuk menampilkan produk ke sini
  // Untuk saat ini, kita beri placeholder
  const productsSnapshot = await getDocs(collection(db, "products"));
  productList.innerHTML = ""; // Kosongkan daftar sebelum mengisi
  productsSnapshot.forEach((doc) => {
    const product = doc.data();
    const productEl = document.createElement("div");
    productEl.className = "product-item";
    productEl.setAttribute("data-id", doc.id); // Tambahkan ID dokumen sebagai atribut

    productEl.innerHTML = `
      <img src="${product.img}" alt="${product.name}" />
      <h3>${product.name}</h3>
      <p class="product-category">${product.category || "Tanpa Kategori"}</p>
      <p>${product.desc}</p>
      <p><strong>Rp ${product.price}</strong></p>
      <div class="button-group">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Hapus</button>
      </div>
    `;
    productList.appendChild(productEl);
  });

  // --- TAMBAHKAN FUNGSI UNTUK TOMBOL EDIT ---
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const productItem = e.target.closest(".product-item");
      const productId = productItem.getAttribute("data-id");

      try {
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
          showToast("Produk tidak ditemukan!", "error");
          return;
        }

        const currentProduct = productSnap.data();

        // Gunakan prompt untuk meminta input baru, dengan nilai saat ini sebagai default
        const newName = prompt("Masukkan nama baru:", currentProduct.name);
        const newPrice = prompt("Masukkan harga baru:", currentProduct.price);
        const newCategory = prompt(
          "Masukkan kategori baru (dessert, roti, donat, kue):",
          currentProduct.category
        );
        const newDesc = prompt("Masukkan deskripsi baru:", currentProduct.desc);

        const dataToUpdate = {
          name: newName || currentProduct.name,
          price: Number(newPrice) || currentProduct.price,
          category: newCategory || currentProduct.category,
          desc: newDesc || currentProduct.desc,
        };

        await updateDoc(productRef, dataToUpdate);
        showToast("Produk berhasil diperbarui!");
        loadProducts(); // Muat ulang daftar produk
      } catch (error) {
        console.error("Error updating product: ", error);
        showToast("Gagal memperbarui produk.", "error");
      }
    });
  });

  // --- TAMBAHKAN FUNGSI UNTUK TOMBOL HAPUS ---
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const productItem = e.target.closest(".product-item");
      const productId = productItem.getAttribute("data-id");

      if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
        try {
          await deleteDoc(doc(db, "products", productId));
          showToast("Produk berhasil dihapus!");
          loadProducts(); // Muat ulang daftar produk
        } catch (error) {
          console.error("Error deleting product: ", error);
          showToast("Gagal menghapus produk.", "error");
        }
      }
    });
  });
}

// 2. Memuat Pelanggan
async function loadCustomers() {
  customerList.innerHTML = "Memuat data pelanggan...";
  try {
    const q = query(collection(db, "users"), where("role", "==", "customer"));
    const querySnapshot = await getDocs(q);
    customerList.innerHTML = "";
    if (querySnapshot.empty) {
      customerList.innerHTML = "<p>Belum ada pelanggan yang terdaftar.</p>";
      return;
    }
    querySnapshot.forEach((doc) => {
      const customer = doc.data();
      const customerEl = document.createElement("div");
      customerEl.className = "customer-item";
      customerEl.innerHTML = `
        <h4>${customer.name}</h4>
        <p>Email: ${customer.email}</p>
      `;
      customerList.appendChild(customerEl);
      customerEl.innerHTML = `
        <h4>${customer.name}</h4>
        <p>Email: ${customer.email}</p>
        <p>Role: <strong>${customer.role}</strong></p>
        <div class="button-group">
            <button class="edit-customer-btn" data-id="${doc.id}">Edit</button>
            <button class="delete-customer-btn delete" data-id="${doc.id}">Hapus</button>
        </div>
      `;
      customerList.appendChild(customerEl);
    });

    // Tambahkan event listener untuk tombol edit pelanggan
    document.querySelectorAll(".edit-customer-btn").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const customerId = e.target.getAttribute("data-id");
        const newName = prompt("Masukkan nama baru pelanggan:");
        const newRole = prompt("Masukkan role baru (admin/customer):");
        if ((newName || newRole) && customerId) {
          try {
            const dataToUpdate = {};
            if (newName) dataToUpdate.name = newName;
            if (newRole === "admin" || newRole === "customer")
              dataToUpdate.role = newRole;

            await updateDoc(doc(db, "users", customerId), dataToUpdate);
            showToast("Data pelanggan berhasil diperbarui!");
            loadCustomers();
          } catch (error) {
            showToast("Gagal memperbarui data.", "error");
          }
        }
      });
    });

    // Tambahkan event listener untuk tombol hapus pelanggan
    document.querySelectorAll(".delete-customer-btn").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const customerId = e.target.getAttribute("data-id");
        if (
          confirm(
            "Apakah Anda yakin ingin menghapus pelanggan ini? Ini tidak bisa dibatalkan."
          )
        ) {
          try {
            await deleteDoc(doc(db, "users", customerId));
            showToast("Pelanggan berhasil dihapus!");
            loadCustomers();
          } catch (error) {
            showToast("Gagal menghapus pelanggan.", "error");
          }
        }
      });
    });
  } catch (error) {
    console.error("Error loading customers: ", error);
    customerList.innerHTML = "<p>Gagal memuat data pelanggan.</p>";
  }
}

// 3. Memuat Pesanan
async function loadOrders() {
  orderList.innerHTML = "Memuat data pesanan...";
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    orderList.innerHTML = "";
    if (querySnapshot.empty) {
      orderList.innerHTML = "<p>Belum ada pesanan yang masuk.</p>";
      return;
    }
    querySnapshot.forEach((doc) => {
      const order = doc.data();
      const orderEl = document.createElement("div");
      orderEl.className = "order-item";

      // Pemeriksaan keamanan untuk memastikan order.items adalah array yang valid
      const itemsHtml =
        Array.isArray(order.items) && order.items.length > 0
          ? order.items
              .map(
                (item) =>
                  `<li>${item.name || "Nama tidak ada"} (Rp ${
                    item.price || 0
                  })</li>`
              )
              .join("")
          : "<li>Tidak ada item dalam pesanan ini.</li>";

      orderEl.innerHTML = `
        <h4>Pesanan dari: ${order.userEmail}</h4>
        <p>Tanggal: ${new Date(
          order.createdAt.seconds * 1000
        ).toLocaleString()}</p>
        <p>Metode Pembayaran: ${order.paymentMethod}</p>
        <p><strong>Total: Rp ${order.total}</strong></p>
        <p><strong>Item:</strong></p>
        <ul>${itemsHtml}</ul>        
        <div class="button-group">
            <button class="complete-btn" data-id="${
              doc.id
            }">Pesanan Selesai</button>
        </div>
      `;
      orderList.appendChild(orderEl);
    });

    // Tambahkan event listener untuk tombol "Pesanan Selesai"
    document.querySelectorAll(".complete-btn").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const orderId = e.target.getAttribute("data-id");
        if (
          confirm(
            "Apakah Anda yakin ingin menyelesaikan pesanan ini? Pesanan akan dihapus dari daftar."
          )
        ) {
          try {
            // Di sini kita menghapus pesanan. Alternatifnya bisa memindahkan ke koleksi 'completed_orders'
            await deleteDoc(doc(db, "orders", orderId));
            showToast("Pesanan ditandai selesai!");
            loadOrders(); // Muat ulang daftar pesanan
          } catch (error) {
            showToast("Gagal menyelesaikan pesanan.", "error");
          }
        }
      });
    });
  } catch (error) {
    console.error("Error loading orders: ", error);
    orderList.innerHTML = "<p>Gagal memuat data pesanan.</p>";
  }
}

// --- EVENT LISTENER UNTUK TAMBAH PRODUK ---
addProductForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const price = Number(document.getElementById("price").value);
  const img = document.getElementById("img").value;
  const desc = document.getElementById("desc").value;
  const category = document.getElementById("category").value;

  try {
    await addDoc(collection(db, "products"), {
      name,
      price,
      img,
      desc,
      category,
    });
    showToast("Produk berhasil ditambahkan!");
    addProductForm.reset();
    loadProducts(); // Muat ulang daftar produk
  } catch (error) {
    console.error("Error adding document: ", error);
    showToast("Gagal menambahkan produk.", "error");
  }
});

// --- INISIALISASI ---
// Muat produk saat halaman pertama kali dibuka
loadProducts();
