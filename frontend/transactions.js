// transactions.js
import {
  apiGetTransactions,
  apiCreateTransaction,
  apiDeleteTransaction,
  apiGetCategories,
} from "./api.js";
import { showAlert, clearAlert, confirmModal, showToast } from "./ui.js";
import { applyFilters, sortBy } from "./tableUtils.js";
import { getCurrency } from "./currency.js";

let txPageOffset = 0;
const txPageLimit = 20;
let txFilters = {
  category: "",
  search: "",
  sort: "date_desc",
};

export async function renderTransactions(token) {
  const view = document.getElementById("transactions-view");
  view.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <div class="d-flex gap-2 flex-wrap">
        <select class="form-select" id="tx-filter-category" style="min-width:140px;"><option value="">Все категории</option></select>
        <input class="form-control" id="tx-filter-search" placeholder="Поиск по комментарию..." style="min-width:180px;">
        <select class="form-select" id="tx-sort" style="min-width:140px;">
          <option value="date_desc">Дата ↓</option>
          <option value="date_asc">Дата ↑</option>
          <option value="amount_desc">Сумма ↓</option>
          <option value="amount_asc">Сумма ↑</option>
        </select>
      </div>
      <button class="btn btn-success" id="add-transaction-btn"><i class="bi bi-plus"></i> Добавить</button>
    </div>
    <div id="transactions-alert"></div>
    <div id="transactions-table"></div>`;
  // Заполнить фильтр категорий
  const categoriesResp = await apiGetCategories(token);
  let categories = [];
  if (categoriesResp.ok) categories = await categoriesResp.json();
  const catSelect = document.getElementById("tx-filter-category");
  categories.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    catSelect.appendChild(opt);
  });
  // Восстановить значения фильтров
  catSelect.value = txFilters.category;
  document.getElementById("tx-filter-search").value = txFilters.search;
  document.getElementById("tx-sort").value = txFilters.sort;
  // Навесить обработчики
  catSelect.onchange = (e) => {
    txFilters.category = e.target.value;
    txPageOffset = 0;
    loadTransactions(token);
  };
  document.getElementById("tx-filter-search").oninput = (e) => {
    txFilters.search = e.target.value;
    txPageOffset = 0;
    loadTransactions(token);
  };
  document.getElementById("tx-sort").onchange = (e) => {
    txFilters.sort = e.target.value;
    loadTransactions(token);
  };
  document.getElementById("add-transaction-btn").onclick = () =>
    showTransactionModal(token);
  loadTransactions(token);
}

async function loadTransactions(token) {
  const table = document.getElementById("transactions-table");
  const alert = document.getElementById("transactions-alert");
  table.innerHTML =
    '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>';
  clearAlert(alert);
  // Получаем категории для отображения названия
  const categoriesResp = await apiGetCategories(token);
  let categories = [];
  if (categoriesResp.ok) categories = await categoriesResp.json();
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const response = await apiGetTransactions(token, {
    limit: txPageLimit,
    offset: txPageOffset,
  });
  if (response.ok) {
    let txs = await response.json();
    // --- Фильтрация и поиск ---
    const filters = [];
    if (txFilters.category)
      filters.push((t) => String(t.category_id) === String(txFilters.category));
    if (txFilters.search)
      filters.push((t) =>
        (t.comment || "").toLowerCase().includes(txFilters.search.toLowerCase())
      );
    txs = applyFilters(txs, filters);
    // --- Сортировка ---
    if (txFilters.sort === "date_desc") txs = sortBy(txs, "date", "desc");
    if (txFilters.sort === "date_asc") txs = sortBy(txs, "date", "asc");
    if (txFilters.sort === "amount_desc") txs = sortBy(txs, "amount", "desc");
    if (txFilters.sort === "amount_asc") txs = sortBy(txs, "amount", "asc");
    if (txs.length === 0 && txPageOffset > 0) {
      // Если на странице нет данных, но offset > 0, возвращаемся назад
      txPageOffset = Math.max(0, txPageOffset - txPageLimit);
      return loadTransactions(token);
    }
    if (txs.length === 0) {
      table.innerHTML =
        '<div class="alert alert-info text-center py-4"><i class="bi bi-emoji-frown fs-2"></i><br>Транзакции не найдены. Добавьте первую!</div>';
    } else {
      const currency = getCurrency();
      table.innerHTML = `<div class="table-responsive"><table class="table table-hover align-middle">
        <thead><tr><th>Сумма</th><th>Валюта</th><th>Дата</th><th>Категория</th><th>Комментарий</th><th></th></tr></thead><tbody>
        ${txs
          .map(
            (t) =>
              `<tr class="fade-in-row"><td>${t.amount.toLocaleString("ru-RU", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}</td><td>${t.currency}</td><td>${
                t.date.split("T")[0]
              }</td><td>${catMap[t.category_id] || t.category_id}</td><td>${
                t.comment || ""
              }</td><td><button class='btn btn-sm btn-primary' data-edit-id='${
                t.id
              }'><i class="bi bi-pencil"></i> Редактировать</button> <button class='btn btn-sm btn-danger' data-id='${
                t.id
              }'><i class="bi bi-trash"></i> Удалить</button></td></tr>`
          )
          .join("")}
        </tbody></table></div>`;
      // Пагинация
      table.innerHTML += `<div class="d-flex justify-content-between align-items-center mt-3">
        <button class="btn btn-outline-secondary" id="tx-prev-page" ${
          txPageOffset === 0 ? "disabled" : ""
        }>Назад</button>
        <button class="btn btn-outline-secondary" id="tx-next-page" ${
          txs.length < txPageLimit ? "disabled" : ""
        }>Вперёд</button>
      </div>`;
      document.getElementById("tx-prev-page").onclick = () => {
        if (txPageOffset > 0) {
          txPageOffset -= txPageLimit;
          loadTransactions(token);
        }
      };
      document.getElementById("tx-next-page").onclick = () => {
        if (txs.length === txPageLimit) {
          txPageOffset += txPageLimit;
          loadTransactions(token);
        }
      };
      table.querySelectorAll(".btn-danger").forEach((btn) => {
        btn.onclick = async () => {
          confirmModal({
            title: "Удалить транзакцию?",
            body: "Вы уверены, что хотите удалить эту транзакцию?",
            onConfirm: async () => {
              const resp = await apiDeleteTransaction(token, btn.dataset.id);
              if (resp.ok) loadTransactions(token);
              else {
                showAlert(alert, "Ошибка удаления");
                showToast("Ошибка удаления транзакции", "danger");
              }
            },
          });
        };
      });
      table.querySelectorAll(".btn-primary").forEach((btn) => {
        btn.onclick = async () => {
          const txId = Number(btn.getAttribute("data-edit-id"));
          const tx = txs.find((t) => t.id === txId);
          if (tx) await showEditTransactionModal(token, tx, categories);
        };
      });
    }
  } else {
    table.innerHTML = "";
    showAlert(alert, "Ошибка загрузки транзакций");
  }
}

async function showTransactionModal(token) {
  // Получаем категории для выбора
  const categoriesResp = await apiGetCategories(token);
  let categories = [];
  if (categoriesResp.ok) categories = await categoriesResp.json();
  const currencyOptions = [
    { code: "BYN", name: "Белорусский рубль" },
    { code: "USD", name: "Доллар США" },
    { code: "RUB", name: "Российский рубль" },
    { code: "EUR", name: "Евро" },
  ];
  const modalHtml = `
    <div class="modal fade" id="transactionModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Добавить транзакцию</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="transaction-form">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Сумма</label>
                <input type="number" class="form-control" name="amount" required>
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
              <div class="mb-3">
                <label class="form-label">Дата</label>
                <input type="date" class="form-control" name="date" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Категория</label>
                <select class="form-select" name="category_id" required>
                  ${categories
                    .map((c) => `<option value="${c.id}">${c.name}</option>`)
                    .join("")}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Комментарий</label>
                <input type="text" class="form-control" name="comment">
              </div>
              <div id="transaction-modal-alert"></div>
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
  const modal = new bootstrap.Modal(
    document.getElementById("transactionModal")
  );
  modal.show();
  document.getElementById("transaction-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const alert = document.getElementById("transaction-modal-alert");
    clearAlert(alert);
    // Клиентская валидация
    const amount = Number(form.amount.value);
    const currency = form.currency.value.trim();
    const date = form.date.value;
    const category_id = form.category_id.value;
    let error = "";
    if (!amount || isNaN(amount) || amount <= 0)
      error = "Введите корректную сумму (> 0)";
    else if (!currency) error = "Укажите валюту";
    else if (!date) error = "Укажите дату";
    else if (!category_id) error = "Выберите категорию";
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
      amount,
      currency,
      date,
      category_id: Number(category_id),
      comment: form.comment.value,
    };
    const resp = await apiCreateTransaction(token, data);
    saveBtn.disabled = false;
    saveBtn.innerHTML = origBtnHtml;
    if (resp.ok) {
      modal.hide();
      document.getElementById("transactionModal").remove();
      renderTransactions(token);
      showToast("Транзакция успешно добавлена!", "success");
    } else {
      const err = await resp.json().catch(() => ({}));
      showAlert(alert, "Ошибка: " + (err.detail || ""));
      showToast(
        "Ошибка добавления транзакции: " + (err.detail || ""),
        "danger"
      );
    }
  };
  document
    .getElementById("transactionModal")
    .addEventListener("hidden.bs.modal", () => {
      document.getElementById("transactionModal").remove();
    });
}

