
import {
  getCurrentUser,
  getBudgets,
  addBudget,
  updateBudget,
  deleteBudget,
  getCustomCategories,
  addCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
  PREDEFINED_CATEGORIES,
  initializeUserData,
  getTransactions,
  formatMoney,
} from "./storage.js";

// ================================================
// DOM ELEMENTS
// ================================================
const createBudgetBtn = document.getElementById("createBudgetBtn");
const modal = document.getElementById("createBudgetModal");
const modalClose = document.querySelector(".modal-close");
const cancelBtn = document.querySelector(".cancel-btn");
const budgetForm = document.getElementById("budgetForm");
const toastContainer = document.getElementById("toastContainer");
const budgetsContainer = document.getElementById("budgetsContainer");
const showPredefinedBtn = document.getElementById("showPredefinedBtn");
const showCustomBtn = document.getElementById("showCustomBtn");
const currentMonthEl = document.getElementById("currentMonth");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");

// Set Budget Modal
const setBudgetModal = document.getElementById("setBudgetModal");
const setBudgetForm = document.getElementById("setBudgetForm");
const setBudgetTitle = document.getElementById("setBudgetTitle");
const setBudgetCategory = document.getElementById("setBudgetCategory");
const setBudgetLimitInput = document.getElementById("setBudgetLimit");
const setBudgetClose = document.querySelector(".set-budget-close");
const setBudgetCancel = document.querySelector(".set-budget-cancel");

// Delete Confirmation Modal
const deleteConfirmModal = document.getElementById("deleteConfirmModal");
const deleteTitle = document.getElementById("deleteTitle");
const deleteMessage = document.getElementById("deleteMessage");
const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");

// Edit Custom Category Modal
const editCategoryModal = document.getElementById("editCategoryModal");
const editCategoryForm = document.getElementById("editCategoryForm");
const editCategoryNameInput = document.getElementById("editCategoryNameInput");
const editCategoryIcon = document.getElementById("editCategoryIcon");
const editCategoryClose = document.querySelector(".edit-category-close");
const editCategoryCancel = document.querySelector(".edit-category-cancel");

// Delete Custom Category Modal
const deleteCategoryConfirmModal = document.getElementById(
  "deleteCategoryConfirmModal",
);
const deleteCategoryTitle = document.getElementById("deleteCategoryTitle");
const deleteCategoryMessage = document.getElementById("deleteCategoryMessage");
const deleteCategoryConfirmBtn = document.getElementById(
  "deleteCategoryConfirmBtn",
);

// Custom Category Modal
const customCategoryModal = document.getElementById("addCustomCategoryModal");
const customCategoryForm = document.getElementById("customCategoryForm");
const customModalClose = document.querySelector(".modal-close-custom");
const cancelCustomBtn = document.querySelector(".cancel-custom-btn");

// ================================================
// STATE
// ================================================
let currentView = "predefined";
let currentDate = new Date();
let allBudgets = [];
let allCustomCategories = [];
let allTransactions = [];

// Pending actions storage
let pendingCategoryName = null;
let pendingCategoryId = null;
let currentSetBudgetCategory = null;
let currentSetBudgetHasBudget = false;
let currentSetBudgetId = null;

// ================================================
// INITIALIZATION
// ================================================
function init() {
  // Check if user is logged in
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // Initialize user data if needed
  initializeUserData();

  // Load data from storage
  loadData();

  // Setup event listeners
  setupEventListeners();

  // Render the UI
  updateMonthDisplay();
  setView("predefined");

  showToast(
    "Welcome to Budgets! 📊",
    "Set spending limits and track your progress across categories.",
    "info",
    4000,
  );
}

function loadData() {
  allBudgets = getBudgets();
  allCustomCategories = getCustomCategories();
  allTransactions = getTransactions();

  // Update budget spent amounts from transactions
  updateBudgetSpentFromTransactions();
}

function updateBudgetSpentFromTransactions() {
  allBudgets.forEach((budget) => {
    const expensesInCategory = allTransactions.filter(
      (t) =>
        t.type === "Expense" &&
        t.category === budget.category &&
        t.date &&
        t.date.startsWith(budget.month),
    );
    budget.spent = expensesInCategory.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0,
    );
  });
}

