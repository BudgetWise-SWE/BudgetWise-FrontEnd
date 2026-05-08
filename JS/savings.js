import {
  getCurrentUser,
  getSavingsGoals,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  addToSavingsGoal,
  initializeUserData,
  formatMoney,
} from "./storage.js";

// DOM Elements
const createGoalBtn = document.getElementById("createGoalBtn");
const modal = document.getElementById("createGoalModal");
const modalClose = document.querySelector(".modal-close");
const cancelBtn = document.querySelector(".cancel-btn");
const goalForm = document.getElementById("goalForm");
const toastContainer = document.getElementById("toastContainer");

// State
let currentGoals = [];
let currentGoalId = null;

// ================================================
// INITIALIZATION
// ================================================
function init() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  initializeUserData();
  loadGoals();
  renderGoals();
  updateSavingsSummary();
  setupEventListeners();

  showToast(
    "Welcome to Savings Goals! 🎯",
    "Track your progress and watch your savings grow.",
    "info",
    4000,
  );
}

function loadGoals() {
  currentGoals = getSavingsGoals();
}

function saveGoals() {
  // Goals are saved directly via storage functions
  loadGoals();
}

// ================================================
// CRUD OPERATIONS
// ================================================
function addGoal(goal) {
  addSavingsGoal(goal);
  loadGoals();
}

function updateGoalProgress(goalId, additionalAmount) {
  const updatedGoal = addToSavingsGoal(goalId, additionalAmount);
  loadGoals();
  return updatedGoal;
}

function deleteGoalById(goalId) {
  deleteSavingsGoal(goalId);
  loadGoals();
}

function editGoalTarget(goalId, newTarget) {
  const goal = currentGoals.find((g) => g.id === goalId);
  if (goal) {
    const newSaved = Math.min(goal.saved, newTarget);
    updateSavingsGoal(goalId, { target: newTarget, saved: newSaved });
    loadGoals();
  }
}

// ================================================
// RENDER FUNCTIONS
// ================================================
function renderGoals() {
  const goalsGrid = document.querySelector(".goals-grid");
  if (!goalsGrid) return;

  goalsGrid.innerHTML = "";

  currentGoals.forEach((goal) => {
    const percentage = (goal.saved / goal.target) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const isCompleted = goal.status === "completed";
    const statusText = isCompleted
      ? "✅ Completed!"
      : getStatusText(percentage);
    const statusIcon = getStatusIcon(percentage);

    const goalCard = document.createElement("div");
    goalCard.className = `goal-card ${isCompleted ? "goal-card--completed" : ""}`;
    goalCard.setAttribute("data-id", goal.id);

    goalCard.innerHTML = `
            <div class="goal-card__header">
                <div class="goal-card__icon goal-card__icon--${goal.iconType}">
                    <span class="material-symbols-outlined">${goal.icon}</span>
                </div>
                <div class="goal-card__info">
                    <h4 class="goal-card__name">${escapeHtml(goal.name)}</h4>
                    <p class="goal-card__deadline">Target: ${formatDeadline(goal.deadline)}</p>
                </div>
                <button class="goal-card__menu" data-id="${goal.id}">
                    <span class="material-symbols-outlined">more_vert</span>
                </button>
            </div>
            <div class="goal-card__progress">
                <div class="progress-ring">
                    <svg viewBox="0 0 100 100" class="progress-svg">
                        <circle cx="50" cy="50" r="45" class="progress-bg" />
                        <circle cx="50" cy="50" r="45" class="progress-fill" style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${strokeDashoffset}" />
                    </svg>
                    <span class="progress-percentage">${Math.round(percentage)}%</span>
                </div>
                <div class="goal-stats">
                    <div class="goal-amount">
                        <span class="saved">${formatMoney(goal.saved)} saved</span>
                        <span class="target">of ${formatMoney(goal.target)}</span>
                    </div>
                    <div class="progress-bar-mini">
                        <div class="progress-fill-mini" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
            <div class="goal-card__footer">
                ${
                  !isCompleted
                    ? `
                    <button class="btn-add-funds" data-id="${goal.id}">
                        <span class="material-symbols-outlined">add</span>
                        Add Funds
                    </button>
                `
                    : ""
                }
                <span class="goal-status ${isCompleted ? "goal-status--completed" : ""}">${statusIcon} ${statusText}</span>
            </div>
        `;

    goalsGrid.appendChild(goalCard);
  });

  // Add the "Add New Goal" card
  const addGoalCard = document.createElement("div");
  addGoalCard.className = "add-goal-card";
  addGoalCard.innerHTML = `
        <button class="add-goal-btn" id="addGoalCardBtn">
            <span class="material-symbols-outlined">add_circle</span>
            <p>Create New Savings Goal</p>
        </button>
    `;
  goalsGrid.appendChild(addGoalCard);

  attachEventListeners();
}

