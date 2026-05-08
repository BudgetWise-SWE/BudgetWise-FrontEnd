// ============================================================
//  BudgetWise — Login Page
// ============================================================
import { apiFetch, saveToken, saveUser, getToken } from "./api.js";

// Already logged in → go straight to dashboard
if (getToken()) window.location.href = "dashboard.html";

const form          = document.getElementById("login-form");
const emailInput    = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailErr      = document.getElementById("email-error");
const passwordErr   = document.getElementById("password-error");
const submitBtn     = document.getElementById("main-btn");

function clearErrors() {
  emailErr.style.display    = "none";
  passwordErr.style.display = "none";
  emailInput.classList.remove("input--error");
  passwordInput.classList.remove("input--error");
}

function showError(el, inputEl, msg) {
  el.textContent    = msg;
  el.style.display  = "block";
  inputEl.classList.add("input--error");
}

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
  submitBtn.textContent = "Signing in…";

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

    // Show specific field errors when the API returns them
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
