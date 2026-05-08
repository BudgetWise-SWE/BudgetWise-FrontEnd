/**
 * @file Shared API utilities, auth helpers, formatters, and toast notifications
 *       for the BudgetWise frontend.
 * @module api
 */

/** Base URL for the BudgetWise backend API. @type {string} */
export const BASE_URL = "https://budget-wise-back-end.vercel.app";

/**
 * Retrieve the stored auth token from localStorage.
 * @returns {string|null} The token string, or null if not logged in.
 */
export const getToken  = ()        => localStorage.getItem("budgetwise_token");

/**
 * Persist an auth token to localStorage.
 * @param {string} token - The authentication token to store.
 */
export const saveToken = (token)   => localStorage.setItem("budgetwise_token", token);

/** Clear all auth-related data from localStorage. */
export const clearAuth = ()        => {
  localStorage.removeItem("budgetwise_token");
  localStorage.removeItem("budgetwise_user");
};

/**
 * Retrieve the stored user object from localStorage.
 * @returns {Object|null} The parsed user object, or null.
 */
export const getUser   = ()        => JSON.parse(localStorage.getItem("budgetwise_user") || "null");

/**
 * Persist a user object to localStorage.
 * @param {Object} user - The user object to store.
 */
export const saveUser  = (user)    => localStorage.setItem("budgetwise_user", JSON.stringify(user));

/**
 * Auth guard — redirects to login if no token is found.
 * Call at the top of every protected page module.
 * @returns {boolean} True if authenticated, false otherwise.
 */
export function requireAuth() {
  if (!getToken()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

/** Clear the session and redirect to the login page. */
export function logout() {
  clearAuth();
  window.location.href = "login.html";
}

/**
 * Core fetch wrapper — automatically attaches the auth header,
 * handles 401 responses, and parses JSON or throws structured errors.
 * @param {string} path - API endpoint path (e.g. "/api/finance/transactions/").
 * @param {Object} [options={}] - Standard fetch options (method, body, headers, etc.).
 * @param {Object} [options.headers] - Additional headers to merge.
 * @param {string} [options.body] - JSON request body.
 * @param {string} [options.method] - HTTP method (default "GET").
 * @returns {Promise<Object|null>} Parsed JSON response, or null for 204.
 * @throws {Object} Server error object with detail or field-level messages.
 */
export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    window.location.href = "login.html";
    return null;
  }

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

/**
 * Format a numeric value as USD currency.
 * @param {number|string} value - The amount to format.
 * @returns {string} Formatted currency string (e.g. "$1,234.56").
 */
export function fmt(value) {
  const n = parseFloat(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

/**
 * Format an ISO date string into a human-readable US date.
 * @param {string} [dateStr] - ISO date string.
 * @returns {string} Formatted date (e.g. "Jan 15, 2026") or an em-dash.
 */
export function fmtDate(dateStr) {
  if (!dateStr) return "\u2014";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Show a brief toast notification at the bottom of the viewport.
 * Creates the container automatically if it doesn"t exist.
 * @param {string} message - The message text.
 * @param {"success"|"error"} [type="success"] - Visual style of the toast.
 */
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

/**
 * Map of category names to Material Symbol icons and colour themes.
 * @type {Object<string, {icon: string, color: string}>}
 */
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

/**
 * Look up the icon and colour for a given category name.
 * Matches by exact key first, then by substring, falling back to default.
 * @param {string} [name=""] - The category display name.
 * @returns {{icon: string, color: string}} Icon name and colour key.
 */
export function getCategoryMeta(name = "") {
  return (
    CATEGORY_ICONS[name] ||
    Object.entries(CATEGORY_ICONS).find(([k]) =>
      name.toLowerCase().includes(k.toLowerCase())
    )?.[1] ||
    CATEGORY_ICONS["default"]
  );
}
