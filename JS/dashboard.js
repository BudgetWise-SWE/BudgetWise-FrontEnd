// ============================================================
//  BudgetWise — Dashboard
// ============================================================
import { requireAuth, apiFetch, fmt, fmtDate, getUser, getCategoryMeta } from "./api.js";

requireAuth();

// ── DOM refs ─────────────────────────────────────────────────
const totalIncomeEl  = document.getElementById("total-income");
const totalExpenseEl = document.getElementById("total-expenses");
const remainingEl    = document.getElementById("remaining");
const numTransEl     = document.getElementById("num-of-trans");
const tbody          = document.querySelector(".tx-table tbody");
const welcomeSubEl   = document.querySelector(".welcome__subtitle");

// ── Greet user ───────────────────────────────────────────────
const user = getUser();
if (welcomeSubEl && user) {
  welcomeSubEl.textContent = `Welcome back, ${user.first_name || user.full_name || "there"}. Your finances are looking great.`;
}

// ── Load dashboard summary ────────────────────────────────────
async function loadDashboard() {
  try {
    const data = await apiFetch("/api/analytics/dashboard-summary/");
    if (!data) return;

    totalIncomeEl.textContent  = fmt(data.total_income  || 0);
    totalExpenseEl.textContent = fmt(data.total_expenses || 0);
    remainingEl.textContent    = fmt(data.remaining      || 0);
    numTransEl.textContent     = data.num_of_trans        || data.total_transactions || "0";

    // Colour remaining balance red if negative
    if (parseFloat(data.remaining) < 0) {
      remainingEl.style.color = "var(--color-danger, #ef4444)";
    }

    renderRecentTransactions(data.recent_transactions || []);
  } catch (err) {
    console.error("Dashboard load failed:", err);
  }
}

// ── Render recent transactions table ─────────────────────────
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
      const isIncome   = tx.type === "income";
      const catName    = tx.category_display_name || tx.name || "Other";
      const { icon, color } = getCategoryMeta(catName);
      const amount     = fmt(tx.amount || tx.amountOfMoney || 0);
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

loadDashboard();
