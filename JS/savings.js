import { requireAuth, apiFetch, fmt, fmtDate, toast } from "./api.js";

requireAuth();

let goals = [];
let contributeGoalId = null;
let deleteGoalId = null;

const goalsGrid       = document.querySelector(".goals-grid");
const totalSavedEl    = document.querySelector(".summary-card--total .summary-card__value");
const totalGoalsEl    = document.querySelector(".summary-card--target .summary-card__value");
const overallProgEl   = document.querySelector(".summary-card--progress .summary-card__value");

const createGoalBtn   = document.getElementById("createGoalBtn");
const createGoalModal = document.getElementById("createGoalModal");
const goalForm        = document.getElementById("goalForm");

const savingsLoading  = document.getElementById("savingsLoading");
const savingsError    = document.getElementById("savingsError");
const savingsRetryBtn = document.getElementById("savingsRetryBtn");

const deleteGoalModal  = document.getElementById("deleteGoalModal");
const deleteGoalNameEl = document.getElementById("deleteGoalName");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

let contributeModal = null;

async function loadGoals() {
  if (savingsLoading) savingsLoading.style.display = "grid";
  if (savingsError) savingsError.style.display = "none";
  if (goalsGrid) goalsGrid.style.display = "none";

  try {
    const data = await apiFetch("/api/finance/savings-goals/");
    goals = Array.isArray(data) ? data : [];
    if (savingsLoading) savingsLoading.style.display = "none";
    if (goalsGrid) goalsGrid.style.display = "grid";
    renderSummary();
    renderGoals();
  } catch (err) {
    console.error("Failed to load savings goals:", err);
    if (savingsLoading) savingsLoading.style.display = "none";
    if (savingsError) savingsError.style.display = "flex";
    toast("Failed to load savings goals.", "error");
  }
}

savingsRetryBtn?.addEventListener("click", loadGoals);

function renderSummary() {
  const totalSaved  = goals.reduce((s, g) => s + parseFloat(g.current_amount || g.saved || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + parseFloat(g.target_amount  || g.target || 0), 0);
  const pct         = totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : "0.0";

  if (totalSavedEl)  totalSavedEl.textContent  = fmt(totalSaved);
  if (totalGoalsEl)  totalGoalsEl.textContent  = goals.length.toString();
  if (overallProgEl) overallProgEl.textContent = `${pct}%`;
}

const GOAL_ICONS = {
  emergency : { icon: "security",      cls: "goal-card__icon--emergency" },
  vacation  : { icon: "beach_access",  cls: "goal-card__icon--vacation"  },
  travel    : { icon: "flight",        cls: "goal-card__icon--vacation"  },
  laptop    : { icon: "computer",      cls: "goal-card__icon--tech"      },
  mac       : { icon: "computer",      cls: "goal-card__icon--tech"      },
  tech      : { icon: "computer",      cls: "goal-card__icon--tech"      },
  house     : { icon: "home",          cls: "goal-card__icon--home"      },
  home      : { icon: "home",          cls: "goal-card__icon--home"      },
  car       : { icon: "directions_car",cls: "goal-card__icon--tech"      },
  default   : { icon: "savings",       cls: "goal-card__icon--emergency" },
};

function getGoalMeta(name = "") {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(GOAL_ICONS)) {
    if (key !== "default" && lower.includes(key)) return val;
  }
  return GOAL_ICONS.default;
}

function getProgressColorClass(progress) {
  if (progress >= 100) return "good";
  if (progress >= 60)  return "warning";
  return "danger";
}

function getStatusLabel(progress, completed) {
  if (completed || progress >= 100) return "Completed!";
  if (progress >= 75) return "Almost there!";
  if (progress >= 25) return "In Progress";
  return "Just started";
}

function getStatusClass(progress, completed) {
  if (completed || progress >= 100) return "completed";
  if (progress >= 75) return "almost";
  if (progress >= 25) return "progress";
  return "started";
}

