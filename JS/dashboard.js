/**
 * @file BudgetWise — Dashboard page.
 * Displays a financial summary (income, expenses, balance) and
 * a list of recent transactions for the authenticated user.
 * @module dashboard
 */

import { requireAuth, apiFetch, fmt, fmtDate, getUser, getCategoryMeta, logout } from "./api.js";

requireAuth();

/** @type {HTMLElement} */
const totalIncomeEl  = document.getElementById("total-income");
/** @type {HTMLElement} */
const totalExpenseEl = document.getElementById("total-expenses");
/** @type {HTMLElement} */
const remainingEl    = document.getElementById("remaining");
/** @type {HTMLElement} */
const numTransEl     = document.getElementById("num-of-trans");
/** @type {HTMLTableSectionElement} */
const tbody          = document.querySelector(".tx-table tbody");
/** @type {HTMLElement} */
const welcomeSubEl   = document.querySelector(".welcome__subtitle");

/** Greet the user by name in the welcome subtitle. */
const user = getUser();
if (welcomeSubEl && user) {
  welcomeSubEl.textContent = `Welcome back, ${user.first_name || user.full_name || "there"}. Your finances are looking great.`;
}

/**
 * An object representing a summary of the user's finances.
 * @typedef {Object} DashboardSummary
 * @property {number|string} total_income
 * @property {number|string} total_expenses
 * @property {number|string} remaining
 * @property {number|string} num_of_trans
 * @property {number|string} total_transactions
 * @property {Array<Transaction>} recent_transactions
 */

/**
 * An object representing a single financial transaction.
 * @typedef {Object} Transaction
 * @property {number} id
 * @property {"income"|"expense"} type
 * @property {string} name
 * @property {number|string} amount
 * @property {number|string} amountOfMoney
 * @property {string} category_display_name
 * @property {string} [category_name]
 * @property {string} date
 * @property {string} dataOfTransaction
 * @property {string} [notes]
 * @property {string} [description]
 */

/**
 * Fetch the dashboard summary from the analytics API and update the UI.
 * @returns {Promise<void>}
 */
async function loadDashboard() {
  try {
    const data = await apiFetch("/api/analytics/dashboard-summary/");
    if (!data) return;

    totalIncomeEl.textContent  = fmt(Math.abs(parseFloat(data.total_income  || 0)));
    totalExpenseEl.textContent = fmt(Math.abs(parseFloat(data.total_expenses || 0)));
    remainingEl.textContent    = fmt(parseFloat(data.remaining || 0));
    numTransEl.textContent     = data.num_of_trans || data.total_transactions || "0";

    if (parseFloat(data.remaining) < 0) {
      remainingEl.style.color = "var(--color-danger, #ef4444)";
    }

    renderRecentTransactions(data.recent_transactions || []);
  } catch (err) {
    console.error("Dashboard load failed:", err);
  }
}

/**
 * Render the 5 most recent transactions into the dashboard table.
 * @param {Array<Transaction>} transactions - Array of transaction objects.
 */
function renderRecentTransactions(transactions) {
  if (!tbody) return;

  if (!transactions.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;padding:2rem;color:var(--color-muted)">
          No transactions yet.
          <a href="transaction.html" style="color:var(--color-primary)">Add your first one →</a>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = transactions
    .slice(0, 5)
    .map((tx) => {
      const isIncome   = (tx.type || "").toLowerCase() === "income";
      const catName    = tx.category_display_name || tx.name || "Other";
      const { icon, color } = getCategoryMeta(catName);
      const rawAmount  = Math.abs(parseFloat(tx.amount || tx.amountOfMoney || 0));
      const amount     = fmt(rawAmount);
      const sign       = isIncome ? "+" : "-";
      const amountCls  = isIncome ? "tx-amount--credit" : "tx-amount--debit";

      return `
        <tr class="tx-row">
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
          <td class="tx-table__td"><span class="tx-date">${fmtDate(tx.date || tx.dataOfTransaction)}</span></td>
          <td class="tx-table__td tx-table__td--right">
            <span class="tx-amount ${amountCls}">${sign}${amount}</span>
          </td>
        </tr>`;
    })
    .join("");
}

document.getElementById("logoutBtn")?.addEventListener("click", logout);
loadDashboard();
