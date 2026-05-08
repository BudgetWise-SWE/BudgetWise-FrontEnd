// ============================================================
//  BudgetWise — Shared API Utilities
//  Change BASE_URL if your backend is deployed elsewhere.
// ============================================================

export const BASE_URL = "https://budget-wise-back-end.vercel.app";

// ── Token helpers ────────────────────────────────────────────
export const getToken  = ()        => localStorage.getItem("budgetwise_token");
export const saveToken = (token)   => localStorage.setItem("budgetwise_token", token);
export const clearAuth = ()        => {
  localStorage.removeItem("budgetwise_token");
  localStorage.removeItem("budgetwise_user");
};

export const getUser   = ()        => JSON.parse(localStorage.getItem("budgetwise_user") || "null");
export const saveUser  = (user)    => localStorage.setItem("budgetwise_user", JSON.stringify(user));

// ── Auth guard: call at top of every protected page ──────────
export function requireAuth() {
  if (!getToken()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// ── Logout: clear session and redirect ───────────────────────
export function logout() {
  clearAuth();
  window.location.href = "login.html";
}

// ── Core fetch wrapper (adds Auth header automatically) ──────
export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // 401 → kick back to login
  if (res.status === 401) {
    clearAuth();
    window.location.href = "login.html";
    return null;
  }

  // 204 No Content
  if (res.status === 204) return null;

  const text = await res.text().catch(() => "");
  let data;
  try { data = JSON.parse(text); } catch { data = null; }

  if (!res.ok) {
    const err = data || { detail: `HTTP ${res.status}: ${text.slice(0, 200) || "Unknown server error"}` };
    throw err;
  }
  return data;
}

// ── Currency formatter ───────────────────────────────────────
export function fmt(value) {
  const n = parseFloat(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

// ── Date formatter ───────────────────────────────────────────
export function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Toast notification ───────────────────────────────────────
export function toast(message, type = "success") {
  const container = document.getElementById("toastContainer") || (() => {
    const el = document.createElement("div");
    el.id = "toastContainer";
    el.className = "toast-container";
    document.body.appendChild(el);
    return el;
  })();

  const t = document.createElement("div");
  t.className = `toast toast--${type}`;
  t.textContent = message;
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add("toast--visible"));
  setTimeout(() => {
    t.classList.remove("toast--visible");
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// ── Category icon map ────────────────────────────────────────
export const CATEGORY_ICONS = {
  "Dining & Drinks": { icon: "restaurant",    color: "orange"  },
  "Dining":          { icon: "restaurant",    color: "orange"  },
  "Shopping":        { icon: "shopping_bag",  color: "purple"  },
  "Transportation":  { icon: "commute",       color: "blue"    },
  "Transport":       { icon: "commute",       color: "blue"    },
  "Entertainment":   { icon: "movie",         color: "red"     },
  "Utilities":       { icon: "bolt",          color: "purple"  },
  "Health":          { icon: "fitness_center",color: "emerald" },
  "Income":          { icon: "work",          color: "blue"    },
  "default":         { icon: "payments",      color: "blue"    },
};

export function getCategoryMeta(name = "") {
  return (
    CATEGORY_ICONS[name] ||
    Object.entries(CATEGORY_ICONS).find(([k]) =>
      name.toLowerCase().includes(k.toLowerCase())
    )?.[1] ||
    CATEGORY_ICONS["default"]
  );
}