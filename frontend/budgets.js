// budgets.js
import { apiGetBudgets, apiCreateBudget, apiDeleteBudget } from "./api.js";
import { showAlert, clearAlert, confirmModal, showToast } from "./ui.js";
import { applyFilters, sortBy } from "./tableUtils.js";
import { getCurrency } from "./currency.js";

let budgetPageOffset = 0;
const budgetPageLimit = 20;
let budgetFilters = {
  category: "",
  sort: "limit_desc",
};

export async function renderBudgets(token) {
  const view = document.getElementById("budgets-view");
  view.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <div class="d-flex gap-2 flex-wrap">
        <select class="form-select" id="budget-filter-category" style="min-width:140px;"><option value="">Все категории</option></select>
        <select class="form-select" id="budget-sort" style="min-width:140px;">
          <option value="limit_desc">Лимит ↓</option>
          <option value="limit_asc">Лимит ↑</option>
          <option value="period_asc">Период ↑</option>
          <option value="period_desc">Период ↓</option>
        </select>
      </div>
      <button class="btn btn-success" id="add-budget-btn"><i class="bi bi-plus"></i> Добавить</button>
    </div>
    <div id="budgets-alert"></div>
    <div id="budgets-table"></div>`;
  // Заполнить фильтр категорий
  const categoriesResp = await import("./api.js").then((m) =>
    m.apiGetCategories(token)
  );
  let categories = [];
  if (categoriesResp.ok) categories = await categoriesResp.json();
  const catSelect = document.getElementById("budget-filter-category");
  categories.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    catSelect.appendChild(opt);
  });
  // Восстановить значения фильтров
  catSelect.value = budgetFilters.category;
  document.getElementById("budget-sort").value = budgetFilters.sort;
  // Навесить обработчики
  catSelect.onchange = (e) => {
    budgetFilters.category = e.target.value;
    budgetPageOffset = 0;
    loadBudgets(token);
  };
  document.getElementById("budget-sort").onchange = (e) => {
    budgetFilters.sort = e.target.value;
    loadBudgets(token);
  };
  document.getElementById("add-budget-btn").onclick = () =>
    showBudgetModal(token);
  loadBudgets(token);
}

async function loadBudgets(token) {
  const table = document.getElementById("budgets-table");
  const alert = document.getElementById("budgets-alert");
  table.innerHTML =
    '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>';
  clearAlert(alert);
  // Получаем категории для отображения названия
  const categoriesResp = await import("./api.js").then((m) =>
    m.apiGetCategories(token)
  );
  let categories = [];
  if (categoriesResp.ok) categories = await categoriesResp.json();
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const response = await apiGetBudgets(token, {
    limit: budgetPageLimit,
    offset: budgetPageOffset,
  });
  const currency = getCurrency();
  if (response.ok) {
    let budgets = await response.json();
    // --- Фильтрация ---
    const filters = [];
    if (budgetFilters.category)
      filters.push(
        (b) => String(b.category_id) === String(budgetFilters.category)
      );
    budgets = applyFilters(budgets, filters);
    // --- Сортировка ---
    if (budgetFilters.sort === "limit_desc")
      budgets = sortBy(budgets, "limit", "desc");
    if (budgetFilters.sort === "limit_asc")
      budgets = sortBy(budgets, "limit", "asc");
    if (budgetFilters.sort === "period_asc")
      budgets = sortBy(budgets, "period", "asc");
    if (budgetFilters.sort === "period_desc")
      budgets = sortBy(budgets, "period", "desc");
    if (budgets.length === 0 && budgetPageOffset > 0) {
      budgetPageOffset = Math.max(0, budgetPageOffset - budgetPageLimit);
      return loadBudgets(token);
    }
    if (budgets.length === 0) {
      table.innerHTML =
        '<div class="alert alert-info text-center py-4"><i class="bi bi-emoji-frown fs-2"></i><br>Бюджеты не найдены. Добавьте первый бюджет!</div>';
    } else {
      table.innerHTML = `<div class="table-responsive"><table class="table table-hover align-middle">
        <thead><tr><th>Категория</th><th>Лимит</th><th>Период</th><th>Валюта</th><th></th></tr></thead><tbody>
        ${budgets
          .map(
            (b) =>
              `<tr class="fade-in-row"><td>${
                catMap[b.category_id] || b.category_id
              }</td><td>${b.limit.toLocaleString("ru-RU", {
                style: "currency",
                currency,
              })}</td><td>${b.period}</td><td>${
                b.currency
              }</td><td><button class='btn btn-sm btn-primary' data-edit-id='${
                b.id
              }'><i class="bi bi-pencil"></i> Редактировать</button> <button class='btn btn-sm btn-danger' data-id='${
                b.id
              }'><i class="bi bi-trash"></i> Удалить</button></td></tr>`
          )
          .join("")}
        </tbody></table></div>`;
      // Пагинация
      table.innerHTML += `<div class="d-flex justify-content-between align-items-center mt-3">
        <button class="btn btn-outline-secondary" id="budget-prev-page" ${
          budgetPageOffset === 0 ? "disabled" : ""
        }>Назад</button>
        <button class="btn btn-outline-secondary" id="budget-next-page" ${
          budgets.length < budgetPageLimit ? "disabled" : ""
        }>Вперёд</button>
      </div>`;
      document.getElementById("budget-prev-page").onclick = () => {
        if (budgetPageOffset > 0) {
          budgetPageOffset -= budgetPageLimit;
          loadBudgets(token);
        }
      };
      document.getElementById("budget-next-page").onclick = () => {
        if (budgets.length === budgetPageLimit) {
          budgetPageOffset += budgetPageLimit;
          loadBudgets(token);
        }
      };
      table.querySelectorAll(".btn-danger").forEach((btn) => {
        btn.onclick = async () => {
          confirmModal({
            title: "Удалить бюджет?",
            body: "Вы уверены, что хотите удалить этот бюджет?",
            onConfirm: async () => {
              const resp = await apiDeleteBudget(token, btn.dataset.id);
              console.log("DELETE status", resp.status, "id", btn.dataset.id);
              // После любого удаления сбрасываем пагинацию
              budgetPageOffset = 0;
              if (resp.ok) {
                showToast("Бюджет успешно удалён!", "success");
                loadBudgets(token);
              } else if (resp.status === 404) {
                showToast("Бюджет уже удалён или не найден", "warning");
                loadBudgets(token);
              } else {
                showAlert(alert, "Ошибка удаления");
                showToast("Ошибка удаления бюджета", "danger");
                loadBudgets(token);
              }
            },
          });
        };
      });
      table.querySelectorAll(".btn-primary").forEach((btn) => {
        btn.onclick = async () => {
          const budgetId = Number(btn.getAttribute("data-edit-id"));
          const budget = budgets.find((b) => b.id === budgetId);
          if (budget) await showEditBudgetModal(token, budget, categories);
        };
      });
    }
  } else {
    table.innerHTML = "";
    showAlert(alert, "Ошибка загрузки бюджетов");
  }
}

function showBudgetModal(token) {
  (async () => {
    // Получаем список категорий для выпадающего списка
    const categoriesResp = await import("./api.js").then((m) =>
      m.apiGetCategories(token)
    );
    let categories = [];
    if (categoriesResp.ok) categories = await categoriesResp.json();
    const categoryOptions = categories
      .map((c) => `<option value="${c.id}">${c.name}</option>`)
      .join("");
    const currencyOptions = [
      { code: "BYN", name: "Белорусский рубль" },
      { code: "USD", name: "Доллар США" },
      { code: "RUB", name: "Российский рубль" },
      { code: "EUR", name: "Евро" },
    ];
    const modalHtml = `
      <div class="modal fade" id="budgetModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Добавить бюджет</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="budget-form">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Категория</label>
                  <select class="form-select" name="category_id" required>
                    <option value="">Выберите категорию</option>
                    ${categoryOptions}
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Лимит</label>
                  <input type="number" class="form-control" name="limit" required max="99999999.99" step="0.01">
                </div>
                <div class="mb-3">
                  <label class="form-label">Период</label>
                  <select class="form-select" name="period" required>
                    <option value="monthly">Месяц</option>
                    <option value="yearly">Год</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Валюта</label>
                  <select class="form-select" name="currency" required>
                    ${currencyOptions
                      .map(
                        (c) =>
                          `<option value="${c.code}"${
                            c.code === "RUB" ? " selected" : ""
                          }>${c.code} — ${c.name}</option>`
                      )
                      .join("")}
                  </select>
                </div>
                <div id="budget-modal-alert"></div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-success">Сохранить</button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = new bootstrap.Modal(document.getElementById("budgetModal"));
    modal.show();
    document.getElementById("budget-form").onsubmit = async (e) => {
      e.preventDefault();
      const form = e.target;
      const alert = document.getElementById("budget-modal-alert");
      clearAlert(alert);
      // Клиентская валидация
      const category_id = form.category_id.value;
      const limit = Number(form.limit.value);
      const period = form.period.value;
      const currency = form.currency.value;
      let error = "";
      if (!category_id) error = "Укажите категорию";
      else if (!limit || isNaN(limit) || limit <= 0)
        error = "Введите корректный лимит (> 0)";
      else if (limit > 99999999.99)
        error = "Максимальный лимит — 99 999 999.99";
      else if (!period) error = "Выберите период";
      else if (!currency) error = "Выберите валюту";
      if (error) {
        form.limit.classList.toggle(
          "is-invalid",
          limit > 99999999.99 || limit <= 0 || isNaN(limit)
        );
        showAlert(alert, error, "warning");
        return;
      } else {
        form.limit.classList.remove("is-invalid");
      }
      const saveBtn = form.querySelector("button[type='submit']");
      const origBtnHtml = saveBtn.innerHTML;
      saveBtn.disabled = true;
      saveBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Сохранение...';
      const data = {
        category_id: Number(category_id),
        limit,
        period,
        currency,
      };
      const resp = await apiCreateBudget(token, data);
      saveBtn.disabled = false;
      saveBtn.innerHTML = origBtnHtml;
      if (resp.ok) {
        modal.hide();
        document.getElementById("budgetModal").remove();
        renderBudgets(token);
        showToast("Бюджет успешно создан!", "success");
      } else {
        let errText = "";
        try {
          const err = await resp.json();
          if (Array.isArray(err.detail)) {
            errText = err.detail.map((e) => e.msg).join("; ");
          } else if (typeof err.detail === "string") {
            errText = err.detail;
          } else {
            errText = JSON.stringify(err);
          }
        } catch (e) {
          errText = resp.statusText || "Неизвестная ошибка";
        }
        showAlert(alert, "Ошибка: " + errText, "danger");
        showToast("Ошибка создания бюджета: " + errText, "danger");
      }
    };
    document
      .getElementById("budgetModal")
      .addEventListener("hidden.bs.modal", () => {
        document.getElementById("budgetModal").remove();
      });
  })();
}

