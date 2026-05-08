// ============================================================
//  BudgetWise — Landing Page (index.html)
// ============================================================
import { getToken } from "./api.js";

const loginBtn      = document.getElementById("login-btn");
const getStartedBtns = document.querySelectorAll(".btn--primary");

// If already logged in, route CTA to dashboard
const isLoggedIn = !!getToken();

loginBtn?.addEventListener("click", () => {
  window.location.href = isLoggedIn ? "dashboard.html" : "login.html";
});

getStartedBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    window.location.href = isLoggedIn ? "dashboard.html" : "signup.html";
  });
});