function getStatusText(percentage) {
  if (percentage >= 100) return "Completed!";
  if (percentage >= 75) return "Almost there!";
  if (percentage >= 50) return "Halfway there!";
  if (percentage >= 25) return "Making progress";
  return "Just started";
}

function getStatusIcon(percentage) {
  if (percentage >= 100) return "";
  if (percentage >= 75) return "🔥";
  if (percentage >= 50) return "📈";
  if (percentage >= 25) return "🚀";
  return "🌱";
}

function formatDeadline(deadline) {
  if (!deadline) return "No deadline";
  const [year, month] = deadline.split("-");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
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

function updateSavingsSummary() {
  const totalSaved = currentGoals.reduce((sum, g) => sum + g.saved, 0);
  const totalTarget = currentGoals.reduce((sum, g) => sum + g.target, 0);
  const overallProgress =
    totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const totalSavedEl = document.querySelector(
    ".summary-card--total .summary-card__value",
  );
  const totalTargetEl = document.querySelector(
    ".summary-card--target .summary-card__value",
  );
  const overallProgressEl = document.querySelector(
    ".summary-card--progress .summary-card__value",
  );

  if (totalSavedEl) totalSavedEl.textContent = formatMoney(totalSaved);
  if (totalTargetEl) totalTargetEl.textContent = formatMoney(totalTarget);
  if (overallProgressEl)
    overallProgressEl.textContent = `${Math.round(overallProgress)}%`;
}

// ================================================
// AMOUNT MODAL
// ================================================
function showAmountModal(goalId) {
  currentGoalId = goalId;

  let amountModal = document.getElementById("amountModal");
  if (!amountModal) {
    amountModal = document.createElement("div");
    amountModal.id = "amountModal";
    amountModal.className = "amount-modal";
    amountModal.innerHTML = `
            <div class="amount-modal-content">
                <div class="amount-modal-header">
                    <h3>Add Funds</h3>
                    <button class="amount-modal-close">&times;</button>
                </div>
                <div class="amount-modal-form">
                    <div class="form-field amount-input-field">
                        <label class="form-label">Amount to Add ($)</label>
                        <input type="number" class="form-input" id="amountInput" placeholder="0.00" step="1.0" min="1.0" />
                    </div>
                    <div class="amount-modal-actions">
                        <button type="button" class="btn btn--secondary" id="cancelAmountBtn">Cancel</button>
                        <button type="button" class="btn btn--primary" id="confirmAmountBtn">Add Funds</button>
                    </div>
                </div>
            </div>
        `;
    document.body.appendChild(amountModal);

    const modalCloseBtn = amountModal.querySelector(".amount-modal-close");
    const cancelBtn = amountModal.querySelector("#cancelAmountBtn");
    const confirmBtn = amountModal.querySelector("#confirmAmountBtn");

    modalCloseBtn.addEventListener("click", closeAmountModal);
    cancelBtn.addEventListener("click", closeAmountModal);
    confirmBtn.addEventListener("click", confirmAddFunds);

    amountModal.addEventListener("click", (e) => {
      if (e.target === amountModal) closeAmountModal();
    });
  }

  const amountInput = document.getElementById("amountInput");
  if (amountInput) amountInput.value = "";

  amountModal.classList.add("active");
}

function closeAmountModal() {
  const amountModal = document.getElementById("amountModal");
  if (amountModal) amountModal.classList.remove("active");
  currentGoalId = null;
}

function confirmAddFunds() {
  const amountInput = document.getElementById("amountInput");
  const amount = parseFloat(amountInput.value);

  if (isNaN(amount) || amount <= 0) {
    showToast(
      "Invalid Amount",
      "Please enter a valid positive amount.",
      "error",
    );
    return;
  }

  const goal = currentGoals.find((g) => g.id === currentGoalId);
  if (!goal) {
    showToast("Error", "Goal not found.", "error");
    closeAmountModal();
    return;
  }

  const newSaved = goal.saved + amount;
  if (newSaved > goal.target) {
    showToast(
      "Amount Exceeds Goal",
      `Adding ${formatMoney(amount)} would exceed your goal of ${formatMoney(goal.target)}. You only need ${formatMoney(goal.target - goal.saved)} more.`,
      "warning",
    );
    return;
  }

  const updatedGoal = updateGoalProgress(currentGoalId, amount);

  if (updatedGoal) {
    if (updatedGoal.status === "completed") {
      showToast(
        "🎉 Goal Completed!",
        `Congratulations! You've reached your "${goal.name}" goal of ${formatMoney(goal.target)}!`,
        "success",
        5000,
      );
    } else {
      const newPercentage = (updatedGoal.saved / updatedGoal.target) * 100;
      showToast(
        "Funds Added Successfully",
        `Added ${formatMoney(amount)} to "${goal.name}". You're now at ${Math.round(newPercentage)}% of your goal!`,
        "success",
      );
    }

    renderGoals();
    updateSavingsSummary();
  }

  closeAmountModal();
}

// ================================================
// MODAL FUNCTIONS
// ================================================
function openModal() {
  const inputs = modal.querySelectorAll("input");
  inputs.forEach((input) => (input.value = ""));
  modal.classList.add("active");
}

function closeModal() {
  modal.classList.remove("active");
}

function createGoal(event) {
  event.preventDefault();

  const goalNameInput = modal.querySelector(
    'input[placeholder="e.g., Emergency Fund"]',
  );
  const targetAmountInput = modal.querySelector(
    'input[placeholder="Enter target amount"]',
  );
  const initialDepositInput = modal.querySelector(
    'input[placeholder="Starting amount"]',
  );
  const targetDateInput = modal.querySelector('input[type="month"]');

  const goalName = goalNameInput?.value.trim();
  const targetAmount = parseFloat(targetAmountInput?.value);
  const initialDeposit = parseFloat(initialDepositInput?.value) || 0;
  const targetDate = targetDateInput?.value;

  if (!goalName) {
    showToast("Missing Information", "Please enter a goal name.", "error");
    return;
  }
  if (isNaN(targetAmount) || targetAmount <= 0) {
    showToast("Invalid Amount", "Please enter a valid target amount.", "error");
    return;
  }
  if (initialDeposit > targetAmount) {
    showToast(
      "Invalid Deposit",
      "Initial deposit cannot exceed target amount.",
      "error",
    );
    return;
  }
  if (!targetDate) {
    showToast("Missing Information", "Please select a target date.", "error");
    return;
  }

  const iconMap = {
    emergency: { icon: "security", type: "emergency" },
    vacation: { icon: "beach_access", type: "vacation" },
    travel: { icon: "flight", type: "vacation" },
    house: { icon: "home", type: "home" },
    home: { icon: "home", type: "home" },
    car: { icon: "directions_car", type: "tech" },
    laptop: { icon: "computer", type: "tech" },
    computer: { icon: "computer", type: "tech" },
  };

  let icon = "savings";
  let iconType = "emergency";

  const lowerName = goalName.toLowerCase();
  for (const [key, value] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      icon = value.icon;
      iconType = value.type;
      break;
    }
  }

  const newGoal = {
    name: goalName,
    target: targetAmount,
    initialDeposit: initialDeposit,
    deadline: targetDate,
    icon: icon,
    iconType: iconType,
  };

  addGoal(newGoal);
  showToast(
    "Goal Created! 🎯",
    `"${goalName}" goal created with target ${formatMoney(targetAmount)}.`,
    "success",
  );
  closeModal();
  renderGoals();
  updateSavingsSummary();
}

