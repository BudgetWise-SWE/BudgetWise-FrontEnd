// ============================================================
//  BudgetWise — Savings Goals Page
// ============================================================
import { requireAuth, apiFetch, fmt, fmtDate, toast } from "./api.js";

requireAuth();

// ── State ─────────────────────────────────────────────────────
let goals = [];
let contributeGoalId = null;

// ── DOM refs ─────────────────────────────────────────────────
const goalsGrid       = document.querySelector(".goals-grid");
const totalSavedEl    = document.querySelector(".summary-card--total .summary-card__value");
const totalGoalsEl    = document.querySelector(".summary-card--target .summary-card__value");
const overallProgEl   = document.querySelector(".summary-card--progress .summary-card__value");

const createGoalBtn   = document.getElementById("createGoalBtn");
const createGoalModal = document.getElementById("createGoalModal");
const goalForm        = document.getElementById("goalForm");

// Contribute modal — injected dynamically
let contributeModal = null;

// ── Load goals ────────────────────────────────────────────────
async function loadGoals() {
  try {
    const data = await apiFetch("/api/finance/savings-goals/");
    goals = Array.isArray(data) ? data : [];
    renderSummary();
    renderGoals();
  } catch (err) {
    console.error("Failed to load savings goals:", err);
    toast("Failed to load savings goals.", "error");
  }
}

// ── Summary row ───────────────────────────────────────────────
function renderSummary() {
  const totalSaved  = goals.reduce((s, g) => s + parseFloat(g.current_amount || g.saved || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + parseFloat(g.target_amount  || g.target || 0), 0);
  const pct         = totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : "0.0";

  if (totalSavedEl)  totalSavedEl.textContent  = fmt(totalSaved);
  if (totalGoalsEl)  totalGoalsEl.textContent  = fmt(totalTarget);
  if (overallProgEl) overallProgEl.textContent = `${pct}%`;
}

// ── Render goal cards ─────────────────────────────────────────
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

function getStatusLabel(progress, completed) {
  if (completed || progress >= 100) return "✅ Completed!";
  if (progress >= 75) return "🔥 Almost there!";
  if (progress >= 25) return "🏃 In Progress";
  return "🌱 Just started";
}

// SVG circle: r=45, circumference = 2πr ≈ 283
function dashOffset(progress) {
  return (283 * (1 - Math.min(progress, 100) / 100)).toFixed(1);
}

function renderGoals() {
  if (!goalsGrid) return;

  if (!goals.length) {
    goalsGrid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--color-muted)">
        No savings goals yet.
        <button class="btn btn--primary" id="firstGoalBtn" style="display:block;margin:1rem auto">
          Create your first goal →
        </button>
      </div>`;
    document.getElementById("firstGoalBtn")?.addEventListener("click", openCreateModal);
    return;
  }

  goalsGrid.innerHTML = goals.map((goal) => {
    const saved     = parseFloat(goal.current_amount || goal.saved || 0);
    const target    = parseFloat(goal.target_amount  || goal.target || 0);
    const progress  = goal.progress ?? (target > 0 ? Math.min(100, (saved / target) * 100) : 0);
    const completed = goal.completed || progress >= 100;
    const { icon, cls } = getGoalMeta(goal.name);
    const status    = getStatusLabel(progress, completed);
    const deadline  = goal.deadline ? fmtDate(goal.deadline) : "No deadline";

    return `
      <div class="goal-card ${completed ? "goal-card--completed" : ""}" data-id="${goal.id}">
        <div class="goal-card__header">
          <div class="goal-card__icon ${cls}">
            <span class="material-symbols-outlined">${icon}</span>
          </div>
          <div class="goal-card__info">
            <h4 class="goal-card__name">${goal.name}</h4>
            <p class="goal-card__deadline">${completed ? "Completed!" : "Target: " + deadline}</p>
          </div>
          <button class="goal-card__menu goal-options-btn" data-id="${goal.id}" aria-label="Options">
            <span class="material-symbols-outlined">more_vert</span>
          </button>
        </div>

        <div class="goal-card__progress">
          <div class="progress-ring">
            <svg viewBox="0 0 100 100" class="progress-svg">
              <circle cx="50" cy="50" r="45" class="progress-bg"/>
              <circle cx="50" cy="50" r="45" class="progress-fill"
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
              <div class="progress-fill-mini" style="width:${Math.min(100, progress).toFixed(1)}%"></div>
            </div>
          </div>
        </div>

        <div class="goal-card__footer">
          ${!completed ? `
            <button class="btn-add-funds contribute-btn" data-id="${goal.id}" data-name="${goal.name}">
              <span class="material-symbols-outlined">add</span> Add Funds
            </button>` : ""}
          <span class="goal-status ${completed ? "goal-status--completed" : ""}">${status}</span>
          <button class="icon-btn delete-goal-btn" data-id="${goal.id}" style="margin-left:auto" title="Delete goal">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>`;
  }).join("");

  // Attach listeners
  document.querySelectorAll(".contribute-btn").forEach((btn) => {
    btn.addEventListener("click", () => openContributeModal(btn.dataset.id, btn.dataset.name));
  });
  document.querySelectorAll(".delete-goal-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteGoal(btn.dataset.id));
  });
}

// ── Create goal modal ─────────────────────────────────────────
function openCreateModal() { openModal(createGoalModal); }
createGoalBtn?.addEventListener("click", openCreateModal);

goalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const inputs = goalForm.querySelectorAll(".form-input");
  const name         = inputs[0].value.trim();
  const target_amount= parseFloat(inputs[1].value);
  const initial      = parseFloat(inputs[2].value || 0);
  const deadline     = inputs[3].value || null;

  if (!name || !target_amount || target_amount <= 0) {
    toast("Please fill in name and target amount.", "error");
    return;
  }

  try {
    const goal = await apiFetch("/api/finance/savings-goals/", {
      method: "POST",
      body: JSON.stringify({ name, target_amount: target_amount.toString(), deadline }),
    });

    // Make initial contribution if provided
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
  }
});

// ── Contribute modal ──────────────────────────────────────────
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
            <button type="submit" class="btn btn--primary">Add Funds</button>
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
      }
    });
  }

  document.getElementById("contributeTitle").textContent = `Add Funds — ${goalName}`;
  document.getElementById("contributeAmount").value = "";
  openModal(contributeModal);
}

// ── Delete goal ───────────────────────────────────────────────
async function deleteGoal(id) {
  if (!confirm("Delete this savings goal? This cannot be undone.")) return;
  try {
    await apiFetch(`/api/finance/savings-goals/${id}/`, { method: "DELETE" });
    goals = goals.filter((g) => g.id !== parseInt(id));
    toast("Goal deleted.");
    renderSummary();
    renderGoals();
  } catch (err) {
    toast("Failed to delete goal.", "error");
  }
}

// ── Modal helpers ─────────────────────────────────────────────
function openModal(modal)  { modal.style.display = "flex"; modal.classList.add("modal--open"); }
function closeModal(modal) { modal.style.display = "none"; modal.classList.remove("modal--open"); }

document.querySelectorAll(".modal-close, .cancel-btn").forEach((btn) => {
  btn.addEventListener("click", () =>
    document.querySelectorAll(".modal").forEach(closeModal)
  );
});
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(modal); });
});

// ── Init ──────────────────────────────────────────────────────
loadGoals();
