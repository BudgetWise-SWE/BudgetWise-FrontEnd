/**
 * @file BudgetWise — Landing page (index.html).
 * Handles CTA button routing based on authentication status.
 * @module index
 */

import { getToken } from "./api.js";

/** @type {HTMLButtonElement} */
const loginBtn      = document.getElementById("login-btn");
/** @type {NodeListOf<HTMLButtonElement>} */
const getStartedBtns = document.querySelectorAll(".btn--primary");

const isLoggedIn = !!getToken();

loginBtn?.addEventListener("click", () => {
  window.location.href = isLoggedIn ? "dashboard.html" : "login.html";
});

getStartedBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    window.location.href = isLoggedIn ? "dashboard.html" : "signup.html";
  });
});