// ================================================
// BUDGET CRUD OPERATIONS
// ================================================
function getBudgetsForCurrentMonth() {
  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  return allBudgets.filter((b) => b.month === monthKey);
}

function handleAddBudget(budget) {
  const existingBudget = allBudgets.find(
    (b) => b.category === budget.category && b.month === budget.month,
  );

  if (existingBudget) {
    updateBudget(existingBudget.id, budget.limit);
    showToast(
      "Budget Updated",
      `${budget.category} budget updated to $${budget.limit.toLocaleString()}.`,
      "success",
    );
  } else {
    addBudget(budget);
    showToast(
      "Budget Created",
      `$${budget.limit.toLocaleString()} budget for ${budget.category}.`,
      "success",
    );
  }
  loadData();
  renderBudgets();
}

function handleUpdateBudget(budgetId, newLimit) {
  updateBudget(budgetId, newLimit);
  loadData();
  renderBudgets();
}

function handleDeleteBudget(budgetId, categoryName) {
  deleteBudget(budgetId);
  showToast(
    "Budget Deleted",
    `Budget for "${categoryName}" has been removed.`,
    "info",
  );
  loadData();
  renderBudgets();
}

// ================================================
// CUSTOM CATEGORY CRUD OPERATIONS
// ================================================
function handleAddCustomCategory(name, icon) {
  const predefinedNames = PREDEFINED_CATEGORIES.map((c) => c.name);
  const customNames = allCustomCategories.map((c) => c.name);

  if (predefinedNames.includes(name)) {
    showToast("Cannot Add", `"${name}" is a predefined category.`, "warning");
    return false;
  }
  if (customNames.includes(name)) {
    showToast("Category Exists", `"${name}" already exists.`, "warning");
    return false;
  }

  addCustomCategory({ name, icon, iconType: "default" });
  showToast("Category Added", `"${name}" has been added.`, "success");
  loadData();
  return true;
}

function handleUpdateCustomCategory(categoryId, newName, newIcon) {
  updateCustomCategory(categoryId, { name: newName, icon: newIcon });
  showToast("Category Updated", `Category renamed to "${newName}".`, "success");
  loadData();
  renderBudgets();
}

function handleDeleteCustomCategory(categoryId, categoryName) {
  deleteCustomCategory(categoryId);
  showToast("Category Deleted", `"${categoryName}" has been removed.`, "info");
  loadData();
  renderBudgets();
}

// ================================================
// RENDER FUNCTIONS
// ================================================
function getIconForCategory(categoryName) {
  const predefined = PREDEFINED_CATEGORIES.find((c) => c.name === categoryName);
  if (predefined)
    return { icon: predefined.icon, iconType: predefined.iconType };
  const custom = allCustomCategories.find((c) => c.name === categoryName);
  if (custom) return { icon: custom.icon || "category", iconType: "default" };
  return { icon: "category", iconType: "default" };
}

