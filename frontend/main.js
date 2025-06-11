// main.js
import { setupAuth, logout } from "./auth.js";
import { renderBudgets } from "./budgets.js";
import { renderTransactions } from "./transactions.js";
import { renderCategories } from "./categories.js";
import { renderNotifications } from "./notifications.js";
import { renderReports } from "./reports.js";
import { getCurrency, setCurrency } from "./currency.js";
import { apiGetProfile } from "./api.js";
import { showProfileModal } from "./ui.js";

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
    if (el) {
      el.classList.remove("show", "active");
      el.style.display = "none";
    }

    // Handle visibility of transaction-specific buttons
    // This logic runs when the element with 'id' (e.g., "transactions-view") is being processed in the loop.
    // It sets the button states based on the overall 'section' that is intended to be active.
    if (id === "transactions-view") {
      const fabBtn = document.getElementById("fab-add-transaction");
      const addBtn = document.getElementById("add-transaction-btn"); // Desktop button

      const isTransactionsSectionActive = section === "transactions-view";

      if (fabBtn) {
        fabBtn.style.display = isTransactionsSectionActive ? "flex" : "none";
      }

      // The addBtn is part of transactions-view's innerHTML.
      // If transactions-view is active, renderTransactions will ensure it's properly set up.
      // If it exists at this point, align its display style.
      if (addBtn) {
        addBtn.style.display = isTransactionsSectionActive
          ? "inline-block"
          : "none";
      }
    }
  });

  const activeEl = document.getElementById(section);
  if (activeEl) {
    activeEl.classList.add("show", "active");
    activeEl.style.display = "block";
  }

  // Removed redundant FAB handling block from here, as it's covered in the loop.
}

function setupTabs() {
  const tabs = [
    { id: "tab-reports", view: "reports-view", render: renderReports },
    {
      id: "tab-transactions",
      view: "transactions-view",
      render: renderTransactions,
    },
    { id: "tab-categories", view: "categories-view", render: renderCategories },
    { id: "tab-budgets", view: "budgets-view", render: renderBudgets },
    {
      id: "tab-notifications",
      view: "notifications-view",
      render: renderNotifications,
    },
  ];
  tabs.forEach((tab) => {
    // Removed unused 'idx'
    const tabElement = document.getElementById(tab.id);
    if (tabElement) {
      tabElement.onclick = (e) => {
        e.preventDefault();
        tabs.forEach((t) => {
          const elToDeactivate = document.getElementById(t.id);
          if (elToDeactivate) {
            elToDeactivate.classList.remove("active");
          }
        });
        tabElement.classList.add("active");

        // Removed direct FAB display manipulation here - showSection handles it.
        // Removed position/zIndex styling for transactions-view - renderTransactions handles it.

        showSection(tab.view);
        if (typeof tab.render === "function") {
          tab.render(getToken());
        }
      };
    }
  });
}

// document.getElementById("logout-btn").onclick = () => {
//   logout();
// };

document.getElementById("profile-btn").onclick = async () => {
  const token = getToken();
  if (!token) return;
  try {
    const resp = await apiGetProfile(token);
    if (resp.ok) {
      const user = await resp.json();
      showProfileModal(user);
    } else {
      showProfileModal({ username: "-", email: "-" });
    }
  } catch {
    showProfileModal({ username: "-", email: "-" });
  }
};

function updateProfileBtnAvatar() {
  const btn = document.getElementById("profile-btn");
  if (!btn) return;
  // Всегда показываем только иконку профиля
  btn.innerHTML = '<i class="bi bi-person-circle"></i>';
}

function setNavbarAuthVisibility(isAuth) {
  // Показывать/скрывать кнопки справа в navbar
  const themeBtn = document.getElementById("theme-toggle");
  const notifBtn = document.getElementById("notifications-btn");
  const profileBtn = document.getElementById("profile-btn");
  if (themeBtn) themeBtn.style.display = isAuth ? "" : "none";
  if (notifBtn) notifBtn.style.display = isAuth ? "" : "none";
  if (profileBtn) profileBtn.style.display = isAuth ? "" : "none";
}

window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("theme") || "light";
  setTheme(saved);
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.onclick = toggleTheme;
  updateProfileBtnAvatar();

  // Create FAB for transactions if it doesn't exist
  if (!document.getElementById("fab-add-transaction")) {
    const fab = document.createElement("button");
    fab.id = "fab-add-transaction";
    // Changed d-sm-none to d-md-none to show on xs and sm screens
    fab.className = "fab-add d-md-none";
    fab.title = "Новая транзакция";
    fab.innerHTML = '<i class="bi bi-plus"></i>';
    fab.style.display = "none"; // Initially hidden, showSection will manage it
    document.body.appendChild(fab);
  }

  const token = getToken();
  setNavbarAuthVisibility(!!token);

  if (token) {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("main-section").style.display = "block";
    showSection("reports-view");
    renderReports(token);
    // Активируем вкладку "Отчёты"
    [
      "tab-reports",
      "tab-transactions",
      "tab-categories",
      "tab-budgets",
      "tab-notifications",
    ].forEach((id, idx) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("active", id === "tab-reports");
    });
    setupTabs();
  } else {
    setupAuth(() => {
      showSection("reports-view");
      renderReports(getToken());
      [
        "tab-reports",
        "tab-transactions",
        "tab-categories",
        "tab-budgets",
        "tab-notifications",
      ].forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("active", id === "tab-reports");
      });
      setupTabs();
    });
  }
});
window.addEventListener("storage", updateProfileBtnAvatar);
// обновлять при открытии модалки профиля
export { updateProfileBtnAvatar };

// Регистрация service worker для PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js");
  });
}

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

window.addEventListener("unhandledrejection", function (event) {
  if (
    event.reason &&
    event.reason instanceof TypeError &&
    event.reason.message.includes("fetch")
  ) {
    import("./ui.js").then((m) => m.showNetworkError());
  }
});

// Обработчик для кнопки уведомлений в верхней панели
const notificationsBtn = document.getElementById("notifications-btn");
if (notificationsBtn) {
  notificationsBtn.onclick = (e) => {
    e.preventDefault();
    // Активируем вкладку уведомлений и отображаем содержимое
    [
      "tab-reports",
      "tab-transactions",
      "tab-categories",
      "tab-budgets",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove("active");
    });
    showSection("notifications-view");
    renderNotifications(getToken());
  };
}

export function onAuthStateChanged(isAuth) {
  setNavbarAuthVisibility(isAuth);
}