async function showEditBudgetModal(token, budget, categories) {
  const categoryOptions = categories
    .map(
      (c) =>
        `<option value="${c.id}"${
          c.id === budget.category_id ? " selected" : ""
        }>${c.name}</option>`
    )
    .join("");
  const modalHtml = `
    <div class="modal fade" id="editBudgetModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Редактировать бюджет</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="edit-budget-form">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Категория</label>
                <select class="form-select" name="category_id" required>
                  ${categoryOptions}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Лимит</label>
                <input type="number" class="form-control" name="limit" value="${
                  budget.limit
                }" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Период</label>
                <select class="form-select" name="period" required>
                  <option value="monthly"${
                    budget.period === "monthly" ? " selected" : ""
                  }>Месяц</option>
                  <option value="yearly"${
                    budget.period === "yearly" ? " selected" : ""
                  }>Год</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Валюта</label>
                <select class="form-select" name="currency" required>
                  ${["BYN", "USD", "RUB", "EUR"]
                    .map(
                      (code) =>
                        `<option value="${code}"${
                          code === budget.currency ? " selected" : ""
                        }>${code}</option>`
                    )
                    .join("")}
                </select>
              </div>
              <div id="edit-budget-modal-alert"></div>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-success">Сохранить</button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const modal = new bootstrap.Modal(document.getElementById("editBudgetModal"));
  modal.show();
  document.getElementById("edit-budget-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const alert = document.getElementById("edit-budget-modal-alert");
    clearAlert(alert);
    // Клиентская валидация
    const category_id = form.category_id.value;
    const limit = Number(form.limit.value);
    const period = form.period.value;
    const currency = form.currency.value;
    let error = "";
    if (!category_id) error = "Укажите категорию";
    else if (!limit || isNaN(limit) || limit <= 0)
      error = "Введите корректный лимит (> 0)";
    else if (limit > 99999999.99) error = "Максимальный лимит — 99 999 999.99";
    else if (!period) error = "Выберите период";
    if (error) {
      showAlert(alert, error, "warning");
      return;
    }
    const saveBtn = form.querySelector("button[type='submit']");
    const origBtnHtml = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Сохранение...';
    const data = {
      category_id: Number(category_id),
      limit,
      period,
      currency,
    };
    const resp = await fetch(`/api/v1/budget/budgets/${budget.id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(data),
    });
    saveBtn.disabled = false;
    saveBtn.innerHTML = origBtnHtml;
    if (resp.ok) {
      modal.hide();
      document.getElementById("editBudgetModal").remove();
      renderBudgets(token);
      showToast("Бюджет успешно обновлён!", "success");
    } else {
      const err = await resp.json().catch(() => ({}));
      showAlert(alert, "Ошибка: " + (err.detail || ""));
      showToast("Ошибка обновления бюджета: " + (err.detail || ""), "danger");
    }
  };
  document
    .getElementById("editBudgetModal")
    .addEventListener("hidden.bs.modal", () => {
      document.getElementById("editBudgetModal").remove();
    });
}