function renderBudgets() {
  if (!budgetsContainer) return;

  const monthBudgets = getBudgetsForCurrentMonth();
  const categoriesToShow =
    currentView === "predefined" ? PREDEFINED_CATEGORIES : allCustomCategories;

  const totalBudget = monthBudgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = monthBudgets.reduce((sum, b) => sum + (b.spent || 0), 0);

  const totalBudgetEl = document.getElementById("totalBudget");
  const totalSpentEl = document.getElementById("totalSpent");
  const totalRemainingEl = document.getElementById("totalRemaining");

  if (totalBudgetEl) totalBudgetEl.textContent = formatMoney(totalBudget);
  if (totalSpentEl) totalSpentEl.textContent = formatMoney(totalSpent);
  if (totalRemainingEl)
    totalRemainingEl.textContent = formatMoney(totalBudget - totalSpent);

  budgetsContainer.innerHTML = "";

  if (categoriesToShow.length === 0 && currentView === "custom") {
    budgetsContainer.innerHTML = `
            <div class="empty-custom-state">
                <span class="material-symbols-outlined">edit_note</span>
                <h3>No Custom Categories Yet</h3>
                <p>Create your own categories to track specific expenses</p>
                <button class="add-custom-category-btn" id="emptyAddCustomBtn">+ Create Custom Category</button>
            </div>
        `;
    const emptyAddBtn = document.getElementById("emptyAddCustomBtn");
    if (emptyAddBtn)
      emptyAddBtn.addEventListener("click", openCustomCategoryModal);
    return;
  }

  categoriesToShow.forEach((category) => {
    const categoryName = category.name || category;
    const budget = monthBudgets.find((b) => b.category === categoryName);
    const hasBudget = !!budget;
    const limit = budget ? budget.limit : 0;
    const spent = budget ? budget.spent || 0 : 0;
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;

    let statusClass = "good",
      statusText = "";
    if (hasBudget) {
      if (percentage >= 100) {
        statusClass = "danger";
        statusText = "🚨 Exceeded!";
      } else if (percentage >= 90) {
        statusClass = "danger";
        statusText = "⚠️ Critical!";
      } else if (percentage >= 75) {
        statusClass = "warning";
        statusText = "⚠️ Getting close";
      } else {
        statusClass = "good";
        statusText = "✅ On track";
      }
    }

    const { icon, iconType } = getIconForCategory(categoryName);
    const isCustom = currentView === "custom";

    const card = document.createElement("div");
    card.className = `budget-card`;
    card.setAttribute("data-category", categoryName);
    card.innerHTML = `
            <div class="budget-card__header">
                <div class="budget-card__icon budget-card__icon--${iconType}">
                    <span class="material-symbols-outlined">${icon}</span>
                </div>
                <div class="budget-card__info">
                    <h4 class="budget-card__name">${escapeHtml(categoryName)}${isCustom ? '<span class="custom-badge">Custom</span>' : ""}</h4>
                    <p class="budget-card__period">Monthly Budget</p>
                </div>
                ${
                  isCustom
                    ? `
                    <div class="custom-category-actions">
                        <button class="edit-category-btn" data-id="${category.id}" data-category="${categoryName}" data-icon="${icon}">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                        <button class="delete-category-btn" data-id="${category.id}" data-category="${categoryName}">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                `
                    : ""
                }
            </div>
            <div class="budget-card__progress">
                <div class="progress-bar">
                    <div class="progress-fill progress-fill--${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div class="progress-stats">
                    <span class="spent">${formatMoney(spent)} spent</span>
                    <span class="limit">${hasBudget ? `of ${formatMoney(limit)} limit` : "No budget set"}</span>
                </div>
            </div>
            <div class="budget-card__footer">
                <button class="set-budget-btn" data-category="${categoryName}" data-has-budget="${hasBudget}" data-budget-id="${budget ? budget.id : ""}" data-limit="${limit}">
                    <span class="material-symbols-outlined">${hasBudget ? "edit" : "add"}</span>
                    ${hasBudget ? "Edit Budget" : "Set Budget"}
                </button>
                ${
                  hasBudget
                    ? `
                    <button class="delete-budget-btn" data-category="${categoryName}" data-budget-id="${budget.id}">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                `
                    : ""
                }
                <span class="budget-status budget-status--${statusClass}">${statusText}</span>
            </div>
        `;
    budgetsContainer.appendChild(card);
  });

  if (currentView === "custom") {
    const addCustomCard = document.createElement("div");
    addCustomCard.className = "budget-card budget-card--add";
    addCustomCard.innerHTML = `<button class="add-budget-btn" id="addCustomCategoryFooterBtn"><span class="material-symbols-outlined">add_circle</span><p>Create New Custom Category</p></button>`;
    budgetsContainer.appendChild(addCustomCard);
    const addFooterBtn = document.getElementById("addCustomCategoryFooterBtn");
    if (addFooterBtn)
      addFooterBtn.addEventListener("click", openCustomCategoryModal);
  }

  attachEventListeners();
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

function attachEventListeners() {
  document.querySelectorAll(".set-budget-btn").forEach((btn) => {
    btn.removeEventListener("click", handleSetBudgetClick);
    btn.addEventListener("click", handleSetBudgetClick);
  });

  document.querySelectorAll(".delete-budget-btn").forEach((btn) => {
    btn.removeEventListener("click", handleDeleteBudgetClick);
    btn.addEventListener("click", handleDeleteBudgetClick);
  });

  document.querySelectorAll(".edit-category-btn").forEach((btn) => {
    btn.removeEventListener("click", handleEditCategoryClick);
    btn.addEventListener("click", handleEditCategoryClick);
  });

  document.querySelectorAll(".delete-category-btn").forEach((btn) => {
    btn.removeEventListener("click", handleDeleteCategoryClick);
    btn.addEventListener("click", handleDeleteCategoryClick);
  });
}

// ================================================
// EVENT HANDLERS
// ================================================
function handleSetBudgetClick(e) {
  const btn = e.currentTarget;
  const category = btn.getAttribute("data-category");
  const hasBudget = btn.getAttribute("data-has-budget") === "true";
  const budgetId = hasBudget
    ? parseInt(btn.getAttribute("data-budget-id"))
    : null;
  const currentLimit = parseFloat(btn.getAttribute("data-limit")) || 0;
  openSetBudgetModal(category, hasBudget, budgetId, currentLimit);
}

function handleDeleteBudgetClick(e) {
  const btn = e.currentTarget;
  const category = btn.getAttribute("data-category");
  const budgetId = parseInt(btn.getAttribute("data-budget-id"));
  openDeleteBudgetModal(category, budgetId);
}

function handleEditCategoryClick(e) {
  const btn = e.currentTarget;
  const categoryId = parseInt(btn.getAttribute("data-id"));
  const categoryName = btn.getAttribute("data-category");
  const currentIcon = btn.getAttribute("data-icon") || "category";
  openEditCustomCategoryModal(categoryId, categoryName, currentIcon);
}

function handleDeleteCategoryClick(e) {
  const btn = e.currentTarget;
  const categoryId = parseInt(btn.getAttribute("data-id"));
  const categoryName = btn.getAttribute("data-category");
  openDeleteCustomCategoryModal(categoryId, categoryName);
}

// ================================================
// MODAL HANDLERS
// ================================================
function openSetBudgetModal(category, hasBudget, budgetId, currentLimit) {
  currentSetBudgetCategory = category;
  currentSetBudgetHasBudget = hasBudget;
  currentSetBudgetId = budgetId;

  if (setBudgetTitle)
    setBudgetTitle.textContent = hasBudget ? "Edit Budget" : "Set Budget";
  if (setBudgetCategory) setBudgetCategory.value = category;
  if (setBudgetLimitInput) setBudgetLimitInput.value = currentLimit || "";
  openModal(setBudgetModal);
}

function handleSetBudgetSubmit(event) {
  event.preventDefault();

  const newLimit = parseFloat(setBudgetLimitInput.value);
  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

  if (isNaN(newLimit) || newLimit <= 0) {
    showToast(
      "Invalid Amount",
      "Please enter a valid positive number.",
      "error",
    );
    return;
  }

  if (currentSetBudgetHasBudget && currentSetBudgetId) {
    handleUpdateBudget(currentSetBudgetId, newLimit);
    showToast(
      "Budget Updated",
      `${currentSetBudgetCategory} budget updated to ${formatMoney(newLimit)}.`,
      "success",
    );
  } else {
    handleAddBudget({
      category: currentSetBudgetCategory,
      limit: newLimit,
      month: monthKey,
    });
  }

  closeModal(setBudgetModal);
}

function openDeleteBudgetModal(category, budgetId) {
  pendingCategoryName = category;
  pendingCategoryId = budgetId;
  if (deleteTitle) deleteTitle.textContent = "Delete Budget?";
  if (deleteMessage)
    deleteMessage.textContent = `Are you sure you want to delete the budget for "${category}"?`;
  openModal(deleteConfirmModal);
}

function handleDeleteBudgetConfirm() {
  if (pendingCategoryId) {
    handleDeleteBudget(pendingCategoryId, pendingCategoryName);
    closeModal(deleteConfirmModal);
  }
}

function openEditCustomCategoryModal(categoryId, categoryName, currentIcon) {
  pendingCategoryId = categoryId;
  if (editCategoryNameInput) editCategoryNameInput.value = categoryName;
  if (editCategoryIcon) editCategoryIcon.value = currentIcon;
  openModal(editCategoryModal);
}

function handleEditCategorySubmit(event) {
  event.preventDefault();
  const newName = editCategoryNameInput.value.trim();
  const newIcon = editCategoryIcon.value;

  if (!newName) {
    showToast("Invalid Name", "Please enter a category name.", "error");
    return;
  }

  handleUpdateCustomCategory(pendingCategoryId, newName, newIcon);
  closeModal(editCategoryModal);
}

function openDeleteCustomCategoryModal(categoryId, categoryName) {
  pendingCategoryId = categoryId;
  pendingCategoryName = categoryName;
  if (deleteCategoryTitle)
    deleteCategoryTitle.textContent = "Delete Custom Category?";
  if (deleteCategoryMessage)
    deleteCategoryMessage.textContent = `Are you sure you want to delete "${categoryName}"? This will also delete all budgets for this category.`;
  openModal(deleteCategoryConfirmModal);
}

function handleDeleteCategoryConfirm() {
  if (pendingCategoryId && pendingCategoryName) {
    handleDeleteCustomCategory(pendingCategoryId, pendingCategoryName);
    closeModal(deleteCategoryConfirmModal);
  }
}

function openCustomCategoryModal() {
  const nameInput = document.getElementById("customCategoryName");
  if (nameInput) nameInput.value = "";
  openModal(customCategoryModal);
}

function handleAddCustomCategorySubmit(event) {
  event.preventDefault();
  const name = document.getElementById("customCategoryName").value.trim();
  const icon = document.getElementById("customCategoryIcon").value;

  if (!name) {
    showToast("Missing Information", "Please enter a category name.", "error");
    return;
  }

  if (handleAddCustomCategory(name, icon)) {
    closeModal(customCategoryModal);
    setView("custom");
  }
}

function openCreateBudgetModal() {
  const categorySelect = document.getElementById("categorySelect");
  if (categorySelect) {
    categorySelect.innerHTML = "";
    const categoriesToShow =
      currentView === "predefined"
        ? PREDEFINED_CATEGORIES
        : allCustomCategories;
    categoriesToShow.forEach((cat) => {
      const option = document.createElement("option");
      const categoryName = typeof cat === "object" ? cat.name : cat;
      option.value = categoryName;
      option.textContent = categoryName;
      categorySelect.appendChild(option);
    });
  }
  const budgetMonth = document.getElementById("budgetMonth");
  if (budgetMonth)
    budgetMonth.value = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  const budgetLimit = document.getElementById("budgetLimit");
  if (budgetLimit) budgetLimit.value = "";
  openModal(modal);
}

function handleCreateBudgetSubmit(event) {
  event.preventDefault();
  const category = document.getElementById("categorySelect").value;
  const limit = parseFloat(document.getElementById("budgetLimit").value);
  const month = document.getElementById("budgetMonth").value;

  if (!category) {
    showToast("Missing Information", "Please select a category.", "error");
    return;
  }
  if (isNaN(limit) || limit <= 0) {
    showToast("Invalid Amount", "Please enter a valid budget amount.", "error");
    return;
  }
  if (!month) {
    showToast("Missing Information", "Please select a month.", "error");
    return;
  }

  handleAddBudget({ category, limit, month });
  closeModal(modal);
}

// ================================================
// UI UTILITIES
// ================================================
function openModal(modalElement) {
  if (modalElement) modalElement.classList.add("active");
}

function closeModal(modalElement) {
  if (modalElement) modalElement.classList.remove("active");
}

function setView(view) {
  currentView = view;
  if (view === "predefined") {
    showPredefinedBtn?.classList.add("toggle-btn--active");
    showCustomBtn?.classList.remove("toggle-btn--active");
  } else {
    showCustomBtn?.classList.add("toggle-btn--active");
    showPredefinedBtn?.classList.remove("toggle-btn--active");
  }
  renderBudgets();
}

function updateMonthDisplay() {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  if (currentMonthEl)
    currentMonthEl.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  renderBudgets();
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateMonthDisplay();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateMonthDisplay();
}

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
  closeBtn.addEventListener("click", () => toast.remove());
  setTimeout(() => toast.remove(), duration);
}

