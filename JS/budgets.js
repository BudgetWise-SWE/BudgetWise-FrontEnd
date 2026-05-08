/**
 * @file BudgetWise — Budgets page.
 * Manages monthly budget categories, spending limits, custom categories,
 * and includes full CRUD modals for budgets and categories.
 * @module budgets
 */

import { requireAuth, apiFetch, fmt, toast, logout } from "./api.js";

requireAuth();

/** @type {Array<Object>} */
let budgets         = [];
/** @type {Array<Object>} */
let categoryLimits  = [];
/** @type {Array<Object>} */
let categories      = [];

/** @type {Date} */
let displayDate     = new Date();
/** @type {number|null} */
let pendingDeleteId = null;
/** @type {string|null} */
let pendingDeleteType = null;
/** @type {number|null} */
let editingCategoryId = null;
/** @type {boolean} */
let isLoading       = false;

/** @type {HTMLElement} */
const totalBudgetEl     = document.getElementById("totalBudget");
/** @type {HTMLElement} */
const totalSpentEl      = document.getElementById("totalSpent");
/** @type {HTMLElement} */
const totalRemainingEl  = document.getElementById("totalRemaining");
/** @type {HTMLElement} */
const budgetsContainer  = document.getElementById("budgetsContainer");
/** @type {HTMLElement} */
const currentMonthEl    = document.getElementById("currentMonth");
/** @type {HTMLButtonElement} */
const prevMonthBtn      = document.getElementById("prevMonthBtn");
/** @type {HTMLButtonElement} */
const nextMonthBtn      = document.getElementById("nextMonthBtn");
/** @type {HTMLButtonElement} */
const createBudgetBtn   = document.getElementById("createBudgetBtn");
/** @type {HTMLElement} */
const loadingEl         = document.getElementById("budgetsLoading");
/** @type {HTMLElement} */
const errorEl           = document.getElementById("budgetsError");
/** @type {HTMLButtonElement} */
const retryBtn          = document.getElementById("retryBtn");

/** @type {HTMLElement} */
const createBudgetModal = document.getElementById("createBudgetModal");
/** @type {HTMLFormElement} */
const budgetForm        = document.getElementById("budgetForm");
/** @type {HTMLSelectElement} */
const categorySelect    = document.getElementById("categorySelect");
/** @type {HTMLInputElement} */
const budgetLimitInput  = document.getElementById("budgetLimit");
/** @type {HTMLInputElement} */
const budgetMonthInput  = document.getElementById("budgetMonth");

/** @type {HTMLElement} */
const addCustomCatModal = document.getElementById("addCustomCategoryModal");
/** @type {HTMLFormElement} */
const customCatForm     = document.getElementById("customCategoryForm");
/** @type {HTMLInputElement} */
const customCatNameInput= document.getElementById("customCategoryName");

/** @type {HTMLElement} */
const setBudgetModal    = document.getElementById("setBudgetModal");
/** @type {HTMLFormElement} */
const setBudgetForm     = document.getElementById("setBudgetForm");
/** @type {HTMLElement} */
const setBudgetTitle    = document.getElementById("setBudgetTitle");
/** @type {HTMLInputElement} */
const setBudgetCatInput = document.getElementById("setBudgetCategory");
/** @type {HTMLInputElement} */
const setBudgetLimitInput = document.getElementById("setBudgetLimit");

/** @type {HTMLElement} */
const editCatModal      = document.getElementById("editCategoryModal");
/** @type {HTMLFormElement} */
const editCatForm       = document.getElementById("editCategoryForm");
/** @type {HTMLInputElement} */
const editCatNameInput  = document.getElementById("editCategoryNameInput");

/** @type {HTMLElement} */
const deleteModal       = document.getElementById("deleteConfirmModal");
/** @type {HTMLElement} */
const deleteMsg         = document.getElementById("deleteMessage");
/** @type {HTMLButtonElement} */
const deleteConfirmBtn  = document.getElementById("deleteConfirmBtn");

/** @type {HTMLElement} */
const deleteCatModal    = document.getElementById("deleteCategoryConfirmModal");
/** @type {HTMLButtonElement} */
const deleteCatConfirmBtn = document.getElementById("deleteCategoryConfirmBtn");

/** @type {string[]} */
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

/**
 * Format the current display month as a label string.
 * @returns {string} e.g. "May 2026"
 */
function getMonthLabel() {
  return `${MONTHS[displayDate.getMonth()]} ${displayDate.getFullYear()}`;
}

