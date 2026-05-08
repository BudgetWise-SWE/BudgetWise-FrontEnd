
import {
  getCurrentUser,
  addTransaction,
  getTransactions,
  setToStore,
  formatMoney,
  addTransactionsToTable,
  initializeUserData,
} from "./storage.js";

// ================================================
// GLOBAL STATE
// ================================================
let currentPage = 1;
const itemsPerPage = 8;
let allTransactions = [];

// DOM Elements
const totalBalanceEl = document.getElementById("total_balance");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const transactionForm = document.getElementById("transaction-form");

// ================================================
// INITIALIZATION
// ================================================
function init() {
  // Check if user is logged in
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // Initialize user data if needed
  initializeUserData();

  // Load transactions
  loadTransactions();

  // Update total balance
  updateTotalBalanceDisplay();

  // Setup event listeners
  if (transactionForm) {
    transactionForm.addEventListener("submit", handleTransactionSubmit);
  }
  if (prevBtn) prevBtn.addEventListener("click", goToPrevPage);
  if (nextBtn) nextBtn.addEventListener("click", goToNextPage);
}

function loadTransactions() {
  allTransactions = getTransactions();
  renderTransactions();
  updatePagination();
}

function renderTransactions() {
  const tableBody = document.querySelector(".tx-table tbody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = [...allTransactions].reverse().slice(start, end);

  pageItems.forEach((transaction) => {
    addTransactionsToTable(transaction);
  });

  if (pageItems.length === 0 && allTransactions.length === 0) {
    tableBody.innerHTML = `
            <tr class="tx-row">
                <td colspan="4" style="text-align: center; padding: 48px; color: var(--color-muted);">
                    <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 16px;">receipt_long</span>
                    <p>No transactions yet. Add your first transaction above!</p>
                </td>
            </tr>
        `;
  }
}

function updateTotalBalanceDisplay() {
  if (!totalBalanceEl) return;

  let total = 0;
  allTransactions.forEach((t) => {
    if (t.type === "Income") {
      total += parseFloat(t.amount);
    } else {
      total -= parseFloat(t.amount);
    }
  });
  totalBalanceEl.textContent = formatMoney(total);
}

function updatePagination() {
  const totalPages = Math.ceil(allTransactions.length / itemsPerPage);

  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

  const pageInfo = document.querySelector(".pagination__info");
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
  }
}

function goToNextPage() {
  const totalPages = Math.ceil(allTransactions.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTransactions();
    updatePagination();
  }
}

function goToPrevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderTransactions();
    updatePagination();
  }
}

// ================================================
// TRANSACTION VALIDATION & SUBMISSION
// ================================================
function validateInputs(name, amount, date) {
  let isValid = true;

  if (!name.value.trim()) {
    name.classList.add("input-error");
    isValid = false;
  } else {
    name.classList.remove("input-error");
    name.classList.add("input-ok");
  }

  if (!amount.value || parseFloat(amount.value) <= 0) {
    amount.classList.add("input-error");
    isValid = false;
  } else {
    amount.classList.remove("input-error");
    amount.classList.add("input-ok");
  }

  if (!date.value) {
    date.classList.add("input-error");
    isValid = false;
  } else {
    date.classList.remove("input-error");
    date.classList.add("input-ok");
  }

  return isValid;
}

function handleTransactionSubmit(e) {
  e.preventDefault();

  const type = document.getElementById("type");
  const name = document.getElementById("name");
  const amount = document.getElementById("amount");
  const category = document.getElementById("category");
  const date = document.getElementById("tx-date");
  const notes = document.getElementById("notes");

  if (!validateInputs(name, amount, date)) {
    return;
  }

  const transaction = {
    type: type.value,
    name: name.value.trim(),
    amount: parseFloat(amount.value),
    category: category.value,
    date: date.value,
    notes: notes.value.trim() || "",
  };

  addTransaction(transaction);

  // Reset form
  name.value = "";
  amount.value = "";
  notes.value = "";
  date.value = new Date().toISOString().split("T")[0];

  // Reload and refresh
  loadTransactions();
  updateTotalBalanceDisplay();
}

// Start the application
init();
