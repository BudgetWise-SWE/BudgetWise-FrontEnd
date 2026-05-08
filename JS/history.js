import {
  getCurrentUser,
  getTransactions,
  formatMoney,
  initializeUserData,
} from "./storage.js";

// DOM Elements
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const typeFilter = document.getElementById("typeFilter");
const dateFrom = document.getElementById("dateFrom");
const dateTo = document.getElementById("dateTo");
const resetFiltersBtn = document.getElementById("resetFilters");
const exportBtn = document.getElementById("exportBtn");
const toastContainer = document.getElementById("toastContainer");
const historyTableBody = document.getElementById("historyTableBody");

// State
let allTransactions = [];

// ================================================
// INITIALIZATION
// ================================================
function init() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  initializeUserData();
  loadTransactions();
  setupEventListeners();

  setTimeout(() => {
    showToast(
      "📜 Transaction History",
      "Search, filter by category, type, or date range. Date filter only works when BOTH start and end dates are selected!",
      "info",
      5000,
    );
  }, 500);
}

function loadTransactions() {
  allTransactions = getTransactions();
  renderTransactionTable(allTransactions);
  filterTransactions();
}

function renderTransactionTable(transactions) {
  if (!historyTableBody) return;

  historyTableBody.innerHTML = "";

  if (transactions.length === 0) {
    historyTableBody.innerHTML = `
            <tr class="tx-row">
                <td colspan="4" style="text-align: center; padding: 48px; color: var(--color-muted);">
                    <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 16px;">receipt_long</span>
                    <p>No transactions yet.</p>
                </td>
            </tr>
        `;
    return;
  }

  // Display in reverse chronological order (newest first)
  [...transactions].reverse().forEach((transaction) => {
    addTransactionRowToTable(transaction);
  });
}

function addTransactionRowToTable(transaction) {
  const colors = {
    "Dining & Drinks": "orange",
    Shopping: "purple",
    Transportation: "blue",
    Health: "emerald",
    Utilities: "red",
    Entertainment: "gray",
    Income: "green",
  };

  const color = colors[transaction.category] || "gray";
  const displayAmount =
    transaction.type === "Expense"
      ? -Math.abs(transaction.amount)
      : Math.abs(transaction.amount);
  const formattedAmount = formatMoney(displayAmount);
  const amountClass =
    transaction.type === "Expense" ? "tx-amount--debit" : "tx-amount--credit";

  const tr = document.createElement("tr");
  tr.className = "tx-row";
  tr.innerHTML = `
        <td class="tx-table__td">
            <div class="tx-desc">
                <div class="tx-icon tx-icon--${color}">
                    <span class="material-symbols-outlined">${getIconForCategory(transaction.category)}</span>
                </div>
                <div class="tx-desc__text">
                    <p class="tx-desc__name">${escapeHtml(transaction.name)}</p>
                    <p class="tx-desc__note">${escapeHtml(transaction.notes || "")}</p>
                </div>
            </div>
        </td>
        <td class="tx-table__td">
            <span class="tx-category">${escapeHtml(transaction.category)}</span>
        </td>
        <td class="tx-table__td">${transaction.date || ""}</td>
        <td class="tx-table__td tx-table__td--right">
            <span class="tx-amount ${amountClass}">${formattedAmount}</span>
        </td>
    `;
  historyTableBody.appendChild(tr);
}

function getIconForCategory(category) {
  const icons = {
    "Dining & Drinks": "restaurant",
    Shopping: "shopping_bag",
    Transportation: "directions_car",
    Entertainment: "movie",
    Utilities: "bolt",
    Health: "fitness_center",
    Income: "trending_up",
  };
  return icons[category] || "category";
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

// ================================================
// FILTER FUNCTIONS
// ================================================
function parseTransactionDate(dateString) {
  if (!dateString) return null;
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function getTransactionRows() {
  if (!historyTableBody) return [];
  return Array.from(historyTableBody.querySelectorAll(".tx-row"));
}

function filterTransactions() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
  const category = categoryFilter ? categoryFilter.value : "";
  const type = typeFilter ? typeFilter.value : "";
  const fromDateStr = dateFrom ? dateFrom.value : "";
  const toDateStr = dateTo ? dateTo.value : "";

  let fromDate = null;
  let toDate = null;
  let dateFilterActive = false;

  if (fromDateStr && toDateStr) {
    fromDate = new Date(fromDateStr);
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(toDateStr);
    toDate.setHours(23, 59, 59, 999);
    dateFilterActive = true;
  }

  // First filter the data array
  let filteredTransactions = [...allTransactions];

  if (searchTerm) {
    filteredTransactions = filteredTransactions.filter(
      (t) =>
        t.name.toLowerCase().includes(searchTerm) ||
        (t.notes || "").toLowerCase().includes(searchTerm),
    );
  }

  if (category) {
    filteredTransactions = filteredTransactions.filter(
      (t) => t.category === category,
    );
  }

  if (type) {
    if (type === "credit") {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.type === "Income",
      );
    } else if (type === "debit") {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.type === "Expense",
      );
    }
  }

  if (dateFilterActive) {
    filteredTransactions = filteredTransactions.filter((t) => {
      const rowDate = parseTransactionDate(t.date);
      return rowDate && rowDate >= fromDate && rowDate <= toDate;
    });
  }

  // Re-render with filtered data
  renderTransactionTable(filteredTransactions);
  updateSummaryStats(filteredTransactions);

  if (
    dateFilterActive &&
    filteredTransactions.length === 0 &&
    fromDateStr &&
    toDateStr
  ) {
    showToast(
      "No Results",
      `No transactions found between ${fromDateStr} and ${toDateStr}.`,
      "info",
      3000,
    );
  }

  return filteredTransactions.length;
}