function setupEventListeners() {
  if (createBudgetBtn)
    createBudgetBtn.addEventListener("click", openCreateBudgetModal);
  if (modalClose) modalClose.addEventListener("click", () => closeModal(modal));
  if (cancelBtn) cancelBtn.addEventListener("click", () => closeModal(modal));
  if (budgetForm)
    budgetForm.addEventListener("submit", handleCreateBudgetSubmit);
  if (showPredefinedBtn)
    showPredefinedBtn.addEventListener("click", () => setView("predefined"));
  if (showCustomBtn)
    showCustomBtn.addEventListener("click", () => setView("custom"));
  if (prevMonthBtn) prevMonthBtn.addEventListener("click", prevMonth);
  if (nextMonthBtn) nextMonthBtn.addEventListener("click", nextMonth);

  if (setBudgetClose)
    setBudgetClose.addEventListener("click", () => closeModal(setBudgetModal));
  if (setBudgetCancel)
    setBudgetCancel.addEventListener("click", () => closeModal(setBudgetModal));
  if (setBudgetForm)
    setBudgetForm.addEventListener("submit", handleSetBudgetSubmit);

  const deleteBudgetClose = document.querySelector(".delete-budget-close");
  const deleteBudgetCancel = document.querySelector(".delete-budget-cancel");
  if (deleteBudgetClose)
    deleteBudgetClose.addEventListener("click", () =>
      closeModal(deleteConfirmModal),
    );
  if (deleteBudgetCancel)
    deleteBudgetCancel.addEventListener("click", () =>
      closeModal(deleteConfirmModal),
    );
  if (deleteConfirmBtn)
    deleteConfirmBtn.addEventListener("click", handleDeleteBudgetConfirm);

  if (editCategoryClose)
    editCategoryClose.addEventListener("click", () =>
      closeModal(editCategoryModal),
    );
  if (editCategoryCancel)
    editCategoryCancel.addEventListener("click", () =>
      closeModal(editCategoryModal),
    );
  if (editCategoryForm)
    editCategoryForm.addEventListener("submit", handleEditCategorySubmit);

  const deleteCategoryClose = document.querySelector(".delete-category-close");
  const deleteCategoryCancel = document.querySelector(
    ".delete-category-cancel",
  );
  if (deleteCategoryClose)
    deleteCategoryClose.addEventListener("click", () =>
      closeModal(deleteCategoryConfirmModal),
    );
  if (deleteCategoryCancel)
    deleteCategoryCancel.addEventListener("click", () =>
      closeModal(deleteCategoryConfirmModal),
    );
  if (deleteCategoryConfirmBtn)
    deleteCategoryConfirmBtn.addEventListener(
      "click",
      handleDeleteCategoryConfirm,
    );

  if (customModalClose)
    customModalClose.addEventListener("click", () =>
      closeModal(customCategoryModal),
    );
  if (cancelCustomBtn)
    cancelCustomBtn.addEventListener("click", () =>
      closeModal(customCategoryModal),
    );
  if (customCategoryForm)
    customCategoryForm.addEventListener(
      "submit",
      handleAddCustomCategorySubmit,
    );

  window.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal);
    if (event.target === setBudgetModal) closeModal(setBudgetModal);
    if (event.target === deleteConfirmModal) closeModal(deleteConfirmModal);
    if (event.target === editCategoryModal) closeModal(editCategoryModal);
    if (event.target === deleteCategoryConfirmModal)
      closeModal(deleteCategoryConfirmModal);
    if (event.target === customCategoryModal) closeModal(customCategoryModal);
  });
}

init();
