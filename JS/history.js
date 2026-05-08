/**
 * @file BudgetWise — Transaction History page.
 * Provides searchable, filterable, paginated transaction history
 * with summary statistics and CSV export functionality.
 * @module history
 */

import { requireAuth, apiFetch, fmt, fmtDate, getCategoryMeta, toast, logout } from "./api.js";

requireAuth();

/** All fetched transactions. @type {Array<Object>} */
let allTransactions  = [];
/** Transactions matching the current filter criteria. @type {Array<Object>} */
let filtered         = [];
/** Number of transactions per page. @type {number} */
const PAGE_SIZE      = 10;
/** Current pagination page (1-indexed). @type {number} */
let currentPage      = 1;

/** @type {HTMLTableSectionElement} */
const tbody              = document.getElementById("historyTableBody");
/** @type {HTMLInputElement} */
const searchInput        = document.getElementById("searchInput");
/** @type {HTMLSelectElement} */
const categoryFilter     = document.getElementById("categoryFilter");
/** @type {HTMLInputElement} */
const dateFromInput      = document.getElementById("dateFrom");
/** @type {HTMLInputElement} */
const dateToInput        = document.getElementById("dateTo");
/** @type {HTMLSelectElement} */
const typeFilter         = document.getElementById("typeFilter");
/** @type {HTMLButtonElement} */
const resetBtn           = document.getElementById("resetFilters");
/** @type {HTMLButtonElement} */
const exportBtn          = document.getElementById("exportBtn");

/** @type {HTMLElement} */
const totalTransEl       = document.getElementById("totalTransactions");
/** @type {HTMLElement} */
const totalIncomeEl      = document.getElementById("totalIncome");
/** @type {HTMLElement} */
const totalExpensesEl    = document.getElementById("totalExpenses");
/** @type {HTMLElement} */
const netBalanceEl       = document.getElementById("netBalance");

/** @type {HTMLElement} */
const pageInfoEl         = document.querySelector(".pagination__info");
/** @type {HTMLElement} */
const paginationControls = document.querySelector(".pagination__controls");

/**
 * Fetch all transactions from the API and apply current filters.
 * @returns {Promise<void>}
 */
async function loadTransactions() {
  try {
    const data = await apiFetch("/api/finance/transactions/");
    allTransactions = Array.isArray(data) ? data : [];
    applyFilters();
  } catch (err) {
    console.error("Failed to load history:", err);
    toast("Failed to load transaction history.", "error");
  }
}

/**
 * Read all filter inputs and re-filter the transaction list,
 * then re-render summary stats and paginated table.
 */
function applyFilters() {
  const search   = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const dateFrom = dateFromInput.value ? new Date(dateFromInput.value) : null;
  const dateTo   = dateToInput.value   ? new Date(dateToInput.value)   : null;
  const type     = typeFilter.value;

  filtered = allTransactions.filter((tx) => {
    const name    = (tx.name || tx.category_display_name || "").toLowerCase();
    const notes   = (tx.notes || tx.description || "").toLowerCase();
    const catName = tx.category_display_name || "";
    const txDate  = new Date(tx.date || tx.dataOfTransaction);
    const isIncome = (tx.type || "").toLowerCase() === "income";

    if (search   && !name.includes(search) && !notes.includes(search)) return false;
    if (category && catName !== category && !(category === "Income" && isIncome)) return false;
    if (dateFrom && txDate < dateFrom) return false;
    if (dateTo   && txDate > new Date(dateTo.getTime() + 86400000)) return false;
    if (type === "credit" && !isIncome) return false;
    if (type === "debit"  && isIncome)  return false;

    return true;
  });

  renderSummaryStats();
  renderPage(1);
}

/**
 * Calculate and render the summary statistics for the filtered transactions
 * (total count, income sum, expense sum, net balance).
 */
function renderSummaryStats() {
  const income   = filtered.filter((t) => (t.type || "").toLowerCase() === "income")
                           .reduce((s, t) => s + Math.abs(parseFloat(t.amount || t.amountOfMoney || 0)), 0);
  const expense  = filtered.filter((t) => (t.type || "").toLowerCase() === "expense")
                           .reduce((s, t) => s + Math.abs(parseFloat(t.amount || t.amountOfMoney || 0)), 0);
  const net      = income - expense;

  totalTransEl.textContent    = filtered.length.toLocaleString();
  totalIncomeEl.textContent   = fmt(income);
  totalExpensesEl.textContent = fmt(expense);
  netBalanceEl.textContent    = fmt(net);

  if (net < 0) netBalanceEl.style.color = "var(--color-danger, #ef4444)";
  else         netBalanceEl.style.color = "";
}

/**
 * Render a single page of the transaction table and update pagination controls.
 * @param {number} page - The page number to render (1-indexed).
 */
