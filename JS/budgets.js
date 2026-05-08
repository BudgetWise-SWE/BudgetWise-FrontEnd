import { requireAuth, apiFetch, fmt, toast, logout } from "./api.js";

requireAuth();

let budgets         = [];
let categoryLimits  = [];
let categories      = [];
let customCategories = [];
let currentView     = "predefined";
let displayDate     = new Date();
let pendingDeleteId = null;
let pendingDeleteType = null;
let editingCategoryId = null;
let isLoading       = false;

const totalBudgetEl     = document.getElementById("totalBudget");
const totalSpentEl      = document.getElementById("totalSpent");
const totalRemainingEl  = document.getElementById("totalRemaining");
const budgetsContainer  = document.getElementById("budgetsContainer");
const currentMonthEl    = document.getElementById("currentMonth");
const prevMonthBtn      = document.getElementById("prevMonthBtn");
const nextMonthBtn      = document.getElementById("nextMonthBtn");
const createBudgetBtn   = document.getElementById("createBudgetBtn");
const showPredefinedBtn = document.getElementById("showPredefinedBtn");
const showCustomBtn     = document.getElementById("showCustomBtn");
const loadingEl         = document.getElementById("budgetsLoading");
const errorEl           = document.getElementById("budgetsError");
const retryBtn          = document.getElementById("retryBtn");

const createBudgetModal = document.getElementById("createBudgetModal");
const budgetForm        = document.getElementById("budgetForm");
const categorySelect    = document.getElementById("categorySelect");
const budgetLimitInput  = document.getElementById("budgetLimit");
const budgetMonthInput  = document.getElementById("budgetMonth");

const addCustomCatModal = document.getElementById("addCustomCategoryModal");
const customCatForm     = document.getElementById("customCategoryForm");
const customCatNameInput= document.getElementById("customCategoryName");

const setBudgetModal    = document.getElementById("setBudgetModal");
const setBudgetForm     = document.getElementById("setBudgetForm");
const setBudgetTitle    = document.getElementById("setBudgetTitle");
const setBudgetCatInput = document.getElementById("setBudgetCategory");
const setBudgetLimitInput = document.getElementById("setBudgetLimit");

const editCatModal      = document.getElementById("editCategoryModal");
const editCatForm       = document.getElementById("editCategoryForm");
const editCatNameInput  = document.getElementById("editCategoryNameInput");

const deleteModal       = document.getElementById("deleteConfirmModal");
const deleteMsg         = document.getElementById("deleteMessage");
const deleteConfirmBtn  = document.getElementById("deleteConfirmBtn");

const deleteCatModal    = document.getElementById("deleteCategoryConfirmModal");
const deleteCatConfirmBtn = document.getElementById("deleteCategoryConfirmBtn");

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

function getMonthLabel() {
  return `${MONTHS[displayDate.getMonth()]} ${displayDate.getFullYear()}`;
}
function getMonthNum()  { return displayDate.getMonth() + 1; }
function getYearNum()   { return displayDate.getFullYear(); }

function updateMonthDisplay() {
  currentMonthEl.textContent = getMonthLabel();
}

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

function showError(msg) {
  errorEl.querySelector(".error-message-text").textContent = msg;
  errorEl.style.display = "block";
  loadingEl.style.display = "none";
  budgetsContainer.style.display = "none";
}

function hideError() {
  errorEl.style.display = "none";
}

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
    categoryLimits = Array.isArray(limitData)  ? limitData  : [];
    categories     = Array.isArray(catData)    ? catData    : [];

    customCategories = categories.filter((c) => !c.is_predefined);

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

const PREDEFINED_CATS = ["Dining & Drinks","Shopping","Transportation","Entertainment","Utilities","Health"];

function getCategoryId(catName) {
  const found = categories.find(
    (c) => c.name.toLowerCase() === catName.toLowerCase()
  );
  return found ? found.id : null;
}

function renderBudgets() {
  const monthBudget = budgets.find(
    (b) => b.month === getMonthNum() && b.year === getYearNum()
  );

  const monthLimits = categoryLimits.filter((l) => l.budget === monthBudget?.id);

  if (currentView === "predefined") {
    renderPredefinedView(monthBudget, monthLimits);
  } else {
    renderCustomView(monthBudget, monthLimits);
  }
}

function renderPredefinedView(monthBudget, monthLimits) {
  if (!PREDEFINED_CATS.length) {
    budgetsContainer.innerHTML = `<p class="empty-msg">No predefined categories.</p>`;
    return;
  }

  budgetsContainer.innerHTML = PREDEFINED_CATS.map((catName) => {
    const limit = monthLimits.find((l) => l.category === catName);
    return buildBudgetCard(catName, limit, monthBudget, false);
  }).join("");

  attachCardListeners();
}

function renderCustomView(monthBudget, monthLimits) {
  const addCatBtn = `
    <button class="btn btn--secondary add-custom-cat-btn" style="margin-bottom:1.5rem;">
      <span class="material-symbols-outlined">add</span> Add Custom Category
    </button>`;

  if (!customCategories.length) {
    budgetsContainer.innerHTML = addCatBtn + `
      <p class="empty-msg" style="color:var(--color-muted);text-align:center;padding:2rem">
        No custom categories yet. Create one to get started.
      </p>`;
    document.querySelector(".add-custom-cat-btn")?.addEventListener("click", openAddCustomCatModal);
    return;
  }

  budgetsContainer.innerHTML = addCatBtn +
    customCategories.map((cat) => {
      const limit = monthLimits.find((l) => l.category === cat.name);
      return buildBudgetCard(cat.name, limit, monthBudget, true, cat.id);
    }).join("");

  document.querySelector(".add-custom-cat-btn")?.addEventListener("click", openAddCustomCatModal);
  attachCardListeners();
}

