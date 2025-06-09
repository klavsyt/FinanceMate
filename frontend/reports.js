// reports.js
import { apiGetCategorySummary, apiGetMonthlySummary } from "./api.js";
import { showAlert, clearAlert } from "./ui.js";
import { getCurrency } from "./currency.js";

export async function renderReports(token) {
  const view = document.getElementById("reports-view");
  const currencyOptions = [
    { code: "BYN", name: "Белорусский рубль" },
    { code: "USD", name: "Доллар США" },
    { code: "RUB", name: "Российский рубль" },
    { code: "EUR", name: "Евро" },
  ];
  const selectedCurrency = getCurrency();
  view.innerHTML = `<div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0"><i class="bi bi-bar-chart"></i> Отчёты</h4>
    <form class="d-flex gap-2" id="report-form">
      <input type="number" class="form-control" name="year" placeholder="Год" min="2000" max="2100" value="${new Date().getFullYear()}" required>
      <input type="number" class="form-control" name="month" placeholder="Месяц (опц.)" min="1" max="12">
      <select class="form-select" name="currency" id="report-currency-select" style="min-width:110px;">
        ${currencyOptions
          .map(
            (c) =>
              `<option value="${c.code}"${
                c.code === selectedCurrency ? " selected" : ""
              }>${c.code} — ${c.name}</option>`
          )
          .join("")}
      </select>
      <button class="btn btn-primary">Показать</button>
    </form>
  </div>
  <div id="reports-alert"></div>
  <div id="category-report"></div>
  <div id="monthly-report"></div>`;
  // Обработчик смены валюты
  document.getElementById("report-currency-select").onchange = (e) => {
    localStorage.setItem("global_currency", e.target.value);
    renderReports(token);
  };
  document.getElementById("report-form").onsubmit = async (e) => {
    e.preventDefault();
    const year = e.target.year.value;
    const month = e.target.month.value;
    const currency = document.getElementById("report-currency-select").value;
    await loadCategoryReport(token, year, month, currency);
    await loadMonthlyReport(token, year, currency);
  };
  // По умолчанию показываем за текущий год
  await loadCategoryReport(
    token,
    new Date().getFullYear(),
    undefined,
    selectedCurrency
  );
  await loadMonthlyReport(token, new Date().getFullYear(), selectedCurrency);
}

async function loadCategoryReport(token, year, month, currency = "RUB") {
  const container = document.getElementById("category-report");
  container.innerHTML =
    '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>';
  try {
    // Получаем категории для отображения имён
    const catResp = await import("./api.js").then((m) =>
      m.apiGetCategories(token, { limit: 1000, offset: 0 })
    );
    let categories = [];
    if (catResp.ok) categories = await catResp.json();
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    const resp = await apiGetCategorySummary(token, year, month, currency);
    if (resp.ok) {
      const data = await resp.json();
      // data: { category_id: сумма }
      const rows = Object.entries(data).map(([catId, sum]) => ({
        name: catMap[catId] || `Категория #${catId}`,
        sum,
      }));
      if (rows.length === 0) {
        container.innerHTML = showEmptyState(
          container,
          "bi-bar-chart",
          "Нет данных для отчёта"
        );
        return;
      }
      container.innerHTML = `<h5 class='mt-4'>Сумма по категориям</h5>
        <div class="table-responsive"><table class="table table-bordered align-middle mt-2">
          <thead class='table-light'><tr><th>Категория</th><th>Сумма (${currency})</th></tr></thead>
          <tbody>
            ${rows
              .map(
                (r) =>
                  `<tr class="fade-in-row"><td>${
                    r.name
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
        '<div class="alert alert-danger">Ошибка загрузки отчёта по категориям</div>';
    }
  } catch (e) {
    container.innerHTML =
      '<div class="alert alert-danger">Ошибка загрузки отчёта по категориям</div>';
  }
}

async function loadMonthlyReport(token, year, currency = "RUB") {
  const container = document.getElementById("monthly-report");
  container.innerHTML =
    '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>';
  try {
    const resp = await apiGetMonthlySummary(token, year, currency);
    if (resp.ok) {
      const data = await resp.json();
      // data: { месяц: сумма }
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
