// history.js - History page functionality with WORKING date filters

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

// ================================================
// TOAST NOTIFICATION SYSTEM
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
  closeBtn.addEventListener("click", () => removeToast(toast));
  const timeoutId = setTimeout(() => removeToast(toast), duration);
  toast.dataset.timeoutId = timeoutId;
}

function removeToast(toast) {
  const timeoutId = toast.dataset.timeoutId;
  if (timeoutId) clearTimeout(parseInt(timeoutId));
  toast.classList.add("toast-hide");
  toast.addEventListener("animationend", () => toast.remove(), { once: true });
}

// ================================================
// HELPER FUNCTIONS
// ================================================

// Parse date string like "Jun 14, 2023" to Date object
function parseTransactionDate(dateString) {
  if (!dateString) return null;

  // Handle "Today" and "Yesterday"
  if (dateString.includes("Today")) {
    return new Date();
  }
  if (dateString.includes("Yesterday")) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  // Parse "MMM DD, YYYY" format
  const monthNames = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const parts = dateString.match(/(\w+)\s+(\d+),\s+(\d{4})/);
  if (parts) {
    const month = monthNames[parts[1]];
    const day = parseInt(parts[2]);
    const year = parseInt(parts[3]);
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Fallback: try standard parsing
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Get all transaction rows
function getTransactionRows() {
  if (!historyTableBody) return [];
  return Array.from(historyTableBody.querySelectorAll(".tx-row"));
}

// Update summary statistics
function updateSummaryStats(visibleRows, totalIncome, totalExpenses) {
  const totalTransactionsSpan = document.getElementById("totalTransactions");
  const totalIncomeSpan = document.getElementById("totalIncome");
  const totalExpensesSpan = document.getElementById("totalExpenses");
  const netBalanceSpan = document.getElementById("netBalance");

  if (totalTransactionsSpan)
    totalTransactionsSpan.textContent = visibleRows.length;
  if (totalIncomeSpan)
    totalIncomeSpan.textContent = `$${totalIncome.toFixed(2)}`;
  if (totalExpensesSpan)
    totalExpensesSpan.textContent = `-$${totalExpenses.toFixed(2)}`;
  if (netBalanceSpan)
    netBalanceSpan.textContent = `$${(totalIncome - totalExpenses).toFixed(2)}`;
}

// Filter transactions
function filterTransactions() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
  const category = categoryFilter ? categoryFilter.value : "";
  const type = typeFilter ? typeFilter.value : "";
  const fromDateStr = dateFrom ? dateFrom.value : "";
  const toDateStr = dateTo ? dateTo.value : "";

  // Convert filter dates to comparable format (only if both are provided)
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

  const rows = getTransactionRows();
  let visibleRows = [];
  let totalIncome = 0;
  let totalExpenses = 0;

  rows.forEach((row) => {
    let show = true;

    // Search filter (by name or note)
    if (searchTerm) {
      const name =
        row.querySelector(".tx-desc__name")?.textContent.toLowerCase() || "";
      const note =
        row.querySelector(".tx-desc__note")?.textContent.toLowerCase() || "";
      if (!name.includes(searchTerm) && !note.includes(searchTerm)) {
        show = false;
      }
    }

    // Category filter
    if (show && category) {
      const rowCategory = row.querySelector(".tx-category")?.textContent || "";
      if (rowCategory !== category) {
        show = false;
      }
    }

    // Type filter (Income vs Expense)
    if (show && type) {
      const amountSpan = row.querySelector(".tx-amount");
      const isCredit = amountSpan?.classList.contains("tx-amount--credit");
      if (type === "credit" && !isCredit) show = false;
      if (type === "debit" && isCredit) show = false;
    }

    // Date range filter - ONLY apply if BOTH from AND to dates are selected
    if (show && dateFilterActive) {
      const dateCells = row.querySelectorAll(".tx-table__td");
      const dateText = dateCells[2]?.textContent || "";
      const rowDate = parseTransactionDate(dateText);

      if (rowDate) {
        if (rowDate < fromDate || rowDate > toDate) {
          show = false;
        }
      }
    }

    row.style.display = show ? "" : "none";
    if (show) {
      visibleRows.push(row);

      // Calculate totals for visible rows
      const amountSpan = row.querySelector(".tx-amount");
      const amountText = amountSpan?.textContent || "0";
      const amount = parseFloat(amountText.replace(/[^0-9.-]/g, ""));

      if (amountSpan?.classList.contains("tx-amount--credit")) {
        totalIncome += amount;
      } else {
        totalExpenses += Math.abs(amount);
      }
    }
  });

  updateSummaryStats(visibleRows, totalIncome, totalExpenses);

  // Show feedback if date filter active but no results
  if (dateFilterActive && visibleRows.length === 0) {
    showToast(
      "No Results",
      `No transactions found between ${fromDateStr} and ${toDateStr}.`,
      "info",
      3000,
    );
  }

  return visibleRows.length;
}

// Reset all filters
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

// Export to CSV
function exportToCSV() {
  const visibleRows = getTransactionRows().filter(
    (row) => row.style.display !== "none",
  );

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
    csvData.push([name, category, date, amount]);
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
// UPDATE SUMMARY TOTALS (Static for demo)
// ================================================

function updateStaticSummary() {
  // These are the totals from the default 8 transactions
  const totalIncome = 4250 + 1200; // Tech Corp + Freelance = 5450
  const totalExpenses = 18.5 + 142 + 9.99 + 15.99 + 89.47 + 10.99; // = 286.94
  // Wait, the HTML shows $8,540 income and $3,210 expenses - those are demo numbers
  // Let's keep the HTML values as they are for demo purposes
}

// ================================================
// PAGINATION (Demo)
// ================================================

function setupPagination() {
  const prevBtn = document.querySelector(".pagination__btn:first-child");
  const nextBtn = document.querySelector(".pagination__btn:last-child");
  const pageButtons = document.querySelectorAll(
    ".pagination__btn:not(:first-child):not(:last-child)",
  );

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      showToast("Pagination", "Previous page - This is a demo.", "info", 2000);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      showToast("Pagination", "Next page - This is a demo.", "info", 2000);
    });
  }

  pageButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      pageButtons.forEach((b) => b.classList.remove("pagination__btn--active"));
      btn.classList.add("pagination__btn--active");
      showToast(
        "Pagination",
        `Page ${btn.textContent} - This is a demo.`,
        "info",
        2000,
      );
    });
  });
}

// ================================================
// EVENT LISTENERS
// ================================================

if (searchInput) searchInput.addEventListener("input", filterTransactions);
if (categoryFilter)
  categoryFilter.addEventListener("change", filterTransactions);
if (typeFilter) typeFilter.addEventListener("change", filterTransactions);
if (dateFrom) dateFrom.addEventListener("change", filterTransactions);
if (dateTo) dateTo.addEventListener("change", filterTransactions);
if (resetFiltersBtn) resetFiltersBtn.addEventListener("click", resetFilters);
if (exportBtn) exportBtn.addEventListener("click", exportToCSV);

// ================================================
// INITIALIZE PAGE
// ================================================

function init() {
  // Initial filter to show all transactions
  filterTransactions();

  // Setup pagination demo
  setupPagination();

  // Show welcome toast message
  setTimeout(() => {
    showToast(
      "📜 Transaction History",
      "Search, filter by category, type, or date range. Date filter only works when BOTH start and end dates are selected!",
      "info",
      5000,
    );
  }, 500);
}

// Start the page
init();
