// reports.js
import { apiGetCategorySummary, apiGetMonthlySummary } from "./api.js";
import { showAlert, clearAlert } from "./ui.js";
import { getCurrency } from "./currency.js";
import { getCategoryColors } from "./chart-utils.js";

function renderPeriodTabs(active) {
  const periods = [
    { key: "month", label: "Месяц" },
    { key: "year", label: "Год" },
  ];
  return `<ul class="nav nav-pills mb-3" id="period-tabs">
    ${periods
      .map(
        (p) =>
          `<li class="nav-item">
            <a class="nav-link${
              active === p.key ? " active" : ""
            }" href="#" data-period="${p.key}">${p.label}</a>
          </li>`
      )
      .join("")}
  </ul>`;
}

let currentPeriod = "month";
let customPeriod = { from: "", to: "" };
let currentCategoryType = "expense"; // по умолчанию расходы
async function getCachedCategories(token) {
  if (!window.FinanceMateCategoriesCache) {
    const categoriesResp = await import("./api.js").then((m) =>
      m.apiGetCategories(token, { limit: 1000, offset: 0 })
    );
    if (categoriesResp.ok) {
      window.FinanceMateCategoriesCache = await categoriesResp.json();
    } else {
      window.FinanceMateCategoriesCache = [];
    }
  }
  return window.FinanceMateCategoriesCache;
}

// --- Вспомогательная функция для навешивания обработчиков вкладок ---
async function setupReportTabHandlers(token) {
  // Вкладки периодов (Месяц/Год)
  document.querySelectorAll("#period-tabs .nav-link").forEach((el) => {
    el.onclick = (e) => {
      e.preventDefault();
      currentPeriod = el.getAttribute("data-period");
      document.getElementById("period-tabs-container").innerHTML =
        renderPeriodTabs(currentPeriod);
      setupReportTabHandlers(token); // повторно навесить обработчики!
      const year = new Date().getFullYear();
      const month =
        currentPeriod === "month" ? new Date().getMonth() + 1 : undefined;
      loadCategoryReport(
        token,
        year,
        month,
        document.getElementById("report-currency-select").value
      );
      loadMonthlyReport(
        token,
        year,
        document.getElementById("report-currency-select").value
      );
    };
  });
  // Вкладки типа (Расходы/Доходы)
  document.querySelectorAll("#category-type-tabs .nav-link").forEach((el) => {
    el.onclick = (e) => {
      e.preventDefault();
      currentCategoryType = el.getAttribute("data-type");
      document.getElementById(
        "category-type-tabs-bar"
      ).innerHTML = `<ul class="nav nav-pills" id="category-type-tabs" style="width:100%;max-width:340px;">\n        <li class="nav-item flex-fill text-center"><a class="nav-link${
        currentCategoryType === "expense" ? " active" : ""
      }" href="#" data-type="expense" style="width:100%">Расходы</a></li>\n        <li class="nav-item flex-fill text-center"><a class="nav-link${
        currentCategoryType === "income" ? " active" : ""
      }" href="#" data-type="income" style="width:100%">Доходы</a></li>\n      </ul>`;
      setupReportTabHandlers(token); // повторно навесить обработчики!
      const year = new Date().getFullYear();
      const month =
        currentPeriod === "month" ? new Date().getMonth() + 1 : undefined;
      loadCategoryReport(
        token,
        year,
        month,
        document.getElementById("report-currency-select").value
      );
      loadMonthlyReport(
        token,
        year,
        document.getElementById("report-currency-select").value
      );
    };
  });
  // После навешивания всех вкладок, навесить обработчик на fab-add-transaction
  setupReportAddTransactionHandler(token);
  // Добавляем обработчик для обычной кнопки "add-transaction-btn"
  const btn = document.getElementById("reports-add-transaction-btn");
  if (btn) btn.onclick = () => setupReportAddTransactionHandler(token);
}