function renderPage(page) {
  currentPage      = page;
  const total      = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start      = (page - 1) * PAGE_SIZE;
  const slice      = filtered.slice(start, start + PAGE_SIZE);

  const from = total === 0 ? 0 : start + 1;
  const to   = Math.min(start + PAGE_SIZE, total);
  pageInfoEl.textContent = `Showing ${from}\u2013${to} of ${total.toLocaleString()} transactions`;

  if (!slice.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:2.5rem;color:var(--color-muted)">
          No transactions match your filters.
        </td>
      </tr>`;
  } else {
    tbody.innerHTML = slice.map((tx) => {
      const isIncome   = (tx.type || "").toLowerCase() === "income";
      const catName    = tx.category_display_name || (isIncome ? "Income" : "Other");
      const { icon, color } = getCategoryMeta(catName);
      const rawAmount  = Math.abs(parseFloat(tx.amount || tx.amountOfMoney || 0));
      const amount     = fmt(rawAmount);
      const sign       = isIncome ? "+" : "-";
      const amountCls  = isIncome ? "tx-amount--credit" : "tx-amount--debit";
      const dateStr    = fmtDate(tx.date || tx.dataOfTransaction);

      return `
        <tr class="tx-row" data-id="${tx.id}">
          <td class="tx-table__td">
            <div class="tx-desc">
              <div class="tx-icon tx-icon--${color}">
                <span class="material-symbols-outlined">${icon}</span>
              </div>
              <div class="tx-desc__text">
                <p class="tx-desc__name">${tx.name || catName}</p>
                <p class="tx-desc__note">${tx.notes || tx.description || ""}</p>
              </div>
            </div>
          </td>
          <td class="tx-table__td"><span class="tx-category">${catName}</span></td>
          <td class="tx-table__td">${dateStr}</td>
          <td class="tx-table__td tx-table__td--right">
            <span class="tx-amount ${amountCls}">${sign}${amount}</span>
          </td>
          <td class="tx-table__td tx-table__td--right">
            <button class="icon-btn-sm edit-tx-btn" data-id="${tx.id}" title="Edit">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="icon-btn-sm icon-btn-sm--danger delete-tx-btn" data-id="${tx.id}" title="Delete">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </td>
        </tr>`;
    }).join("");
  }

  renderPagination(page, totalPages);
}

/**
 * Handle edit/delete button clicks on transaction rows.
 * DELETE removes via API and re-renders; EDIT prompts for name/amount then PATCHes.
 * @param {MouseEvent} e - Click event on the table body.
 */
tbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const row = btn.closest("tr");
  if (!row) return;
  const id = row.dataset.id;
  if (!id) return;

  if (btn.classList.contains("delete-tx-btn")) {
    if (!confirm("Delete this transaction? This cannot be undone.")) return;
    try {
      await apiFetch(`/api/finance/transactions/${id}/`, { method: "DELETE" });
      allTransactions = allTransactions.filter((t) => t.id !== parseInt(id));
      toast("Transaction deleted.");
      applyFilters();
    } catch (err) {
      toast(err?.detail || "Failed to delete.", "error");
    }
    return;
  }

  if (btn.classList.contains("edit-tx-btn")) {
    const tx = allTransactions.find((t) => t.id === parseInt(id));
    if (!tx) return;
    const newName = prompt("Transaction name:", tx.name || "");
    if (!newName) return;
    const newAmount = prompt("Amount:", Math.abs(parseFloat(tx.amount || tx.amountOfMoney || 0)));
    if (!newAmount || isNaN(parseFloat(newAmount))) return;
    try {
      const updated = await apiFetch(`/api/finance/transactions/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          name: newName.trim(),
          amount: parseFloat(newAmount).toString(),
        }),
      });
      const idx = allTransactions.findIndex((t) => t.id === parseInt(id));
      if (idx !== -1) allTransactions[idx] = updated;
      toast("Transaction updated.");
      applyFilters();
    } catch (err) {
      toast(err?.detail || "Failed to update.", "error");
    }
  }
});

/**
 * Build and attach pagination button controls.
 * Shows a window of up to 5 page numbers around the current page.
 * @param {number} page - The active page number.
 * @param {number} totalPages - Total number of pages available.
 */
function renderPagination(page, totalPages) {
  if (!paginationControls) return;

  const buttons = [];
  buttons.push(`<button class="pagination__btn" ${page <= 1 ? "disabled" : ""} data-page="${page - 1}">Previous</button>`);

  const start = Math.max(1, page - 2);
  const end   = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p++) {
    buttons.push(
      `<button class="pagination__btn ${p === page ? "pagination__btn--active" : ""}" data-page="${p}">${p}</button>`
    );
  }

  buttons.push(`<button class="pagination__btn" ${page >= totalPages ? "disabled" : ""} data-page="${page + 1}">Next</button>`);
  paginationControls.innerHTML = buttons.join("");

  paginationControls.querySelectorAll(".pagination__btn:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => renderPage(parseInt(btn.dataset.page)));
  });
}

[searchInput, categoryFilter, dateFromInput, dateToInput, typeFilter].forEach((el) => {
  el?.addEventListener("input",  applyFilters);
  el?.addEventListener("change", applyFilters);
});

resetBtn?.addEventListener("click", () => {
  searchInput.value    = "";
  categoryFilter.value = "";
  dateFromInput.value  = "";
  dateToInput.value    = "";
  typeFilter.value     = "";
  applyFilters();
});

/**
 * Export the currently filtered transactions as a CSV file download.
 */
exportBtn?.addEventListener("click", () => {
  if (!filtered.length) {
    toast("No transactions to export.", "error");
    return;
  }

  const headers = ["Date", "Name", "Category", "Type", "Amount", "Notes"];
  const rows = filtered.map((tx) => [
    tx.date || tx.dataOfTransaction || "",
    `"${(tx.name || "").replace(/"/g, '""')}"`,
    tx.category_display_name || "",
    tx.type,
    tx.amount || "0",
    `"${(tx.notes || tx.description || "").replace(/"/g, '""')}"`,
  ]);

  const csv     = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob    = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url     = URL.createObjectURL(blob);
  const link    = document.createElement("a");
  link.href     = url;
  link.download = `budgetwise-transactions-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  toast("Export downloaded!");
});

document.getElementById("logoutBtn")?.addEventListener("click", logout);
loadTransactions();