function updateSummaryStats(transactions) {
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach((t) => {
    if (t.type === "Income") {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
    }
  });

  const totalTransactionsSpan = document.getElementById("totalTransactions");
  const totalIncomeSpan = document.getElementById("totalIncome");
  const totalExpensesSpan = document.getElementById("totalExpenses");
  const netBalanceSpan = document.getElementById("netBalance");

  if (totalTransactionsSpan)
    totalTransactionsSpan.textContent = transactions.length;
  if (totalIncomeSpan) totalIncomeSpan.textContent = formatMoney(totalIncome);
  if (totalExpensesSpan)
    totalExpensesSpan.textContent = formatMoney(-totalExpenses);
  if (netBalanceSpan)
    netBalanceSpan.textContent = formatMoney(totalIncome - totalExpenses);
}

function resetFilters() {
  if (searchInput) searchInput.value = "";
  if (categoryFilter) categoryFilter.value = "";
  if (typeFilter) typeFilter.value = "";
  if (dateFrom) dateFrom.value = "";
  if (dateTo) dateTo.value = "";

  const visibleCount = filterTransactions();
  showToast(
    "Filters Reset",
    `Showing ${visibleCount} transactions.`,
    "info",
    2000,
  );
}

function exportToCSV() {
  // Get current filtered view from the DOM
  const visibleRows = getTransactionRows();

  if (visibleRows.length === 0) {
    showToast("No Data", "No transactions to export.", "warning");
    return;
  }

  const headers = ["Transaction", "Category", "Date", "Amount"];
  const csvData = [headers];

  visibleRows.forEach((row) => {
    const name = row.querySelector(".tx-desc__name")?.textContent || "";
    const category = row.querySelector(".tx-category")?.textContent || "";
    const dateCells = row.querySelectorAll(".tx-table__td");
    const date = dateCells[2]?.textContent || "";
    const amount = row.querySelector(".tx-amount")?.textContent || "";
    csvData.push([`"${name}"`, `"${category}"`, `"${date}"`, `"${amount}"`]);
  });

  const csvContent = csvData.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showToast(
    "Export Complete",
    `${visibleRows.length} transactions exported to CSV.`,
    "success",
  );
}

// ================================================
// TOAST NOTIFICATION
// ================================================
function showToast(title, message, type = "info", duration = 4000) {
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;

  let iconName = "info";
  switch (type) {
    case "success":
      iconName = "check_circle";
      break;
    case "error":
      iconName = "error";
      break;
    case "warning":
      iconName = "warning";
      break;
    default:
      iconName = "info";
  }

  toast.innerHTML = `
        <div class="toast-icon"><span class="material-symbols-outlined">${iconName}</span></div>
        <div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div>
        <button class="toast-close"><span class="material-symbols-outlined">close</span></button>
    `;

  toastContainer.appendChild(toast);
  const closeBtn = toast.querySelector(".toast-close");
  closeBtn.addEventListener("click", () => toast.remove());
  setTimeout(() => toast.remove(), duration);
}

function setupEventListeners() {
  if (searchInput) searchInput.addEventListener("input", filterTransactions);
  if (categoryFilter)
    categoryFilter.addEventListener("change", filterTransactions);
  if (typeFilter) typeFilter.addEventListener("change", filterTransactions);
  if (dateFrom) dateFrom.addEventListener("change", filterTransactions);
  if (dateTo) dateTo.addEventListener("change", filterTransactions);
  if (resetFiltersBtn) resetFiltersBtn.addEventListener("click", resetFilters);
  if (exportBtn) exportBtn.addEventListener("click", exportToCSV);
}

init();