export async function renderReports(token) {
  const view = document.getElementById("reports-view");
  const currencyOptions = [
    { code: "BYN", name: "Белорусский рубль" },
    { code: "USD", name: "Доллар США" },
    { code: "RUB", name: "Российский рубль" },
    { code: "EUR", name: "Евро" },
  ];
  const selectedCurrency = getCurrency();
  view.innerHTML = `
    <div class="d-flex align-items-center gap-2 mb-3 flex-wrap" id="period-currency-bar">
      <div id="period-tabs-container" class="flex-shrink-0">${renderPeriodTabs(
        currentPeriod
      )}</div>
      <select class="form-select form-select-sm flex-shrink-0" id="report-currency-select" style="min-width:80px;max-width:100px;text-transform:uppercase;">
        ${currencyOptions
          .map(
            (c) =>
              `<option value="${c.code}"${
                c.code === selectedCurrency ? " selected" : ""
              }>${c.code}</option>`
          )
          .join("")}
      </select>
    </div>
    <div class="d-flex align-items-center gap-2 mb-3" id="category-type-tabs-bar">
      <ul class="nav nav-pills" id="category-type-tabs" style="width:100%;max-width:340px;">
        <li class="nav-item flex-fill text-center"><a class="nav-link${
          currentCategoryType === "expense" ? " active" : ""
        }" href="#" data-type="expense" style="width:100%">Расходы</a></li>
        <li class="nav-item flex-fill text-center"><a class="nav-link${
          currentCategoryType === "income" ? " active" : ""
        }" href="#" data-type="income" style="width:100%">Доходы</a></li>
      </ul>
      <!-- Desktop-only Add Transaction Button for Reports -->
      <button class="btn btn-success btn-custom-radius d-none d-md-inline ms-2" id="reports-add-transaction-btn-desktop"><i class="bi bi-plus"></i> Новая транзакция</button>
    </div>
    <div id="reports-alert"></div>
    <div id="category-report"></div>
    <div id="monthly-report"></div>
    <!-- Mobile-only FAB for Reports -->
    <button class="fab-add d-md-none" id="reports-add-transaction-btn-fab" title="Новая транзакция"><i class="bi bi-plus"></i></button>
    `;
  document.getElementById("report-currency-select").onchange = (e) => {
    localStorage.setItem("global_currency", e.target.value);
    const year = new Date().getFullYear();
    const month =
      currentPeriod === "month" ? new Date().getMonth() + 1 : undefined;
    loadCategoryReport(token, year, month, e.target.value);
    loadMonthlyReport(token, year, e.target.value);
  };
  await setupReportTabHandlers(token); // навесить обработчики вкладок и fab
  await loadCategoryReport(
    token,
    new Date().getFullYear(),
    undefined,
    selectedCurrency
  );
  await loadMonthlyReport(token, new Date().getFullYear(), selectedCurrency);
}

function setupReportAddTransactionHandler(token) {
  const desktopBtn = document.getElementById(
    "reports-add-transaction-btn-desktop"
  );
  const fabBtn = document.getElementById("reports-add-transaction-btn-fab");

  const clickHandler = async () => {
    const categoriesResp = await import("./api.js").then((m) =>
      m.apiGetCategories(token, { limit: 1000, offset: 0 })
    );
    let categories = [];
    if (categoriesResp.ok) categories = await categoriesResp.json();
    else categories = []; // Ensure categories is an array even on error

    const txModule = await import("./transactions.js");
    txModule.showTransactionModal(token, categories, async () => {
      await loadCategoryReport(
        token,
        new Date().getFullYear(),
        currentPeriod === "month" ? new Date().getMonth() + 1 : undefined,
        document.getElementById("report-currency-select").value
      );
      await loadMonthlyReport(
        token,
        new Date().getFullYear(),
        document.getElementById("report-currency-select").value
      );
    });
  };

  if (desktopBtn) {
    desktopBtn.onclick = clickHandler;
  }
  if (fabBtn) {
    fabBtn.onclick = clickHandler;
  }
}

