// ============================================================
//  BudgetWise — Transactions Page
// ============================================================
import {
  requireAuth, apiFetch, fmt, fmtDate, getCategoryMeta, toast,
} from "./api.js";

requireAuth();

// ── DOM refs ─────────────────────────────────────────────────
const form          = document.getElementById("transaction-form");
const typeSelect    = document.getElementById("type");
const nameInput     = document.getElementById("name");
const amountInput   = document.getElementById("amount");
const categorySelect= document.getElementById("category");
const dateInput     = document.getElementById("tx-date");
const notesInput    = document.getElementById("notes");
const tbody         = document.querySelector(".tx-table tbody");
const balanceEl     = document.getElementById("total_balance");
const pageInfoEl    = document.querySelector(".pagination__info");
const prevBtn       = document.getElementById("prev-btn");
const nextBtn       = document.getElementById("next-btn");

// ── State ─────────────────────────────────────────────────────
const PAGE_SIZE = 5;
let allTransactions = [];
let currentPage     = 1;

// ── Prefill today's date ──────────────────────────────────────
dateInput.value = new Date().toISOString().split("T")[0];

// ── Load total balance from dashboard summary ─────────────────
async function loadBalance() {
  try {
    const data = await apiFetch("/api/analytics/dashboard-summary/");
    if (data && balanceEl) balanceEl.textContent = fmt(data.total_balance || 0);
  } catch (_) {}
}

// ── Load all transactions ─────────────────────────────────────
async function loadTransactions() {
  try {
    const data = await apiFetch("/api/finance/transactions/");
    allTransactions = Array.isArray(data) ? data : [];
    renderPage(1);
  } catch (err) {
    console.error("Failed to load transactions:", err);
  }
}

// ── Render one page of the table ──────────────────────────────
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
    const isIncome  = tx.type === "income";
    const catName   = tx.category_display_name || "Other";
    const { icon, color } = getCategoryMeta(catName);
    const amount    = fmt(tx.amount || tx.amountOfMoney || 0);
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

// ── Pagination buttons ────────────────────────────────────────
prevBtn.addEventListener("click", () => {
  if (currentPage > 1) renderPage(currentPage - 1);
});
nextBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(allTransactions.length / PAGE_SIZE);
  if (currentPage < totalPages) renderPage(currentPage + 1);
});

// ── Submit new transaction ────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const type        = typeSelect.value.toLowerCase();
  const name        = nameInput.value.trim();
  const amount      = parseFloat(amountInput.value);
  const category_name = categorySelect.value;
  const date        = dateInput.value;
  const notes       = notesInput.value.trim();

  // Basic validation
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

    // Prepend to local list and refresh
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

// ── Init ──────────────────────────────────────────────────────
loadBalance();
loadTransactions();
