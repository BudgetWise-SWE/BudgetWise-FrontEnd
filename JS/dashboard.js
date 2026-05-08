import {
  getCurrentUser,
  getTransactions,
  formatMoney,
  formatExpenses,
  addTransactionsToTable,
  initializeUserData,
} from "./storage.js";

const numberOfTransaction = document.getElementById("num-of-trans");
const totalIncome = document.getElementById("total-income");
const totalExpenses = document.getElementById("total-expenses");
const remaining = document.getElementById("remaining");

function init() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  initializeUserData();
  loadAndDisplayData();
}

function loadAndDisplayData() {
  const transactions = getTransactions();

  const income = total_income(transactions);
  const expenses = total_expenses(transactions);

  if (totalIncome) totalIncome.textContent = formatMoney(income);
  if (totalExpenses) totalExpenses.textContent = formatExpenses(expenses);
  if (remaining) remaining.textContent = formatMoney(income - expenses);
  if (numberOfTransaction)
    numberOfTransaction.textContent = transactions.length;

  let recentTransactions = [...transactions].reverse();
  if (recentTransactions.length > 4) {
    recentTransactions = recentTransactions.slice(0, 4);
  }

  const tbody = document.querySelector(".tx-table tbody");
  if (tbody) {
    tbody.innerHTML = "";

    if (recentTransactions.length === 0) {
      tbody.innerHTML = `
                <tr class="tx-row">
                    <td colspan="4" style="text-align: center; padding: 48px; color: var(--color-muted);">
                        <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 16px;">receipt_long</span>
                        <p>No transactions yet. Add your first transaction!</p>
                    </td>
                </tr>
            `;
    } else {
      recentTransactions.forEach((transaction) => {
        addTransactionsToTable(transaction);
      });
    }
  }
}

function total_income(transactions) {
  let income = 0;
  transactions.forEach((element) => {
    if (element.type === "Income") {
      income += Number(element.amount);
    }
  });
  return income;
}

function total_expenses(transactions) {
  let expenses = 0;
  transactions.forEach((element) => {
    if (element.type === "Expense") {
      expenses += Number(element.amount);
    }
  });
  return expenses;
}

init();