function showGoalOptions(goalId) {
  const goal = currentGoals.find((g) => g.id === parseInt(goalId));
  if (!goal) return;

  const action = confirm(
    `What would you like to do with "${goal.name}"?\n\nOK = Edit Goal\nCancel = Delete Goal`,
  );

  if (action) {
    const newTarget = prompt(
      `Enter new target amount for ${goal.name}:`,
      goal.target,
    );
    if (newTarget && !isNaN(newTarget) && parseFloat(newTarget) > 0) {
      const newTargetNum = parseFloat(newTarget);
      editGoalTarget(goal.id, newTargetNum);
      renderGoals();
      updateSavingsSummary();
      showToast(
        "Goal Updated",
        `"${goal.name}" target updated to ${formatMoney(newTargetNum)}.`,
        "success",
      );
    }
  } else {
    const confirmDelete = confirm(
      `Are you sure you want to delete "${goal.name}"?`,
    );
    if (confirmDelete) {
      deleteGoalById(goal.id);
      renderGoals();
      updateSavingsSummary();
      showToast("Goal Deleted", `"${goal.name}" has been removed.`, "info");
    }
  }
}

// ================================================
// EVENT LISTENERS
// ================================================
function attachEventListeners() {
  document.querySelectorAll(".btn-add-funds").forEach((btn) => {
    btn.removeEventListener("click", handleAddFundsClick);
    btn.addEventListener("click", handleAddFundsClick);
  });

  document.querySelectorAll(".goal-card__menu").forEach((btn) => {
    btn.removeEventListener("click", handleMenuClick);
    btn.addEventListener("click", handleMenuClick);
  });

  const addGoalBtn = document.getElementById("addGoalCardBtn");
  if (addGoalBtn) {
    addGoalBtn.removeEventListener("click", openModal);
    addGoalBtn.addEventListener("click", openModal);
  }
}

function handleAddFundsClick(e) {
  const btn = e.currentTarget;
  const goalId = parseInt(btn.getAttribute("data-id"));
  showAmountModal(goalId);
}

function handleMenuClick(e) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const goalId = btn.getAttribute("data-id");
  showGoalOptions(goalId);
}

function setupEventListeners() {
  if (createGoalBtn) createGoalBtn.addEventListener("click", openModal);
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  if (goalForm) goalForm.addEventListener("submit", createGoal);

  window.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
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

init();
