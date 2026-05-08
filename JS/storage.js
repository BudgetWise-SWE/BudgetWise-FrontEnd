

// ================================================
// CORE STORAGE FUNCTIONS
// ================================================

export function getCurrentUser() {
  try {
    const currentUser = localStorage.getItem("currentUser");
    return currentUser ? JSON.parse(currentUser) : null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export function getFromStorage(key, defaultValue) {
  const currentUser = getCurrentUser();
  if (!currentUser) return defaultValue;

  try {
    const userKey = `user_${currentUser.email}_${key}`;
    const data = localStorage.getItem(userKey);

    if (!data) {
      // Initialize with default data if needed
      if (defaultValue !== undefined) {
        setToStore(key, defaultValue);
        return defaultValue;
      }
      return defaultValue;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error(`Error getting ${key} from storage:`, error);
    return defaultValue;
  }
}

export function setToStore(key, value) {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  try {
    const userKey = `user_${currentUser.email}_${key}`;
    localStorage.setItem(userKey, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
    return false;
  }
}

// ================================================
// TRANSACTION FUNCTIONS
// ================================================

export function getTransactions() {
  return getFromStorage("transactions", []);
}

export function addTransaction(transaction) {
  const transactions = getTransactions();
  const newTransaction = {
    ...transaction,
    id: Date.now(),
    createdAt: new Date().toISOString(),
  };
  transactions.push(newTransaction);
  setToStore("transactions", transactions);

  // Update budgets with new spent amounts
  updateBudgetSpentFromTransactions();

  // Update savings progress
  updateSavingsFromTransactions();

  return newTransaction;
}

export function deleteTransaction(transactionId) {
  let transactions = getTransactions();
  transactions = transactions.filter((t) => t.id !== transactionId);
  setToStore("transactions", transactions);

  // Recalculate all budgets
  updateBudgetSpentFromTransactions();
  updateSavingsFromTransactions();
}

// ================================================
// BUDGET FUNCTIONS
// ================================================

export function getBudgets() {
  return getFromStorage("budgets", []);
}

export function addBudget(budget) {
  const budgets = getBudgets();
  const newBudget = {
    ...budget,
    id: Date.now(),
    spent: 0,
  };
  budgets.push(newBudget);
  setToStore("budgets", budgets);

  // Calculate spent amount from existing transactions
  updateBudgetSpentForCategory(newBudget.category, newBudget.month);

  return newBudget;
}

export function updateBudget(budgetId, newLimit) {
  const budgets = getBudgets();
  const index = budgets.findIndex((b) => b.id === budgetId);
  if (index !== -1) {
    budgets[index].limit = newLimit;
    setToStore("budgets", budgets);
    return true;
  }
  return false;
}

export function deleteBudget(budgetId) {
  let budgets = getBudgets();
  budgets = budgets.filter((b) => b.id !== budgetId);
  setToStore("budgets", budgets);
}

// Update spent amount for a specific budget based on transactions
function updateBudgetSpentForCategory(category, month) {
  const transactions = getTransactions();
  const budgets = getBudgets();

  const expensesInCategory = transactions.filter(
    (t) =>
      t.type === "Expense" &&
      t.category === category &&
      t.date.startsWith(month),
  );

  const totalSpent = expensesInCategory.reduce(
    (sum, t) => sum + parseFloat(t.amount),
    0,
  );

  const budgetIndex = budgets.findIndex(
    (b) => b.category === category && b.month === month,
  );
  if (budgetIndex !== -1) {
    budgets[budgetIndex].spent = totalSpent;
    setToStore("budgets", budgets);
  }
}

// Recalculate all budget spent amounts
function updateBudgetSpentFromTransactions() {
  const budgets = getBudgets();
  const transactions = getTransactions();

  budgets.forEach((budget) => {
    const expensesInCategory = transactions.filter(
      (t) =>
        t.type === "Expense" &&
        t.category === budget.category &&
        t.date.startsWith(budget.month),
    );
    budget.spent = expensesInCategory.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0,
    );
  });

  setToStore("budgets", budgets);
}

// ================================================
// CUSTOM CATEGORY FUNCTIONS
// ================================================

export function getCustomCategories() {
  return getFromStorage("customCategories", []);
}

export function addCustomCategory(category) {
  const categories = getCustomCategories();
  const newCategory = {
    ...category,
    id: Date.now(),
  };
  categories.push(newCategory);
  setToStore("customCategories", categories);
  return newCategory;
}

export function updateCustomCategory(categoryId, updates) {
  const categories = getCustomCategories();
  const index = categories.findIndex((c) => c.id === categoryId);
  if (index !== -1) {
    categories[index] = { ...categories[index], ...updates };
    setToStore("customCategories", categories);

    // Update transaction categories if name changed
    if (updates.name) {
      const transactions = getTransactions();
      transactions.forEach((t) => {
        if (t.category === categories[index].name) {
          t.category = updates.name;
        }
      });
      setToStore("transactions", transactions);
    }
    return true;
  }
  return false;
}

export function deleteCustomCategory(categoryId) {
  const categories = getCustomCategories();
  const categoryToDelete = categories.find((c) => c.id === categoryId);
  if (!categoryToDelete) return false;

  const updatedCategories = categories.filter((c) => c.id !== categoryId);
  setToStore("customCategories", updatedCategories);

  // Delete all budgets for this category
  const budgets = getBudgets();
  const updatedBudgets = budgets.filter(
    (b) => b.category !== categoryToDelete.name,
  );
  setToStore("budgets", updatedBudgets);

  return true;
}

// ================================================
// SAVINGS GOAL FUNCTIONS
// ================================================

export function getSavingsGoals() {
  return getFromStorage("savingsGoals", []);
}

export function addSavingsGoal(goal) {
  const goals = getSavingsGoals();
  const newGoal = {
    ...goal,
    id: Date.now(),
    saved: goal.initialDeposit || 0,
    status:
      (goal.initialDeposit || 0) >= goal.target ? "completed" : "in-progress",
    createdAt: new Date().toISOString(),
  };
  goals.push(newGoal);
  setToStore("savingsGoals", goals);
  return newGoal;
}

export function updateSavingsGoal(goalId, updates) {
  const goals = getSavingsGoals();
  const index = goals.findIndex((g) => g.id === goalId);
  if (index !== -1) {
    goals[index] = { ...goals[index], ...updates };

    // Update status based on progress
    if (goals[index].saved >= goals[index].target) {
      goals[index].status = "completed";
    } else {
      goals[index].status = "in-progress";
    }

    setToStore("savingsGoals", goals);
    return true;
  }
  return false;
}

export function deleteSavingsGoal(goalId) {
  let goals = getSavingsGoals();
  goals = goals.filter((g) => g.id !== goalId);
  setToStore("savingsGoals", goals);
}

export function addToSavingsGoal(goalId, amount) {
  const goals = getSavingsGoals();
  const index = goals.findIndex((g) => g.id === goalId);
  if (index !== -1) {
    const newSaved = goals[index].saved + amount;
    goals[index].saved = Math.min(newSaved, goals[index].target);
    goals[index].status =
      goals[index].saved >= goals[index].target ? "completed" : "in-progress";
    setToStore("savingsGoals", goals);
    return goals[index];
  }
  return null;
}

// Update savings goals based on transactions (allocating to savings goals)
function updateSavingsFromTransactions() {
  // This would connect savings goals to specific transactions
  // For now, it's a placeholder for future enhancement
}

// ================================================
// PREDEFINED CATEGORIES (Constant - Same for all users)
// ================================================

export const PREDEFINED_CATEGORIES = [
  { name: "Dining & Drinks", icon: "restaurant", iconType: "orange" },
  { name: "Shopping", icon: "shopping_bag", iconType: "purple" },
  { name: "Transportation", icon: "directions_car", iconType: "blue" },
  { name: "Entertainment", icon: "movie", iconType: "emerald" },
  { name: "Utilities", icon: "bolt", iconType: "red" },
  { name: "Health", icon: "fitness_center", iconType: "green" },
  { name: "Education", icon: "school", iconType: "blue" },
];

// ================================================
// INITIALIZE DEFAULT DATA FOR NEW USER
// ================================================

export function initializeUserData() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  // Check if user already has data initialized
  const existingBudgets = getFromStorage("budgets", null);
  if (existingBudgets !== null) return;

  // Initialize with default budgets
  const currentDate = new Date();
  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

  const defaultBudgets = [
    {
      id: 101,
      category: "Dining & Drinks",
      limit: 500,
      spent: 0,
      month: monthKey,
    },
    { id: 102, category: "Shopping", limit: 500, spent: 0, month: monthKey },
    {
      id: 103,
      category: "Transportation",
      limit: 300,
      spent: 0,
      month: monthKey,
    },
    { id: 104, category: "Utilities", limit: 350, spent: 0, month: monthKey },
    {
      id: 105,
      category: "Entertainment",
      limit: 200,
      spent: 0,
      month: monthKey,
    },
  ];

  setToStore("budgets", defaultBudgets);
  setToStore("customCategories", []);

  const defaultSavingsGoals = [
    {
      id: 1,
      name: "Emergency Fund",
      target: 10000,
      saved: 0,
      deadline: "2026-12",
      icon: "security",
      iconType: "emergency",
      status: "in-progress",
    },
    {
      id: 2,
      name: "Europe Vacation",
      target: 3000,
      saved: 0,
      deadline: "2026-08",
      icon: "beach_access",
      iconType: "vacation",
      status: "in-progress",
    },
  ];

  setToStore("savingsGoals", defaultSavingsGoals);
}

// ================================================
// FORMATTING UTILITIES
// ================================================

export function formatMoney(amount) {
  const sign = amount < 0 ? "-" : "";
  return `${sign}$${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatExpenses(amount) {
  return `$${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function addTransactionsToTable(transaction) {
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

  // Find or create tbody
  let tbody = document.querySelector(".tx-table tbody");
  if (!tbody) {
    const table = document.querySelector(".tx-table");
    if (table) {
      tbody = document.createElement("tbody");
      table.appendChild(tbody);
    }
  }

  if (tbody) {
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
                <span class="tx-badge tx-badge--${color}">${escapeHtml(transaction.category)}</span>
            </td>
            <td class="tx-table__td tx-table__td--date">${transaction.date || transaction.dataOfTransaction || ""}</td>
            <td class="tx-table__td tx-table__td--amount">
                <span class="tx-amount ${amountClass}">${formattedAmount}</span>
            </td>
        `;
    tbody.appendChild(tr);
  }
}

function getIconForCategory(category) {
  const predefined = PREDEFINED_CATEGORIES.find((c) => c.name === category);
  if (predefined) return predefined.icon;
  return "category";
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