function dashOffset(progress) {
  return (283 * (1 - Math.min(progress, 100) / 100)).toFixed(1);
}

function renderGoals() {
  if (!goalsGrid) return;

  if (!goals.length) {
    goalsGrid.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined empty-state__icon">savings</span>
        <h3 class="empty-state__title">No savings goals yet</h3>
        <p class="empty-state__text">Create your first goal and start tracking your progress toward financial freedom.</p>
        <button class="btn btn--primary" id="firstGoalBtn">Create your first goal</button>
      </div>`;
    document.getElementById("firstGoalBtn")?.addEventListener("click", openCreateModal);
    return;
  }

  goalsGrid.innerHTML = goals.map((goal, i) => {
    const saved     = parseFloat(goal.current_amount || goal.saved || 0);
    const target    = parseFloat(goal.target_amount  || goal.target || 0);
    const progress  = goal.progress ?? (target > 0 ? Math.min(100, (saved / target) * 100) : 0);
    const completed = goal.completed || progress >= 100;
    const { icon, cls } = getGoalMeta(goal.name);
    const status    = getStatusLabel(progress, completed);
    const sClass    = getStatusClass(progress, completed);
    const pColor    = getProgressColorClass(progress);
    const deadline  = goal.deadline ? fmtDate(goal.deadline) : "No deadline";

    return `
      <div class="goal-card ${completed ? "goal-card--completed" : ""}" data-id="${goal.id}" style="animation-delay:${i * 0.05}s">
        <div class="goal-card__header">
          <div class="goal-card__icon ${cls}">
            <span class="material-symbols-outlined">${icon}</span>
          </div>
          <div class="goal-card__info">
            <h4 class="goal-card__name">${goal.name}</h4>
            <p class="goal-card__deadline">${completed ? "Completed!" : "Target: " + deadline}</p>
          </div>
        </div>

        <div class="goal-card__progress">
          <div class="progress-ring">
            <svg viewBox="0 0 100 100" class="progress-svg">
              <circle cx="50" cy="50" r="45" class="progress-bg"/>
              <circle cx="50" cy="50" r="45" class="progress-fill progress-fill--${pColor}"
                style="stroke-dasharray:283;stroke-dashoffset:${dashOffset(progress)}"/>
            </svg>
            <span class="progress-percentage">${Math.round(progress)}%</span>
          </div>
          <div class="goal-stats">
            <div class="goal-amount">
              <span class="saved">${fmt(saved)} saved</span>
              <span class="target">of ${fmt(target)}</span>
            </div>
            <div class="progress-bar-mini">
              <div class="progress-fill-mini progress-fill-mini--${pColor}" style="width:${Math.min(100, progress).toFixed(1)}%"></div>
            </div>
          </div>
        </div>

        <div class="goal-card__footer">
          ${!completed ? `
            <button class="btn-add-funds contribute-btn" data-id="${goal.id}" data-name="${goal.name}">
              <span class="material-symbols-outlined">add</span> Add Funds
            </button>` : ""}
          <span class="goal-status goal-status--${sClass}">${status}</span>
          <button class="delete-goal-btn" data-id="${goal.id}" data-name="${goal.name}" title="Delete goal">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>`;
  }).join("");

  document.querySelectorAll(".contribute-btn").forEach((btn) => {
    btn.addEventListener("click", () => openContributeModal(btn.dataset.id, btn.dataset.name));
  });
  document.querySelectorAll(".delete-goal-btn").forEach((btn) => {
    btn.addEventListener("click", () => promptDeleteGoal(btn.dataset.id, btn.dataset.name));
  });
}

function openCreateModal() { openModal(createGoalModal); }
createGoalBtn?.addEventListener("click", openCreateModal);

goalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name          = document.getElementById("goalName").value.trim();
  const target_amount = parseFloat(document.getElementById("goalTarget").value);
  const initial       = parseFloat(document.getElementById("goalInitial").value || 0);
  const deadline      = document.getElementById("goalDeadline").value || null;

  if (!name || !target_amount || target_amount <= 0) {
    toast("Please fill in name and target amount.", "error");
    return;
  }

  const submitBtn = goalForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating...";

  try {
    const goal = await apiFetch("/api/finance/savings-goals/", {
      method: "POST",
      body: JSON.stringify({ name, target_amount: target_amount.toString(), deadline }),
    });

    if (initial > 0) {
      await apiFetch(`/api/finance/savings-goals/${goal.id}/contribute/`, {
        method: "POST",
        body: JSON.stringify({ amount: initial.toString() }),
      });
    }

    toast(`Goal "${name}" created!`);
    closeModal(createGoalModal);
    goalForm.reset();
    loadGoals();
  } catch (err) {
    toast(err?.name?.[0] || err?.target_amount?.[0] || "Failed to create goal.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Goal";
  }
});

function openContributeModal(goalId, goalName) {
  contributeGoalId = goalId;

  if (!contributeModal) {
    contributeModal = document.createElement("div");
    contributeModal.className = "modal";
    contributeModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="contributeTitle">Add Funds</h3>
          <button class="modal-close contribute-close">&times;</button>
        </div>
        <form class="modal-form" id="contributeForm">
          <div class="form-field">
            <label class="form-label">Amount ($)</label>
            <input type="number" min="0.01" step="0.01" class="form-input" id="contributeAmount" placeholder="0.00" required/>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn--secondary contribute-cancel">Cancel</button>
            <button type="submit" class="btn btn--primary" id="contributeSubmitBtn">Add Funds</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(contributeModal);

    contributeModal.querySelector(".contribute-close").addEventListener("click",  () => closeModal(contributeModal));
    contributeModal.querySelector(".contribute-cancel").addEventListener("click", () => closeModal(contributeModal));
    contributeModal.addEventListener("click", (e) => { if (e.target === contributeModal) closeModal(contributeModal); });

    document.getElementById("contributeForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById("contributeAmount").value);
      if (!amount || amount <= 0) { toast("Enter a valid amount.", "error"); return; }

      const submitBtn = document.getElementById("contributeSubmitBtn");
      submitBtn.disabled = true;
      submitBtn.textContent = "Adding...";

      try {
        await apiFetch(`/api/finance/savings-goals/${contributeGoalId}/contribute/`, {
          method: "POST",
          body: JSON.stringify({ amount: amount.toString() }),
        });
        toast("Funds added!");
        closeModal(contributeModal);
        loadGoals();
      } catch (err) {
        toast(err?.detail || "Failed to add funds.", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Add Funds";
      }
    });
  }

  document.getElementById("contributeTitle").textContent = `Add Funds — ${goalName}`;
  document.getElementById("contributeAmount").value = "";
  openModal(contributeModal);
}

function promptDeleteGoal(id, name) {
  deleteGoalId = id;
  if (deleteGoalNameEl) deleteGoalNameEl.textContent = name;
  openModal(deleteGoalModal);
}

confirmDeleteBtn?.addEventListener("click", async () => {
  if (!deleteGoalId) return;
  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = "Deleting...";

  try {
    await apiFetch(`/api/finance/savings-goals/${deleteGoalId}/`, { method: "DELETE" });
    goals = goals.filter((g) => g.id !== parseInt(deleteGoalId));
    toast("Goal deleted.");
    closeModal(deleteGoalModal);
    renderSummary();
    renderGoals();
  } catch (err) {
    toast("Failed to delete goal.", "error");
  } finally {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = "Delete";
    deleteGoalId = null;
  }
});

function openModal(modal)  { if (modal) { modal.style.display = "flex"; modal.classList.add("modal--open"); } }
function closeModal(modal) { if (modal) { modal.style.display = "none"; modal.classList.remove("modal--open"); } }

document.querySelectorAll(".modal-close, .cancel-btn").forEach((btn) => {
  btn.addEventListener("click", () =>
    document.querySelectorAll(".modal").forEach(closeModal)
  );
});
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(modal); });
});

loadGoals();