/** @returns {number} Numeric month (1-12). */
function getMonthNum()  { return displayDate.getMonth() + 1; }

/** @returns {number} Full year. */
function getYearNum()   { return displayDate.getFullYear(); }

/** Update the month label in the UI. */
function updateMonthDisplay() {
  currentMonthEl.textContent = getMonthLabel();
}

/**
 * Extract a human-readable error message from various API error shapes.
 * @param {*} err - The thrown error (object, string, or undefined).
 * @returns {string} A readable error message.
 */
function extractError(err) {
  if (!err) return "An unexpected error occurred.";
  if (typeof err === "string") return err;
  if (err.detail) return err.detail;
  if (err.non_field_errors) return err.non_field_errors.join(", ");
  if (err.message) return err.message;
  const firstKey = Object.keys(err)[0];
  if (firstKey && Array.isArray(err[firstKey])) return err[firstKey][0];
  return "An unexpected error occurred.";
}

/**
 * Toggle the loading state of the budgets page.
 * @param {boolean} loading - Whether to show the loading indicator.
 */
function setLoading(loading) {
  isLoading = loading;
  if (loading) {
    loadingEl.style.display = "block";
    budgetsContainer.style.display = "none";
    errorEl.style.display = "none";
  } else {
    loadingEl.style.display = "none";
    budgetsContainer.style.display = "grid";
  }
}

/**
 * Display an error message in the error placeholder.
 * @param {string} msg - The error message to display.
 */
function showError(msg) {
  errorEl.querySelector(".error-message-text").textContent = msg;
  errorEl.style.display = "block";
  loadingEl.style.display = "none";
  budgetsContainer.style.display = "none";
}

/** Hide the error placeholder. */
function hideError() {
  errorEl.style.display = "none";
}

/**
 * Normalize a limit object — extract plain budget ID and category name
 * from nested object responses that DRF may return.
 * @param {Object} l - Raw limit from API.
 * @returns {Object} Normalized limit with flat `budget` (number) and `category` (string).
 */
function normalizeLimit(l) {
  return {
    ...l,
    budget:   l.budget?.id   ?? l.budget,
    category: l.category?.name ?? l.category,
  };
}

/**
 * Fetch budgets, category limits, and categories in parallel, then render.
 * @returns {Promise<void>}
 */
async function loadAll() {
  setLoading(true);
  hideError();
  try {
    const [budgetData, limitData, catData] = await Promise.all([
      apiFetch("/api/finance/budgets/"),
      apiFetch("/api/finance/budget-category-list/"),
      apiFetch("/api/finance/categories/"),
    ]);

    budgets        = Array.isArray(budgetData) ? budgetData : [];
    categoryLimits = Array.isArray(limitData)  ? limitData.map(normalizeLimit) : [];
    categories     = Array.isArray(catData)    ? catData    : [];

    renderSummaryCards();
    renderBudgets();
    populateCategoryDropdown();
  } catch (err) {
    console.error("Failed to load budgets:", err);
    showError(extractError(err));
    toast("Failed to load budget data.", "error");
  } finally {
    setLoading(false);
  }
}

retryBtn.addEventListener("click", loadAll);

/**
 * Calculate and render the summary cards (total budget, total spent, remaining).
 */
function renderSummaryCards() {
  const monthLimits = categoryLimits.filter((l) => {
    const budget = budgets.find((b) => b.id === l.budget);
    return budget && budget.month === getMonthNum() && budget.year === getYearNum();
  });

  const totalBudget    = monthLimits.reduce((s, l) => s + parseFloat(l.limit  || 0), 0);
  const totalSpent     = monthLimits.reduce((s, l) => s + parseFloat(l.spent  || 0), 0);
  const totalRemaining = totalBudget - totalSpent;

  totalBudgetEl.textContent    = fmt(totalBudget);
  totalSpentEl.textContent     = fmt(totalSpent);
  totalRemainingEl.textContent = fmt(totalRemaining);
  totalRemainingEl.style.color = totalRemaining < 0
    ? "var(--color-danger, #ef4444)"
    : "inherit";
}

/**
 * Look up the category ID from the categories array by name.
 * @param {string} catName - The category display name.
 * @returns {number|null} The category ID, or null if not found.
 */
function getCategoryId(catName) {
  const found = categories.find(
    (c) => c.name.toLowerCase() === catName.toLowerCase()
  );
  return found ? found.id : null;
}