async function showEditTransactionModal(token, tx, categories) {
  const categoryOptions = categories
    .map(
      (c) =>
        `<option value="${c.id}"${c.id === tx.category_id ? " selected" : ""}>${
          c.name
        }</option>`
    )
    .join("");
  const modalHtml = `
    <div class="modal fade" id="editTransactionModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Редактировать транзакцию</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="edit-transaction-form">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Сумма</label>
                <input type="number" class="form-control" name="amount" value="${
                  tx.amount
                }" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Валюта</label>
                <input type="text" class="form-control" name="currency" value="${
                  tx.currency
                }" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Дата</label>
                <input type="date" class="form-control" name="date" value="${
                  tx.date.split("T")[0]
                }" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Категория</label>
                <select class="form-select" name="category_id" required>
                  ${categoryOptions}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Комментарий</label>
                <input type="text" class="form-control" name="comment" value="${
                  tx.comment || ""
                }">
              </div>
              <div id="edit-transaction-modal-alert"></div>
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
  const modal = new bootstrap.Modal(
    document.getElementById("editTransactionModal")
  );
  modal.show();
  document.getElementById("edit-transaction-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const alert = document.getElementById("edit-transaction-modal-alert");
    clearAlert(alert);
    // Клиентская валидация
    const amount = Number(form.amount.value);
    const currency = form.currency.value.trim();
    const date = form.date.value;
    const category_id = form.category_id.value;
    let error = "";
    if (!amount || isNaN(amount) || amount <= 0)
      error = "Введите корректную сумму (> 0)";
    else if (!currency) error = "Укажите валюту";
    else if (!date) error = "Укажите дату";
    else if (!category_id) error = "Выберите категорию";
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
      amount,
      currency,
      date,
      category_id: Number(category_id),
      comment: form.comment.value,
    };
    const resp = await fetch(`/api/v1/transaction/transactions/${tx.id}`, {
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
      document.getElementById("editTransactionModal").remove();
      renderTransactions(token);
      showToast("Транзакция успешно обновлена!", "success");
    } else {
      const err = await resp.json().catch(() => ({}));
      showAlert(alert, "Ошибка: " + (err.detail || ""));
      showToast(
        "Ошибка обновления транзакции: " + (err.detail || ""),
        "danger"
      );
    }
  };
  document
    .getElementById("editTransactionModal")
    .addEventListener("hidden.bs.modal", () => {
      document.getElementById("editTransactionModal").remove();
    });
}
