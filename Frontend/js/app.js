// ============================
// CONFIG & GLOBAL STATE
// ============================
const BASE_URL = "http://localhost:5000/api";

let authToken = null;
let currentUser = null;
let books = [];
let myBorrows = [];

const state = {
  category: "All",
  search: "",
  availability: "all",
  sort: "title-asc",
};

// ============================
// API HELPER
// ============================
async function apiRequest(path, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = "Bearer " + authToken;

  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) throw new Error(data.message || data.error || "Request failed");
  return data;
}

// ============================
// DOM ELEMENTS
// ============================
const appWrapper = document.getElementById("appWrapper");
const authModal = document.getElementById("authModal");
const tabLogin = document.getElementById("tabLogin");
const tabSignup = document.getElementById("tabSignup");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const closeAuth = document.getElementById("closeAuth");

const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const userGreeting = document.getElementById("userGreeting");

const btnAdmin = document.getElementById("btnAdmin");
const adminPanel = document.getElementById("adminPanel");
const adminBackBtn = document.getElementById("adminBackBtn");
const adminAddBookForm = document.getElementById("adminAddBookForm");
const adminBooksList = document.getElementById("adminBooksList");

const searchInput = document.getElementById("searchInput");
const categoryList = document.getElementById("categoryList");
const availabilityFilter = document.getElementById("availabilityFilter");
const sortSelect = document.getElementById("sortSelect");
const currentCategoryTitle = document.getElementById("currentCategoryTitle");
const bookCount = document.getElementById("bookCount");
const booksContainer = document.getElementById("booksContainer");

const viewGridBtn = document.getElementById("viewGridBtn");
const viewShelfBtn = document.getElementById("viewShelfBtn");
const themeToggle = document.getElementById("themeToggle");

// ============================
// AUTH MODAL HELPERS
// ============================
function openAuthModal(showLogin = true) {
  authModal.classList.remove("hidden");
  if (showLogin) {
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
  } else {
    tabSignup.classList.add("active");
    tabLogin.classList.remove("active");
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  }
}
function closeAuthModal() {
  authModal.classList.add("hidden");
}

tabLogin.addEventListener("click", () => openAuthModal(true));
tabSignup.addEventListener("click", () => openAuthModal(false));
closeAuth.addEventListener("click", () => currentUser && closeAuthModal());

btnLogin.addEventListener("click", () => openAuthModal(true));

btnLogout.addEventListener("click", () => {
  authToken = null;
  currentUser = null;
  myBorrows = [];
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  updateAuthUI();
  openAuthModal(true);
});

// ============================
// LOGIN
// ============================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const data = await apiRequest("/auth/login", "POST", { email, password });
    authToken = data.token;
    currentUser = data.user;

    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(currentUser));

    await loadBooksFromBackend();
    await loadMyBorrows();
    updateAuthUI();
    closeAuthModal();
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});

// ============================
// SIGNUP
// ============================
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  try {
    await apiRequest("/auth/signup", "POST", { name, email, password });
    alert("Account created! Please login.");
    openAuthModal(true);
  } catch (err) {
    alert("Signup failed: " + err.message);
  }
});

// ============================
// AUTH UI STATE
// ============================
function updateAuthUI() {
  if (currentUser) {
    appWrapper.classList.remove("hidden");
    btnLogin.classList.add("hidden");
    btnLogout.classList.remove("hidden");
    userGreeting.classList.remove("hidden");
    userGreeting.textContent = `Hi, ${currentUser.name}${
      currentUser.role === "admin" ? " (Admin)" : ""
    }`;
  } else {
    appWrapper.classList.add("hidden");
    btnLogin.classList.remove("hidden");
    btnLogout.classList.add("hidden");
    userGreeting.classList.add("hidden");
  }

  if (currentUser && currentUser.role === "admin") {
    btnAdmin.classList.remove("hidden");
  } else {
    btnAdmin.classList.add("hidden");
  }
}

// ============================
// ADMIN PANEL
// ============================
btnAdmin.addEventListener("click", () => {
  adminPanel.classList.remove("hidden");
  appWrapper.classList.add("hidden");
  renderAdminBooks();
});

adminBackBtn.addEventListener("click", () => {
  adminPanel.classList.add("hidden");
  appWrapper.classList.remove("hidden");
});

adminAddBookForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = adminBookTitle.value.trim();
  const author = adminBookAuthor.value.trim();
  const category = adminBookCategory.value.trim();
  const description = adminBookDescription.value.trim();
  const total = Number(adminBookTotal.value);

  try {
    await apiRequest("/books", "POST", {
      title,
      author,
      category,
      description,
      totalCopies: total,
    });
    alert("Book added!");
    adminAddBookForm.reset();
    await loadBooksFromBackend();
    renderAdminBooks();
  } catch (err) {
    alert(err.message);
  }
});

function renderAdminBooks() {
  adminBooksList.innerHTML = "";
  books.forEach((book) => {
    const row = document.createElement("div");
    row.className = "admin-book-row";
    row.innerHTML = `
      <span>${book.title} (${book.availableCopies}/${book.totalCopies})</span>
      <button class="btn-pill" data-del="${book._id}">Delete</button>
    `;
    row.querySelector("[data-del]").addEventListener("click", async () => {
      try {
        await apiRequest(`/books/${book._id}`, "DELETE");
        await loadBooksFromBackend();
        renderAdminBooks();
      } catch (err) {
        alert(err.message);
      }
    });
    adminBooksList.appendChild(row);
  });
}

// ============================
// LOAD BOOKS & BORROWS
// ============================
async function loadBooksFromBackend() {
  try {
    const data = await apiRequest("/books", "GET");
    books = data.map((b) => ({
      _id: b._id,
      title: b.title,
      author: b.author,
      category: b.category || "General",
      description: b.description || "",
      year: b.year || 2000,
      totalCopies: b.totalCopies ?? 0,
      availableCopies: b.availableCopies ?? 0,
      coverUrl: b.coverUrl || null,
      trending: b.trending || false,
    }));
    renderCategories();
    renderBooks();
  } catch (err) {
    alert("Failed to load books: " + err.message);
  }
}

async function loadMyBorrows() {
  if (!currentUser) return;
  try {
    myBorrows = await apiRequest("/borrows/me", "GET");
  } catch {}
}

// ============================
// CATEGORIES
// ============================
function renderCategories() {
  categoryList.innerHTML = "";
  const counts = {};
  books.forEach((b) => {
    counts[b.category] = (counts[b.category] || 0) + 1;
  });

  const btns = [
    { key: "All", label: "All Books", count: books.length },
    ...Object.keys(counts).map((cat) => ({
      key: cat,
      label: cat,
      count: counts[cat],
    })),
  ];

  btns.forEach((item) => {
    const btn = document.createElement("button");
    btn.className =
      "category-btn" + (state.category === item.key ? " active" : "");
    btn.innerHTML = `${item.label}<span>${item.count}</span>`;
    btn.addEventListener("click", () => {
      state.category = item.key;
      renderCategories();
      renderBooks();
    });
    categoryList.appendChild(btn);
  });
}

// ============================
// FILTERED BOOKS
// ============================
function getFilteredBooks() {
  const s = state.search.toLowerCase();

  return books
    .filter((b) => (state.category === "All" ? true : b.category === state.category))
    .filter((b) => {
      if (state.availability === "available") return b.availableCopies > 0;
      if (state.availability === "unavailable") return b.availableCopies <= 0;
      return true;
    })
    .filter(
      (b) =>
        b.title.toLowerCase().includes(s) ||
        b.author.toLowerCase().includes(s) ||
        b.category.toLowerCase().includes(s)
    )
    .sort((a, b) => {
      if (state.sort === "title-asc") return a.title.localeCompare(b.title);
      if (state.sort === "year-desc") return b.year - a.year;
      if (state.sort === "year-asc") return a.year - b.year;
      return 0;
    });
}

// ============================
// CHECK BORROW STATE
// ============================
function isBookBorrowed(bookId) {
  return myBorrows.some(
    (rec) => rec.book && rec.book._id === bookId && !rec.returned
  );
}

function findBorrowRecord(bookId) {
  return myBorrows.find(
    (rec) => rec.book && rec.book._id === bookId && !rec.returned
  );
}

// ============================
// DUMMY PAYMENT FUNCTION
// ============================
async function payForBook(bookId) {
  if (!currentUser) return openAuthModal(true);

  const userId = currentUser._id;

  try {
    const res = await apiRequest("/payment/pay", "POST", {
      amount: 10,
      bookId,
      userId,
    });

    alert("Payment Successful! Transaction ID: " + res.transactionId);

    await loadBooksFromBackend();
    await loadMyBorrows();
    renderBooks();
  } catch (err) {
    alert("Payment failed: " + err.message);
  }
}