/** Build and render all budget cards into the container. */
function renderBudgets() {
  const monthBudget = budgets.find(
    (b) => b.month === getMonthNum() && b.year === getYearNum()
  );

  const monthLimits = categoryLimits.filter((l) => l.budget === monthBudget?.id);

  const addCatBtn = `
    <button class="btn btn--secondary add-custom-cat-btn" style="margin-bottom:1.5rem;">
      <span class="material-symbols-outlined">add</span> Add Custom Category
    </button>`;

  if (!categories.length) {
    budgetsContainer.innerHTML = addCatBtn + `
      <p class="empty-msg" style="color:var(--color-muted);text-align:center;padding:2rem">
        No categories found. Create one to get started.
      </p>`;
    document.querySelector(".add-custom-cat-btn")?.addEventListener("click", openAddCustomCatModal);
    return;
  }

  const sorted = [...categories].sort((a, b) => {
    const aHas = monthLimits.some((l) => l.category === a.name);
    const bHas = monthLimits.some((l) => l.category === b.name);
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return 0;
  });

  budgetsContainer.innerHTML = addCatBtn +
    sorted.map((cat) => {
      const limit = monthLimits.find((l) => l.category === cat.name);
      return buildBudgetCard(cat, limit, monthBudget);
    }).join("");

  document.querySelector(".add-custom-cat-btn")?.addEventListener("click", openAddCustomCatModal);
  attachCardListeners();
}

/**
 * Build the HTML for a single budget category card.
 * @param {Object} cat - The category object.
 * @param {Object|null} limit - The category limit object (or null).
 * @param {Object|null} monthBudget - The monthly budget object (or null).
 * @returns {string} The card HTML string.
 */
function buildBudgetCard(cat, limit, monthBudget) {
  const catName   = cat.name;
  const isCustom  = !cat.is_predefined;
  const catId     = cat.id;
  const catType   = cat.type || "expense";
  const hasLimit  = !!limit;
  const spent     = parseFloat(limit?.spent  || 0);
  const budgetAmt = parseFloat(limit?.limit  || 0);
  const remaining = parseFloat(limit?.remaining ?? (budgetAmt - spent));
  const progress  = budgetAmt > 0 ? Math.min(100, (spent / budgetAmt) * 100) : 0;
  const status    = limit?.status || "active";

  const barColor =
    progress >= 90 ? "var(--color-danger, #ef4444)" :
    progress >= 75 ? "var(--color-warning, #f59e0b)" :
    "var(--color-primary, #6366f1)";

  const statusBadge =
    status === "exceeded" || progress >= 100
      ? `<span class="budget-status budget-status--over">Over budget</span>`
    : status === "close" || progress >= 75
      ? `<span class="budget-status budget-status--warning">Near limit</span>`
    : progress > 0
      ? `<span class="budget-status budget-status--ok">On track</span>`
      : "";

  const typeBadge = catType === "income"
    ? `<span class="type-badge type-badge--income">Income</span>`
    : `<span class="type-badge type-badge--expense">Expense</span>`;

  const editDeleteBtns = isCustom ? `
    <button class="icon-btn edit-cat-btn" data-cat-id="${catId}" data-cat-name="${catName}" title="Edit category">
      <span class="material-symbols-outlined">edit</span>
    </button>
    <button class="icon-btn delete-cat-btn" data-cat-id="${catId}" data-cat-name="${catName}" title="Delete category">
      <span class="material-symbols-outlined">delete</span>
    </button>` : "";

  if (!hasLimit || !monthBudget) {
    return `
      <div class="budget-card budget-card--empty">
        <div class="budget-card__header">
          <h4 class="budget-card__name">${catName} ${typeBadge}</h4>
          <div class="budget-card__actions">${editDeleteBtns}</div>
        </div>
        <p class="budget-card__no-budget">No budget set for ${getMonthLabel()}</p>
        <button class="btn btn--secondary set-budget-btn"
          data-cat-name="${catName}"
          data-cat-id="${catId}"
          data-limit-id=""
          data-budget-id="${monthBudget?.id || ""}">
          <span class="material-symbols-outlined">add</span> Set Budget
        </button>
      </div>`;
  }

  return `
    <div class="budget-card" data-limit-id="${limit.id}">
      <div class="budget-card__header">
        <h4 class="budget-card__name">${catName} ${typeBadge}</h4>
        <div class="budget-card__actions">
          ${statusBadge}
          <button class="icon-btn set-budget-btn"
            data-cat-name="${catName}"
            data-cat-id="${catId}"
            data-limit-id="${limit.id}"
            data-limit="${budgetAmt}"
            data-budget-id="${limit.budget}"
            title="Edit limit">
            <span class="material-symbols-outlined">edit</span>
          </button>
          <button class="icon-btn delete-budget-btn"
            data-limit-id="${limit.id}"
            data-cat-name="${catName}"
            title="Delete budget">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
      <div class="budget-card__amounts">
        <span>${fmt(spent)} spent</span>
        <span>${fmt(budgetAmt)} limit</span>
      </div>
      <div class="budget-progress-track">
        <div class="budget-progress-fill"
          style="width:${progress.toFixed(1)}%;background:${barColor}">
        </div>
      </div>
      <div class="budget-card__footer">
        <span>${fmt(remaining)} remaining</span>
        <span>${progress.toFixed(0)}%</span>
      </div>
    </div>`;
}

