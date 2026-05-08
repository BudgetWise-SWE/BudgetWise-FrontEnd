/**
 * @file BudgetWise — Sign-up page.
 * Handles user registration with client-side validation,
 * name splitting, and inline field-level error display.
 * @module signup
 */

import { apiFetch, saveToken, saveUser, getToken } from "./api.js";

if (getToken()) window.location.href = "dashboard.html";

/** @type {HTMLFormElement} */
const form           = document.getElementById("create-acc-form");
/** @type {HTMLInputElement} */
const fullnameInput  = document.getElementById("fullname");
/** @type {HTMLInputElement} */
const emailInput     = document.getElementById("email");
/** @type {HTMLInputElement} */
const passwordInput  = document.getElementById("password");
/** @type {HTMLInputElement} */
const confirmInput   = document.getElementById("confirmpass");
/** @type {HTMLButtonElement} */
const submitBtn      = document.getElementById("sign-up-button");

/** @type {HTMLElement} */
const fullnameErr    = document.getElementById("fullname-error");
/** @type {HTMLElement} */
const emailErr       = document.getElementById("email-error");
/** @type {HTMLElement} */
const passwordErr    = document.getElementById("password-error");
/** @type {HTMLElement} */
const confirmErr     = document.getElementById("confirmpass-error");

/** Clear all visible field errors and error styles. */
function clearErrors() {
  [fullnameErr, emailErr, passwordErr, confirmErr].forEach((el) => {
    el.style.display = "none";
  });
  [fullnameInput, emailInput, passwordInput, confirmInput].forEach((el) => {
    el.classList.remove("input--error");
  });
}

/**
 * Display an inline error message on a specific form field.
 * @param {HTMLElement} errEl - The error message element.
 * @param {HTMLElement} inputEl - The input element to mark as errored.
 * @param {string} msg - The error message text.
 */
function showError(errEl, inputEl, msg) {
  errEl.textContent   = msg;
  errEl.style.display = "block";
  inputEl.classList.add("input--error");
}

/**
 * Handle sign-up form submission — validate, call the API, and redirect.
 * @param {SubmitEvent} e - The form submit event.
 * @returns {Promise<void>}
 */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const fullname        = fullnameInput.value.trim();
  const email           = emailInput.value.trim();
  const password        = passwordInput.value;
  const confirmPassword = confirmInput.value;

  let valid = true;

  if (!fullname || fullname.length < 2) {
    showError(fullnameErr, fullnameInput, "Please enter your full name.");
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError(emailErr, emailInput, "Please enter a valid email address.");
    valid = false;
  }
  if (!password || password.length < 8) {
    showError(passwordErr, passwordInput, "Password must be at least 8 characters.");
    valid = false;
  }
  if (password !== confirmPassword) {
    showError(confirmErr, confirmInput, "Passwords do not match.");
    valid = false;
  }
  if (!valid) return;

  const parts     = fullname.split(" ");
  const first_name = parts[0];
  const last_name  = parts.slice(1).join(" ") || parts[0];

  submitBtn.disabled    = true;
  submitBtn.textContent = "Creating account\u2026";

  try {
    const data = await apiFetch("/api/auth/", {
      method: "POST",
      body: JSON.stringify({
        email,
        first_name,
        last_name,
        fullname,
        password,
      }),
    });

    saveToken(data.token);
    saveUser(data.user);
    window.location.href = "dashboard.html";
  } catch (err) {
    submitBtn.disabled    = false;
    submitBtn.textContent = "Create Free Account";

    if (err?.email)    showError(emailErr,    emailInput,    err.email[0]);
    if (err?.password) showError(passwordErr, passwordInput, err.password[0]);
    if (err?.fullname || err?.first_name)
      showError(fullnameErr, fullnameInput, (err.fullname || err.first_name)[0]);

    if (!err?.email && !err?.password && !err?.fullname && !err?.first_name) {
      showError(
        emailErr,
        emailInput,
        err?.non_field_errors?.[0] ||
          err?.detail ||
          "Registration failed. Please try again."
      );
    }
  }
});
