// main.js
import { setupAuth, logout } from "./auth.js";
import { renderBudgets } from "./budgets.js";
import { renderTransactions } from "./transactions.js";
import { renderCategories } from "./categories.js";
import { renderNotifications } from "./notifications.js";
import { renderReports } from "./reports.js";
import { getCurrency, setCurrency } from "./currency.js";

function getToken() {
  return localStorage.getItem("token");
}

function showSection(section) {
  [
    "budgets-view",
    "transactions-view",
    "categories-view",
    "notifications-view",
    "reports-view",
  ].forEach((id) => {
    const el = document.getElementById(id);
    el.classList.remove("show", "active");
    el.style.display = "none";
  });
  const activeEl = document.getElementById(section);
  activeEl.classList.add("show", "active");
  activeEl.style.display = "block";
}

function setupTabs() {
  const tabs = [
    { id: "tab-budgets", view: "budgets-view", render: renderBudgets },
    {
      id: "tab-transactions",
      view: "transactions-view",
      render: renderTransactions,
    },
    { id: "tab-categories", view: "categories-view", render: renderCategories },
    {
      id: "tab-notifications",
      view: "notifications-view",
      render: renderNotifications,
    },
    { id: "tab-reports", view: "reports-view", render: renderReports },
  ];
  tabs.forEach((tab, idx) => {
    document.getElementById(tab.id).onclick = (e) => {
      e.preventDefault();
      tabs.forEach((t) =>
        document.getElementById(t.id).classList.remove("active")
      );
      document.getElementById(tab.id).classList.add("active");
      showSection(tab.view);
      tab.render(getToken());
    };
  });
}

document.getElementById("logout-btn").onclick = () => {
  logout();
};

setupAuth(() => {
  document.getElementById("main-section").style.display = "block";
  document.getElementById("auth-section").style.display = "none";
  setupTabs();
  renderBudgets(getToken());
});

if (getToken()) {
  document.getElementById("main-section").style.display = "block";
  document.getElementById("auth-section").style.display = "none";
  setupTabs();
  renderBudgets(getToken());
}

window.addEventListener("unhandledrejection", function (event) {
  if (
    event.reason &&
    event.reason instanceof TypeError &&
    event.reason.message.includes("fetch")
  ) {
    import("./ui.js").then((m) => m.showNetworkError());
  }
});

// --- Theme toggle ---
function setTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  const icon = document.getElementById("theme-toggle-icon");
  if (icon) {
    icon.className = theme === "dark" ? "bi bi-sun" : "bi bi-moon-stars";
  }
}

function toggleTheme() {
  const current = document.body.getAttribute("data-theme") || "light";
  setTheme(current === "dark" ? "light" : "dark");
}

window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("theme") || "light";
  setTheme(saved);
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.onclick = toggleTheme;
});