/** Attach click listeners to dynamically rendered budget card buttons. */
function attachCardListeners() {
  document.querySelectorAll(".set-budget-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const { catName, catId, limitId, budgetId, limit } = btn.dataset;
      openSetBudgetModal(catName, catId, limitId, budgetId, limit);
    });
  });

  document.querySelectorAll(".delete-budget-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      pendingDeleteId   = btn.dataset.limitId;
      pendingDeleteType = "budget";
      deleteMsg.textContent = `Delete budget for "${btn.dataset.catName}"? This cannot be undone.`;
      openModal(deleteModal);
    });
  });

  document.querySelectorAll(".edit-cat-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingCategoryId          = btn.dataset.catId;
      editCatNameInput.value     = btn.dataset.catName;
      openModal(editCatModal);
    });
  });

  document.querySelectorAll(".delete-cat-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      pendingDeleteId   = btn.dataset.catId;
      pendingDeleteType = "category";
      openModal(deleteCatModal);
    });
  });
}

/** Populate the budget creation form's category dropdown. */
function populateCategoryDropdown() {
  categorySelect.innerHTML = categories
    .map((c) => `<option value="${c.name}">${c.name}</option>`)
    .join("");
}

/**
 * Enable or disable a button.
 * @param {HTMLButtonElement} btn - The button element.
 * @param {boolean} [disabled=true] - Whether to disable it.
 */
function disableBtn(btn, disabled = true) {
  if (!btn) return;
  btn.disabled = disabled;
  btn.style.opacity = disabled ? "0.6" : "1";
  btn.style.cursor = disabled ? "not-allowed" : "pointer";
}

prevMonthBtn.addEventListener("click", () => {
  displayDate.setMonth(displayDate.getMonth() - 1);
  updateMonthDisplay();
  renderSummaryCards();
  renderBudgets();
});
nextMonthBtn.addEventListener("click", () => {
  displayDate.setMonth(displayDate.getMonth() + 1);
  updateMonthDisplay();
  renderSummaryCards();
  renderBudgets();
});

createBudgetBtn.addEventListener("click", () => {
  budgetMonthInput.value = `${getYearNum()}-${String(getMonthNum()).padStart(2,"0")}`;
  openModal(createBudgetModal);
});

/**
 * Handle the create-budget form submission.
 * Creates a new budget (if needed) and a category limit.
 * @param {SubmitEvent} e - The form submit event.
 * @returns {Promise<void>}
 */
budgetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const catName  = categorySelect.value;
  const limit    = parseFloat(budgetLimitInput.value);
  const monthVal = budgetMonthInput.value;

  if (!catName) { toast("Please select a category.", "error"); return; }
  if (!limit || limit <= 0) { toast("Please enter a valid positive limit.", "error"); return; }
  if (!monthVal) { toast("Please select a month.", "error"); return; }

  const submitBtn = budgetForm.querySelector('button[type="submit"]');
  disableBtn(submitBtn, true);

  const [year, month] = monthVal.split("-").map(Number);

  try {
    let budget = budgets.find((b) => b.month === month && b.year === year);
    if (!budget) {
      budget = await apiFetch("/api/finance/budgets/", {
        method: "POST",
        body: JSON.stringify({ name: `${MONTHS[month-1]} ${year}`, month, year, total_limit: "0" }),
      });
      budgets.push(budget);
    }

    const categoryId = getCategoryId(catName);
    if (!categoryId) {
      toast(`Category "${catName}" not found. Try reloading the page.`, "error");
      disableBtn(submitBtn, false);
      return;
    }

    if (categoryLimits.some((l) => l.budget === budget.id && l.category.toLowerCase() === catName.toLowerCase())) {
      toast(`Budget for "${catName}" already exists this month.`, "error");
      disableBtn(submitBtn, false);
      return;
    }

    let newLimit = await apiFetch("/api/finance/budget-category-limits/", {
      method: "POST",
      body: JSON.stringify({
        budget: budget.id,
        category: categoryId,
        limit: limit.toString(),
        month: monthVal,
      }),
    });
    newLimit = normalizeLimit(newLimit);

    const existingIdx = categoryLimits.findIndex((l) => l.id === newLimit.id);
    if (existingIdx !== -1) {
      categoryLimits[existingIdx] = newLimit;
    } else {
      categoryLimits.push(newLimit);
    }

    toast(`Budget for "${catName}" created!`);
    closeModal(createBudgetModal);
    budgetForm.reset();
    renderSummaryCards();
    renderBudgets();
  } catch (err) {
    toast(extractError(err), "error");
  } finally {
    disableBtn(submitBtn, false);
  }
});

/**
 * Open the set/edit budget modal pre-populated with category data.
 * @param {string} catName - Category display name.
 * @param {string} catId - Category ID.
 * @param {string} limitId - Existing limit ID (empty string for new).
 * @param {string} budgetId - Budget ID.
 * @param {string} currentLimit - Current limit amount.
 */
function openSetBudgetModal(catName, catId, limitId, budgetId, currentLimit) {
  setBudgetTitle.textContent  = limitId ? `Edit Budget \u2014 ${catName}` : `Set Budget \u2014 ${catName}`;
  setBudgetCatInput.value     = catName;
  setBudgetLimitInput.value   = currentLimit || "";
  setBudgetForm.dataset.catName  = catName;
  setBudgetForm.dataset.catId    = catId || "";
  setBudgetForm.dataset.limitId  = limitId || "";
  setBudgetForm.dataset.budgetId = budgetId || "";
  openModal(setBudgetModal);
}

/**
 * Handle the set/edit budget form submission.
 * Creates a new limit or updates an existing one via PATCH.
 * @param {SubmitEvent} e - The form submit event.
 * @returns {Promise<void>}
 */
setBudgetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const { catName, catId, limitId, budgetId } = setBudgetForm.dataset;
  const newLimit = parseFloat(setBudgetLimitInput.value);
  if (!newLimit || newLimit <= 0) {
    toast("Please enter a valid limit.", "error");
    return;
  }

  const submitBtn = setBudgetForm.querySelector('button[type="submit"]');
  disableBtn(submitBtn, true);

  try {
    if (limitId) {
      const updated = normalizeLimit(await apiFetch(`/api/finance/budget-category-limits/${limitId}/`, {
        method: "PATCH",
        body: JSON.stringify({ limit: newLimit.toString() }),
      }));
      const idx = categoryLimits.findIndex((l) => l.id === parseInt(limitId));
      if (idx !== -1) categoryLimits[idx] = updated;
    } else {
      let budget = budgets.find((b) => b.id === parseInt(budgetId));
      if (!budget) {
        budget = await apiFetch("/api/finance/budgets/", {
          method: "POST",
          body: JSON.stringify({
            name: getMonthLabel(), month: getMonthNum(), year: getYearNum(), total_limit: "0",
          }),
        });
        budgets.push(budget);
      }
      const categoryId = catId || getCategoryId(catName);
      if (!categoryId) {
        toast(`Category "${catName}" not found. Try reloading the page.`, "error");
        disableBtn(submitBtn, false);
        return;
      }

      if (categoryLimits.some((l) => l.budget === budget.id && l.category.toLowerCase() === catName.toLowerCase())) {
        toast(`Budget for "${catName}" already exists this month.`, "error");
        disableBtn(submitBtn, false);
        return;
      }

      const created = normalizeLimit(await apiFetch("/api/finance/budget-category-limits/", {
        method: "POST",
        body: JSON.stringify({
          budget: budget.id,
          category: categoryId,
          limit: newLimit.toString(),
          month: `${getYearNum()}-${String(getMonthNum()).padStart(2,"0")}`,
        }),
      }));
      const existingIdx = categoryLimits.findIndex((l) => l.id === created.id);
      if (existingIdx !== -1) {
        categoryLimits[existingIdx] = created;
      } else {
        categoryLimits.push(created);
      }
    }
    toast("Budget saved!");
    closeModal(setBudgetModal);
    renderSummaryCards();
    renderBudgets();
  } catch (err) {
    toast(extractError(err), "error");
  } finally {
    disableBtn(submitBtn, false);
  }
});