function buildBudgetCard(catName, limit, monthBudget, isCustom, catId = null) {
  const hasLimit   = !!limit;
  const spent      = parseFloat(limit?.spent  || 0);
  const budgetAmt  = parseFloat(limit?.limit  || 0);
  const remaining  = parseFloat(limit?.remaining ?? (budgetAmt - spent));
  const progress   = budgetAmt > 0 ? Math.min(100, (spent / budgetAmt) * 100) : 0;
  const status     = limit?.status || "active";

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
          <h4 class="budget-card__name">${catName}</h4>
          <div class="budget-card__actions">${editDeleteBtns}</div>
        </div>
        <p class="budget-card__no-budget">No budget set for ${getMonthLabel()}</p>
        <button class="btn btn--secondary set-budget-btn"
          data-cat-name="${catName}"
          data-cat-id="${catId || ""}"
          data-limit-id=""
          data-budget-id="${monthBudget?.id || ""}">
          <span class="material-symbols-outlined">add</span> Set Budget
        </button>
      </div>`;
  }

  return `
    <div class="budget-card" data-limit-id="${limit.id}">
      <div class="budget-card__header">
        <h4 class="budget-card__name">${catName}</h4>
        <div class="budget-card__actions">
          ${statusBadge}
          ${editDeleteBtns}
          <button class="icon-btn set-budget-btn"
            data-cat-name="${catName}"
            data-cat-id="${catId || ""}"
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

function populateCategoryDropdown() {
  const cats = currentView === "predefined"
    ? PREDEFINED_CATS.map((n) => ({ name: n }))
    : customCategories;

  categorySelect.innerHTML = cats
    .map((c) => `<option value="${c.name}">${c.name}</option>`)
    .join("");
}

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

showPredefinedBtn.addEventListener("click", () => {
  currentView = "predefined";
  showPredefinedBtn.classList.add("toggle-btn--active");
  showCustomBtn.classList.remove("toggle-btn--active");
  populateCategoryDropdown();
  renderBudgets();
});
showCustomBtn.addEventListener("click", () => {
  currentView = "custom";
  showCustomBtn.classList.add("toggle-btn--active");
  showPredefinedBtn.classList.remove("toggle-btn--active");
  populateCategoryDropdown();
  renderBudgets();
});

createBudgetBtn.addEventListener("click", () => {
  budgetMonthInput.value = `${getYearNum()}-${String(getMonthNum()).padStart(2,"0")}`;
  openModal(createBudgetModal);
});

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

    const newLimit = await apiFetch("/api/finance/budget-category-limits/", {
      method: "POST",
      body: JSON.stringify({
        budget: budget.id,
        category: categoryId,
        limit: limit.toString(),
        month: monthVal,
      }),
    });

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

function openSetBudgetModal(catName, catId, limitId, budgetId, currentLimit) {
  setBudgetTitle.textContent  = limitId ? `Edit Budget — ${catName}` : `Set Budget — ${catName}`;
  setBudgetCatInput.value     = catName;
  setBudgetLimitInput.value   = currentLimit || "";
  setBudgetForm.dataset.catName  = catName;
  setBudgetForm.dataset.catId    = catId || "";
  setBudgetForm.dataset.limitId  = limitId || "";
  setBudgetForm.dataset.budgetId = budgetId || "";
  openModal(setBudgetModal);
}

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
      const updated = await apiFetch(`/api/finance/budget-category-limits/${limitId}/`, {
        method: "PATCH",
        body: JSON.stringify({ limit: newLimit.toString() }),
      });
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
      const created = await apiFetch("/api/finance/budget-category-limits/", {
        method: "POST",
        body: JSON.stringify({
          budget: budget.id,
          category: categoryId,
          limit: newLimit.toString(),
          month: `${getYearNum()}-${String(getMonthNum()).padStart(2,"0")}`,
        }),
      });
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

function openAddCustomCatModal() { openModal(addCustomCatModal); }

customCatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = customCatNameInput.value.trim();
  if (!name) { toast("Please enter a category name.", "error"); return; }

  const submitBtn = customCatForm.querySelector('button[type="submit"]');
  disableBtn(submitBtn, true);

  try {
    const cat = await apiFetch("/api/finance/categories/", {
      method: "POST",
      body: JSON.stringify({ name, type: document.getElementById("customCategoryType").value }),
    });
    categories.push(cat);
    customCategories.push(cat);
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
    const idx = customCategories.findIndex((c) => c.id === parseInt(editingCategoryId));
    if (idx !== -1) customCategories[idx] = updated;
    const idx2 = categories.findIndex((c) => c.id === parseInt(editingCategoryId));
    if (idx2 !== -1) categories[idx2] = updated;
    toast("Category updated.");
    closeModal(editCatModal);
    renderBudgets();
  } catch (err) {
    toast(extractError(err), "error");
  } finally {
    disableBtn(submitBtn, false);
  }
});

deleteCatConfirmBtn.addEventListener("click", async () => {
  if (!pendingDeleteId) return;
  disableBtn(deleteCatConfirmBtn, true);
  try {
    await apiFetch(`/api/finance/categories/${pendingDeleteId}/`, { method: "DELETE" });
    customCategories = customCategories.filter((c) => c.id !== parseInt(pendingDeleteId));
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

function openModal(modal)  { modal.classList.add("modal--open");    modal.style.display = "flex"; }
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