// ============================
// RENDER BOOK CARDS
// ============================
function renderBooks() {
  const list = getFilteredBooks();
  booksContainer.innerHTML = "";

  currentCategoryTitle.textContent =
    state.category === "All" ? "All Books" : state.category;
  bookCount.textContent = `${list.length} book(s) in this view`;

  list.forEach((book) => {
    const card = document.createElement("article");
    card.className = "book-card";

    const borrowed = isBookBorrowed(book._id);
    const available = book.availableCopies > 0;

    let btnText = "Pay ₹10 & Borrow";
    let disabled = false;

    if (!currentUser) {
      btnText = "Login to borrow";
    } else if (currentUser.role === "admin") {
      btnText = "Admin cannot borrow";
      disabled = true;
    } else if (borrowed) {
      btnText = "Return Book";
    } else if (!available) {
      btnText = "Unavailable";
      disabled = true;
    }

    // COVER
    const cover = document.createElement("div");
    cover.className = "book-cover-wrapper";

    if (book.coverUrl) {
      cover.innerHTML = `<img src="${book.coverUrl}" class="book-cover-img" alt="${book.title}"/>`;
    } else {
      cover.innerHTML = `<div class="book-cover-title">${book.title}</div>`;
    }

    // INFO SECTION
    const info = document.createElement("div");
    info.innerHTML = `
      <p class="book-title">${book.title}</p>
      <p class="book-author">${book.author}</p>
      <div class="book-meta-row">
        <span class="badge ${available ? "" : "unavailable"}">
          ${available ? "Available" : "Checked out"}
        </span>
        ${book.trending ? '<span class="badge-mini">🔥 Trending</span>' : ""}
      </div>
    `;

    // BUTTON
    const btn = document.createElement("button");
    btn.className = "borrow-btn";
    btn.textContent = btnText;
    btn.disabled = disabled;

    btn.addEventListener("click", async () => {
      if (!currentUser) return openAuthModal(true);
      if (currentUser.role === "admin") return alert("Admins cannot borrow.");

      // Return book
      if (borrowed) {
        const rec = findBorrowRecord(book._id);
        await apiRequest(`/borrows/${rec._id}/return`, "POST");
        alert(`Returned "${book.title}"`);
        await loadBooksFromBackend();
        await loadMyBorrows();
        return renderBooks();
      }

      // Borrow with payment
      payForBook(book._id);
    });

    card.appendChild(cover);
    card.appendChild(info);
    card.appendChild(btn);
    booksContainer.appendChild(card);
  });
}

// ============================
// FILTER LISTENERS
// ============================
searchInput.addEventListener("input", (e) => {
  state.search = e.target.value;
  renderBooks();
});

availabilityFilter.addEventListener("change", (e) => {
  state.availability = e.target.value;
  renderBooks();
});

sortSelect.addEventListener("change", (e) => {
  state.sort = e.target.value;
  renderBooks();
});

// ============================
// VIEW & THEME TOGGLES
// ============================
viewGridBtn.addEventListener("click", () => {
  booksContainer.classList.add("grid-view");
  booksContainer.classList.remove("shelf-view");
  viewGridBtn.classList.add("chip-active");
  viewShelfBtn.classList.remove("chip-active");
});

viewShelfBtn.addEventListener("click", () => {
  booksContainer.classList.remove("grid-view");
  booksContainer.classList.add("shelf-view");
  viewShelfBtn.classList.add("chip-active");
  viewGridBtn.classList.remove("chip-active");
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark")
    ? "☀ Light"
    : "🌙 Dark";
});

// ============================
// INIT
// ============================
(function init() {
  const savedToken = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");

  if (savedToken && savedUser) {
    try {
      authToken = savedToken;
      currentUser = JSON.parse(savedUser);
      updateAuthUI();
      closeAuthModal();
      loadBooksFromBackend();
      loadMyBorrows();
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      authToken = null;
      currentUser = null;
      updateAuthUI();
      openAuthModal(true);
    }
  } else {
    updateAuthUI();
    openAuthModal(true);
  }
})();