/** Confirm deletion of a budget category limit. */
deleteConfirmBtn.addEventListener("click", async () => {
  if (!pendingDeleteId) return;
  disableBtn(deleteConfirmBtn, true);
  try {
    await apiFetch(`/api/finance/budget-category-limits/${pendingDeleteId}/`, { method: "DELETE" });
    categoryLimits = categoryLimits.filter((l) => l.id !== parseInt(pendingDeleteId));
    toast("Budget deleted.");
    closeModal(deleteModal);
    renderSummaryCards();
    renderBudgets();
  } catch (err) {
    toast(extractError(err), "error");
  } finally {
    disableBtn(deleteConfirmBtn, false);
    pendingDeleteId = null;
  }
});

/** Open the add-custom-category modal. */
function openAddCustomCatModal() { openModal(addCustomCatModal); }

/**
 * Handle the custom category form submission.
 * @param {SubmitEvent} e - The form submit event.
 * @returns {Promise<void>}
 */
customCatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = customCatNameInput.value.trim();
  if (!name) { toast("Please enter a category name.", "error"); return; }

  if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    toast(`Category "${name}" already exists.`, "error");
    return;
  }

  const submitBtn = customCatForm.querySelector('button[type="submit"]');
  disableBtn(submitBtn, true);

  try {
    const cat = await apiFetch("/api/finance/categories/", {
      method: "POST",
      body: JSON.stringify({ name, type: document.getElementById("customCategoryType").value }),
    });
    categories.push(cat);
    toast(`Category "${name}" added!`);
    closeModal(addCustomCatModal);
    customCatForm.reset();
    renderBudgets();
  } catch (err) {
    toast(extractError(err), "error");
  } finally {
    disableBtn(submitBtn, false);
  }
});

/**
 * Handle the edit-category form submission.
 * @param {SubmitEvent} e - The form submit event.
 * @returns {Promise<void>}
 */
editCatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = editCatNameInput.value.trim();
  if (!name || !editingCategoryId) return;

  const submitBtn = editCatForm.querySelector('button[type="submit"]');
  disableBtn(submitBtn, true);

  try {
    const updated = await apiFetch(`/api/finance/categories/${editingCategoryId}/`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    const idx = categories.findIndex((c) => c.id === parseInt(editingCategoryId));
    if (idx !== -1) categories[idx] = updated;
    toast("Category updated.");
    closeModal(editCatModal);
    renderBudgets();
  } catch (err) {
    toast(extractError(err), "error");
  } finally {
    disableBtn(submitBtn, false);
  }
});

/** Confirm deletion of a custom category. */
deleteCatConfirmBtn.addEventListener("click", async () => {
  if (!pendingDeleteId) return;
  disableBtn(deleteCatConfirmBtn, true);
  try {
    await apiFetch(`/api/finance/categories/${pendingDeleteId}/`, { method: "DELETE" });
    categories       = categories.filter((c) => c.id !== parseInt(pendingDeleteId));
    toast("Category deleted.");
    closeModal(deleteCatModal);
    renderBudgets();
  } catch (err) {
    toast(extractError(err), "error");
  } finally {
    disableBtn(deleteCatConfirmBtn, false);
    pendingDeleteId = null;
  }
});

/**
 * Open a modal overlay.
 * @param {HTMLElement} modal - The modal element.
 */
function openModal(modal)  { modal.classList.add("modal--open");    modal.style.display = "flex"; }

/**
 * Close a modal overlay.
 * @param {HTMLElement} modal - The modal element.
 */
function closeModal(modal) { modal.classList.remove("modal--open"); modal.style.display = "none"; }

document.querySelectorAll(".modal-close, .cancel-btn, .set-budget-close, .set-budget-cancel, .modal-close-custom, .cancel-custom-btn, .edit-category-close, .edit-category-cancel, .delete-budget-close, .delete-budget-cancel, .delete-category-close, .delete-category-cancel")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".modal").forEach(closeModal);
    });
  });

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(modal);
  });
});

document.getElementById("logoutBtn")?.addEventListener("click", logout);
updateMonthDisplay();
loadAll();