async function loadCategoryReport(token, year, month, currency = "RUB") {
  const container = document.getElementById("category-report");
  container.innerHTML =
    '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>';
  try {
    // Получаем категории для отображения имён и типов
    let categories = await getCachedCategories(token);
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    const catTypeMap = Object.fromEntries(
      categories.map((c) => [c.id, c.type])
    );
    const catColorMap = Object.fromEntries(
      categories.map((c) => [c.id, c.color])
    );
    const catIconMap = Object.fromEntries(
      categories.map((c) => [c.id, c.icon])
    );
    const resp = await apiGetCategorySummary(token, year, month, currency);
    if (resp.ok) {
      const data = await resp.json();
      // data: { category_id: сумма }
      let rows = Object.entries(data).map(([catId, sum]) => ({
        id: catId,
        name: catMap[catId] || `Категория #${catId}`,
        type: catTypeMap[catId] || "expense",
        color: catColorMap[catId] || "#e3f0ff",
        icon: catIconMap[catId] || "bi-tag",
        sum,
      }));
      // Фильтрация по типу (расход/доход)
      rows = rows.filter((r) => r.type === currentCategoryType);
      if (rows.length === 0) {
        container.innerHTML =
          '<div class="alert alert-info text-center py-4"><i class="bi bi-bar-chart fs-2"></i><br>Нет данных для отчёта</div>';
        return;
      }
      // Сумма всех категорий
      const total = rows.reduce((acc, r) => acc + r.sum, 0);
      // Считаем проценты
      rows.forEach((r) => {
        r.percent = total ? (r.sum / total) * 100 : 0;
      });
      // --- Мобильный UI: карточки категорий ---
      const cardsHtml =
        '<div class="category-cards-list">' +
        rows
          .map(
            (r, i) =>
              `<div class="category-card fade-in-row" style="background:${
                r.color
              }22;animation-delay:${i * 0.04}s">
                <div class="cat-icon" style="background:${
                  r.color
                };"><i class="bi ${r.icon}"></i></div>
                <div class="flex-grow-1">
                  <div class="cat-name fw-bold">${r.name}</div>
                  <div class="cat-percent" style="font-size:0.98em;opacity:0.7;">${r.percent.toFixed(
                    1
                  )}%</div>
                </div>
                <div class="cat-sum fw-bold">${r.sum.toLocaleString("ru-RU", {
                  style: "currency",
                  currency,
                })}</div>
              </div>`
          )
          .join("") +
        "</div>";
      // --- Chart.js ---
      container.innerHTML = `
        <div class="category-pie-chart-container mb-3">
          <canvas id="category-pie" style="max-width:320px;max-height:320px;"></canvas>
          <div class="category-pie-center-sum">${total.toLocaleString("ru-RU", {
            style: "currency",
            currency,
          })}</div>
        </div>
        ${cardsHtml}
      `;
      // --- Chart.js pie ---
      const ctx = document.getElementById("category-pie").getContext("2d");
      const colors = rows.map((r) => r.color);
      if (window.categoryPieChart) window.categoryPieChart.destroy();
      window.categoryPieChart = new window.Chart(ctx, {
        type: "doughnut",
        data: {
          labels: rows.map((r) => r.name),
          datasets: [
            {
              data: rows.map((r) => r.sum),
              backgroundColor: colors,
              borderWidth: 2,
            },
          ],
        },
        options: {
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = context.raw || 0;
                  return `${label}: ${value.toLocaleString("ru-RU", {
                    style: "currency",
                    currency,
                  })}`;
                },
              },
            },
          },
          cutout: "60%",
          responsive: true,
        },
      });
    } else {
      container.innerHTML =
        '<div class="alert alert-danger">Ошибка загрузки отчёта по категориям</div>';
    }
  } catch (e) {
    let msg = "Ошибка загрузки отчёта по категориям";
    if (e && e.message) msg += ": " + e.message;
    if (e && e.response) {
      e.response.text().then((t) => {
        container.innerHTML = `<div class="alert alert-danger">${msg}<br><pre>${t}</pre></div>`;
      });
    } else {
      container.innerHTML = `<div class="alert alert-danger">${msg}</div>`;
    }
  }
}

async function loadMonthlyReport(token, year, currency = "RUB") {
  const container = document.getElementById("monthly-report");
  container.innerHTML =
    '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>';
  try {
    // Получаем категории для фильтрации по типу
    const catResp = await import("./api.js").then((m) =>
      m.apiGetCategories(token, { limit: 1000, offset: 0 })
    );
    let categories = [];
    if (catResp.ok) categories = await catResp.json();
    const catTypeMap = Object.fromEntries(
      categories.map((c) => [c.id, c.type])
    );
    // Получаем помесячные суммы по выбранному типу
    const resp = await apiGetMonthlySummary(
      token,
      year,
      currency,
      currentCategoryType
    );
    if (resp.ok) {
      const data = await resp.json(); // { месяц: сумма }
      const months = [
        "Январь",
        "Февраль",
        "Март",
        "Апрель",
        "Май",
        "Июнь",
        "Июль",
        "Август",
        "Сентябрь",
        "Октябрь",
        "Ноябрь",
        "Декабрь",
      ];
      const rows = Object.entries(data)
        .map(([month, sum]) => ({
          month: months[Number(month) - 1] || month,
          sum,
        }))
        .sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));
      if (rows.length === 0) {
        container.innerHTML =
          '<div class="alert alert-info">Нет данных за выбранный год</div>';
        return;
      }
      container.innerHTML = `<h5 class='mt-4'>Помесячно</h5>
        <div class="table-responsive"><table class="table table-bordered align-middle mt-2">
          <thead class='table-light'><tr><th>Месяц</th><th>Сумма (${currency})</th></tr></thead>
          <tbody>
            ${rows
              .map(
                (r) =>
                  `<tr class="fade-in-row"><td>${
                    r.month
                  }</td><td>${r.sum.toLocaleString("ru-RU", {
                    style: "currency",
                    currency: currency,
                  })}</td></tr>`
              )
              .join("")}
          </tbody>
        </table></div>`;
    } else {
      container.innerHTML =
        '<div class="alert alert-danger">Ошибка загрузки помесячного отчёта</div>';
    }
  } catch (e) {
    container.innerHTML =
      '<div class="alert alert-danger">Ошибка загрузки помесячного отчёта</div>';
  }
}
