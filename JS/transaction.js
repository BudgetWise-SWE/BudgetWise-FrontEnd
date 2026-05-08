/**
 * @file BudgetWise — Transaction management page.
 * Handles loading categories, submitting new transactions,
 * paginating the transaction list, and displaying the current balance.
 * @module transaction
 */

import {
  requireAuth, apiFetch, fmt, fmtDate, getCategoryMeta, toast, logout,
} from "./api.js";

requireAuth();

/** @type {HTMLFormElement} */
const form          = document.getElementById("transaction-form");
/** @type {HTMLSelectElement} */
const typeSelect    = document.getElementById("type");
/** @type {HTMLInputElement} */
const nameInput     = document.getElementById("name");
/** @type {HTMLInputElement} */
const amountInput   = document.getElementById("amount");
/** @type {HTMLSelectElement} */
const categorySelect= document.getElementById("category");
/** @type {HTMLInputElement} */
const dateInput     = document.getElementById("tx-date");
/** @type {HTMLTextAreaElement} */
const notesInput    = document.getElementById("notes");
/** @type {HTMLTableSectionElement} */
const tbody         = document.querySelector(".tx-table tbody");
/** @type {HTMLElement} */
const balanceEl     = document.getElementById("total_balance");
/** @type {HTMLElement} */
const pageInfoEl    = document.querySelector(".pagination__info");
/** @type {HTMLButtonElement} */
const prevBtn       = document.getElementById("prev-btn");
/** @type {HTMLButtonElement} */
const nextBtn       = document.getElementById("next-btn");

/** Number of transactions per page. @type {number} */
const PAGE_SIZE = 5;
/** All fetched transactions. @type {Array<Object>} */
let allTransactions = [];
/** Current pagination page (1-indexed). @type {number} */
let currentPage     = 1;

/** Prefill the date input with today's date. */
dateInput.value = new Date().toISOString().split("T")[0];

/** All available categories from the API. @type {Array<Object>} */
let allCategories = [];

/**
 * Fetch categories from the API and populate the dropdown.
 * @returns {Promise<void>}
 */
async function loadCategories() {
  try {
    const data = await apiFetch("/api/finance/categories/");
    allCategories = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to load categories:", err);
    toast("Failed to load categories.", "error");
  }
  updateCategoryOptions(getSelectedType());
}

/**
 * Get the currently selected transaction type.
 * @returns {"expense"|"income"} The transaction type.
 */
function getSelectedType() {
  return typeSelect.value || "expense";
}

/**
 * Filter the category dropdown options by the given transaction type.
 * @param {"expense"|"income"} type - The transaction type to filter for.
 */
function updateCategoryOptions(type) {
  const cats = allCategories.filter((c) => (c.type || "").toLowerCase() === type);
  if (!cats.length) {
    categorySelect.innerHTML = `<option value="">-- No categories available --</option>`;
    return;
  }
  categorySelect.innerHTML = cats.map((c) => `<option value="${c.name}">${c.name}</option>`).join("");
}

typeSelect.addEventListener("change", () => {
  updateCategoryOptions(getSelectedType());
});

/**
 * Fetch and display the total balance from the dashboard summary endpoint.
 * @returns {Promise<void>}
 */
async function loadBalance() {
  try {
    const data = await apiFetch("/api/analytics/dashboard-summary/");
    if (data && balanceEl) balanceEl.textContent = fmt(data.total_balance || 0);
  } catch (_) {}
}

/**
 * Fetch all transactions from the API and render the first page.
 * @returns {Promise<void>}
 */
async function loadTransactions() {
  try {
    const data = await apiFetch("/api/finance/transactions/");
    allTransactions = Array.isArray(data) ? data : [];
    renderPage(1);
  } catch (err) {
    console.error("Failed to load transactions:", err);
  }
}

/**
 * Render a single page of the transaction table.
 * @param {number} page - The page number to render (1-indexed).
 */
function renderPage(page) {
  currentPage          = page;
  const totalPages     = Math.max(1, Math.ceil(allTransactions.length / PAGE_SIZE));
  const start          = (page - 1) * PAGE_SIZE;
  const slice          = allTransactions.slice(start, start + PAGE_SIZE);

  pageInfoEl.textContent = `Page ${page} of ${totalPages}`;
  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page >= totalPages;

  if (!slice.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;padding:2rem;color:var(--color-muted)">
          No transactions yet. Add your first one!
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = slice.map((tx) => {
    const isIncome  = (tx.type || "").toLowerCase() === "income";
    const catName   = tx.category_display_name || "Other";
    const { icon, color } = getCategoryMeta(catName);
    const rawAmount = Math.abs(parseFloat(tx.amount || tx.amountOfMoney || 0));
    const amount    = fmt(rawAmount);
    const sign      = isIncome ? "+" : "-";
    const amountCls = isIncome ? "tx-amount--credit" : "tx-amount--debit";

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
        <td class="tx-table__td">
          <span class="tx-badge tx-badge--${color}">${catName}</span>
        </td>
        <td class="tx-table__td tx-table__td--date">${fmtDate(tx.date || tx.dataOfTransaction)}</td>
        <td class="tx-table__td tx-table__td--amount">
          <span class="tx-amount ${amountCls}">${sign}${amount}</span>
        </td>
      </tr>`;
  }).join("");
}

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) renderPage(currentPage - 1);
});
nextBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(allTransactions.length / PAGE_SIZE);
  if (currentPage < totalPages) renderPage(currentPage + 1);
});

/**
 * Handle form submission — create a new transaction via the API.
 * @param {SubmitEvent} e - The form submit event.
 * @returns {Promise<void>}
 */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const type        = typeSelect.value;
  const name        = nameInput.value.trim();
  const amount      = parseFloat(amountInput.value);
  const category_name = categorySelect.value;

  if (!category_name) {
    toast("Please create a category first.", "error");
    return;
  }
  const date        = dateInput.value;
  const notes       = notesInput.value.trim();

  if (!name) {
    toast("Please enter a transaction name.", "error");
    nameInput.focus();
    return;
  }
  if (!amount || amount <= 0) {
    toast("Please enter a valid amount greater than 0.", "error");
    amountInput.focus();
    return;
  }
  if (!date) {
    toast("Please select a date.", "error");
    dateInput.focus();
    return;
  }

  const submitBtn = form.querySelector("button[type='submit']");
  submitBtn.disabled    = true;
  submitBtn.textContent = "Adding…";

  try {
    const newTx = await apiFetch("/api/finance/transactions/", {
      method: "POST",
      body: JSON.stringify({
        type,
        name,
        amount: amount.toString(),
        category_name,
        date,
        notes: notes || null,
      }),
    });

    toast(`Transaction "${name}" added!`);
    form.reset();
    dateInput.value = new Date().toISOString().split("T")[0];

    allTransactions.unshift(newTx);
    renderPage(1);
    loadBalance();
  } catch (err) {
    const msg = err?.amount?.[0] || err?.name?.[0] || err?.detail || "Failed to add transaction.";
    toast(msg, "error");
  } finally {
    submitBtn.disabled    = false;
    submitBtn.innerHTML   = '<span class="material-symbols-outlined">add</span> Add Transaction';
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", logout);
loadCategories();
loadBalance();
loadTransactions();
