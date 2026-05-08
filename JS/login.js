/**
 * @file BudgetWise — Login page.
 * Handles email/password authentication with client-side validation
 * and inline field-level error display from the API.
 * @module login
 */

import { apiFetch, saveToken, saveUser, getToken } from "./api.js";

if (getToken()) window.location.href = "dashboard.html";

/** @type {HTMLFormElement} */
const form          = document.getElementById("login-form");
/** @type {HTMLInputElement} */
const emailInput    = document.getElementById("email");
/** @type {HTMLInputElement} */
const passwordInput = document.getElementById("password");
/** @type {HTMLElement} */
const emailErr      = document.getElementById("email-error");
/** @type {HTMLElement} */
const passwordErr   = document.getElementById("password-error");
/** @type {HTMLButtonElement} */
const submitBtn     = document.getElementById("main-btn");

/** Clear all visible field errors and error styles. */
function clearErrors() {
  emailErr.style.display    = "none";
  passwordErr.style.display = "none";
  emailInput.classList.remove("input--error");
  passwordInput.classList.remove("input--error");
}

/**
 * Display an inline error message on a specific form field.
 * @param {HTMLElement} el - The error message element.
 * @param {HTMLElement} inputEl - The input element to mark as errored.
 * @param {string} msg - The error message text.
 */
function showError(el, inputEl, msg) {
  el.textContent    = msg;
  el.style.display  = "block";
  inputEl.classList.add("input--error");
}

/**
 * Handle login form submission — validate, call the API, and redirect.
 * @param {SubmitEvent} e - The form submit event.
 * @returns {Promise<void>}
 */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  let valid = true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError(emailErr, emailInput, "Please enter a valid email address.");
    valid = false;
  }
  if (!password) {
    showError(passwordErr, passwordInput, "Please enter your password.");
    valid = false;
  }
  if (!valid) return;

  submitBtn.disabled    = true;
  submitBtn.textContent = "Signing in\u2026";

  try {
    const data = await apiFetch("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    saveToken(data.token);
    saveUser(data.user);
    window.location.href = "dashboard.html";
  } catch (err) {
    submitBtn.disabled    = false;
    submitBtn.textContent = "Sign In";

    if (err?.email)    showError(emailErr,    emailInput,    err.email[0]);
    if (err?.password) showError(passwordErr, passwordInput, err.password[0]);

    if (!err?.email && !err?.password) {
      showError(
        emailErr,
        emailInput,
        err?.non_field_errors?.[0] ||
          err?.detail ||
          "Invalid credentials. Please check your email and password."
      );
    }
  }
});
