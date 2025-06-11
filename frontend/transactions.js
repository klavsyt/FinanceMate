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
  sort: "date_desc",
  type: "expense", // по умолчанию показываем расходы
};
let cachedCategories = null;

export async function setupFabAddTransactionHandler(token) {
  let categories = [];
  if (!cachedCategories) {
    const categoriesResp = await apiGetCategories(token);
    if (categoriesResp.ok) {
      categories = await categoriesResp.json();
      cachedCategories = categories;
    }
  } else {
    categories = cachedCategories;
  }

  // Visibility is handled by showSection in main.js. This function ensures handlers and styles.

  const btn = document.getElementById("add-transaction-btn");
  if (btn) {
    btn.onclick = () => {
      showTransactionModal(token, categories, () => renderTransactions(token));
    };
  }

  const fabBtn = document.getElementById("fab-add-transaction");
  if (fabBtn) {
    // Ensure FAB has correct styling that might be lost or overridden
    fabBtn.style.position = "fixed"; // Crucial for FAB positioning
    fabBtn.style.zIndex = "9999"; // Consistent with style.css, ensure it's on top
    fabBtn.className = "fab-add d-sm-none"; // Re-apply classes for base styling and responsiveness

    fabBtn.onclick = () => {
      showTransactionModal(token, categories, () => renderTransactions(token));
    };
  }
}

export async function renderTransactions(token) {
  const view = document.getElementById("transactions-view");
  if (!view) {
    console.error("Transactions view not found");
    return;
  }

  // Ensure the container is visible and correctly layered
  view.style.display = "block";
  view.classList.add("show", "active");
  view.classList.remove("fade", "tab-pane"); // Remove potentially problematic Bootstrap classes

  view.style.zIndex = "5"; // As set before, for layering within tab content
  view.style.position = "relative"; // As set before

  let typeTabsHtml = `<div id="tx-type-tabs-bar" class="mb-2 d-flex justify-content-center">
    <ul class="nav nav-pills" id="tx-type-tabs" style="width:100%;max-width:340px;">
      <li class="nav-item flex-fill text-center"><a class="nav-link${
        txFilters.type === "expense" ? " active" : ""
      }" href="#" data-type="expense" style="width:100%">Расходы</a></li>
      <li class="nav-item flex-fill text-center"><a class="nav-link${
        txFilters.type === "income" ? " active" : ""
      }" href="#" data-type="income" style="width:100%">Доходы</a></li>
    </ul>
  </div>`;
  view.innerHTML = `
    ${typeTabsHtml}
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <div class="d-flex gap-2 flex-wrap w-100">
        <select class="form-select flex-fill" id="tx-filter-category" style="min-width:140px;"><option value="">Все категории</option></select>
        <select class="form-select flex-fill" id="tx-sort" style="min-width:140px;">
          <option value="date_desc">Дата ↓</option>
          <option value="date_asc">Дата ↑</option>
          <option value="amount_desc">Сумма ↓</option>
          <option value="amount_asc">Сумма ↑</option>
        </select>
      </div>
      <button class="btn btn-success d-none d-sm-inline" id="add-transaction-btn" style="z-index:1050;"><i class="bi bi-plus"></i> Новая транзакция</button>
    </div>
    <div id="transactions-alert"></div>
    <div id="transactions-table"></div>
  `;

  let categories = [];
  if (!cachedCategories) {
    const categoriesResp = await apiGetCategories(token);
    if (categoriesResp.ok) {
      categories = await categoriesResp.json();
      cachedCategories = categories;
    }
  } else {
    categories = cachedCategories;
  }

  const catSelect = document.getElementById("tx-filter-category");
  if (catSelect) {
    const filteredCategories = categories.filter(
      (c) => c.type === txFilters.type
    );
    if (
      txFilters.category &&
      !filteredCategories.some(
        (c) => String(c.id) === String(txFilters.category)
      )
    ) {
      txFilters.category = "";
    }
    catSelect.innerHTML = '<option value="">Все категории</option>';
    filteredCategories.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      catSelect.appendChild(opt);
    });
    catSelect.value = txFilters.category;
    catSelect.onchange = (e) => {
      txFilters.category = e.target.value;
      txPageOffset = 0;
      loadTransactions(token);
    };
  }

  const txSortElement = document.getElementById("tx-sort");
  if (txSortElement) {
    txSortElement.value = txFilters.sort;
    txSortElement.onchange = (e) => {
      txFilters.sort = e.target.value;
      loadTransactions(token);
    };
  }

  document.querySelectorAll("#tx-type-tabs .nav-link").forEach((el) => {
    el.onclick = (e) => {
      e.preventDefault();
      const newType = el.getAttribute("data-type");
      if (txFilters.type !== newType) {
        txFilters.type = newType;
        txFilters.category = "";
        document.querySelectorAll("#tx-type-tabs .nav-link").forEach((tab) => {
          tab.classList.toggle(
            "active",
            tab.getAttribute("data-type") === newType
          );
        });
        txPageOffset = 0;
        renderTransactions(token);
      }
    };
  });

  // Crucial: Re-attach handlers and ensure FAB styles after view is (re)rendered.
  // This includes the #add-transaction-btn which is part of the innerHTML above.
  await setupFabAddTransactionHandler(token);

  loadTransactions(token);
}

async function loadTransactions(token) {
  const table = document.getElementById("transactions-table");
  const alert = document.getElementById("transactions-alert");
  if (!table || !alert) {
    console.error("Transaction table or alert area not found");
    return;
  }
  table.innerHTML =
    '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>';
  clearAlert(alert);

  let categories = [];
  if (!cachedCategories) {
    const categoriesResp = await apiGetCategories(token);
    if (categoriesResp.ok) {
      categories = await categoriesResp.json();
      cachedCategories = categories;
    }
  } else {
    categories = cachedCategories;
  }
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const response = await apiGetTransactions(token, {
    limit: txPageLimit,
    offset: txPageOffset,
  });
  if (response.ok) {
    let txs = await response.json();

    const filters = [];
    if (txFilters.type)
      filters.push((t) => {
        const cat = catMap[t.category_id];
        return cat && cat.type === txFilters.type;
      });
    if (txFilters.category)
      filters.push((t) => String(t.category_id) === String(txFilters.category));
    txs = applyFilters(txs, filters);

    if (txFilters.sort === "date_desc") txs = sortBy(txs, "date", "desc");
    if (txFilters.sort === "date_asc") txs = sortBy(txs, "date", "asc");
    if (txFilters.sort === "amount_desc") txs = sortBy(txs, "amount", "desc");
    if (txFilters.sort === "amount_asc") txs = sortBy(txs, "amount", "asc");

    if (txs.length === 0 && txPageOffset > 0) {
      txPageOffset = Math.max(0, txPageOffset - txPageLimit);
      return loadTransactions(token);
    }
    if (txs.length === 0) {
      table.innerHTML =
        '<div class="alert alert-info text-center py-4"><i class="bi bi-emoji-frown fs-2"></i><br>Транзакции не найдены. Добавьте первую!</div>';
    } else {
      table.innerHTML =
        '<div class="transaction-cards-list">' +
        txs
          .map((t, i) => {
            const cat = catMap[t.category_id] || {};
            return `<div class="transaction-card fade-in-row" style="background:${
              cat.color || "#e3f0ff"
            }22;animation-delay:${i * 0.04}s">
              <div class="tx-cat-icon" style="background:${
                cat.color || "#e3f0ff"
              };"><i class="bi ${cat.icon || "bi-tag"}"></i></div>
              <div class="tx-info">
                <div class="tx-amount" style="color:${
                  t.amount < 0 ? "#e15759" : "#43a047"
                };"><span>${t.amount > 0 ? "+" : ""}${t.amount.toLocaleString(
              "ru-RU",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}</span> <span class="tx-currency">${t.currency}</span></div>
                <div class="tx-category">${cat.name || t.category_id}</div>
                <div class="tx-date">${t.date.split("T")[0]}</div>
                <div class="tx-comment">${
                  t.comment
                    ? `<i class='bi bi-chat-left-text'></i> ${t.comment}`
                    : ""
                }</div>
              </div>
              <div class="d-flex flex-column align-items-end gap-1 tx-actions">
                <button class='btn btn-sm btn-primary mb-1' data-edit-id='${
                  t.id
                }'><i class="bi bi-pencil"></i></button>
                <button class='btn btn-sm btn-danger' data-id='${
                  t.id
                }'><i class="bi bi-trash"></i></button>
              </div>
            </div>`;
          })
          .join("") +
        "</div>";

      table.innerHTML += `<div class="d-flex justify-content-between align-items-center mt-3">
        <button class="btn btn-outline-secondary" id="tx-prev-page" ${
          txPageOffset === 0 ? "disabled" : ""
        }>Назад</button>
        <button class="btn btn-outline-secondary" id="tx-next-page" ${
          txs.length < txPageLimit ? "disabled" : ""
        }>Вперёд</button>
      </div>`;
      const prevPageBtn = document.getElementById("tx-prev-page");
      if (prevPageBtn) {
        prevPageBtn.onclick = () => {
          if (txPageOffset > 0) {
            txPageOffset -= txPageLimit;
            loadTransactions(token);
          }
        };
      }
      const nextPageBtn = document.getElementById("tx-next-page");
      if (nextPageBtn) {
        nextPageBtn.onclick = () => {
          if (txs.length === txPageLimit) {
            txPageOffset += txPageLimit;
            loadTransactions(token);
          }
        };
      }
      // Attach edit/delete handlers
      document
        .querySelectorAll(".transaction-card [data-id]")
        .forEach((btn) => {
          btn.onclick = (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            confirmModal(`Удалить транзакцию #${id}?`, async () => {
              const resp = await apiDeleteTransaction(token, id);
              if (resp.ok) {
                showToast("Транзакция удалена");
                loadTransactions(token); // Reload
              } else {
                showAlert(
                  document.getElementById("transactions-alert"),
                  `Ошибка удаления: ${resp.statusText}`,
                  "danger"
                );
              }
            });
          };
        });
      document
        .querySelectorAll(".transaction-card [data-edit-id]")
        .forEach((btn) => {
          btn.onclick = (e) => {
            const id = e.currentTarget.getAttribute("data-edit-id");
            const tx = txs.find((t) => String(t.id) === id);
            if (tx) {
              showTransactionModal(token, categories, () =>
                loadTransactions(token)
              );
              // Заполнить форму данными транзакции
              document.getElementById("transaction-id").value = tx.id;
              document.getElementById("transaction-amount").value = tx.amount;
              document.getElementById("transaction-date").value =
                tx.date.split("T")[0];
              document.getElementById("transaction-comment").value = tx.comment;
              // Установить категорию и тип
              const cat = catMap[tx.category_id];
              if (cat) {
                document.getElementById("transaction-type").value = cat.type;
                // Обновить список категорий для модалки, если нужно
                updateCategoryOptionsForModal(cat.type, categories);
                document.getElementById("transaction-category").value =
                  tx.category_id;
              }
            }
          };
        });
    }
  } else {
    showAlert(
      alert,
      `Ошибка загрузки транзакций: ${response.statusText}`,
      "danger"
    );
  }
}

function updateCategoryOptionsForModal(type, categories) {
  const categorySelect = document.getElementById("transaction-category");
  if (!categorySelect) return;
  const currentVal = categorySelect.value;
  categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
  categories
    .filter((c) => c.type === type)
    .forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      categorySelect.appendChild(opt);
    });
  // Попытаться восстановить значение, если оно из нового списка
  if (categories.some((c) => c.id == currentVal && c.type === type)) {
    categorySelect.value = currentVal;
  }
}

export function showTransactionModal(
  token,
  categories,
  onSave,
  transactionToEdit = null
) {
  const modal = new bootstrap.Modal(
    document.getElementById("transaction-modal")
  );
  const form = document.getElementById("transaction-form");
  const typeSelect = document.getElementById("transaction-type");
  const categorySelect = document.getElementById("transaction-category");
  const amountInput = document.getElementById("transaction-amount");
  const dateInput = document.getElementById("transaction-date");
  const commentInput = document.getElementById("transaction-comment");
  const modalTitle = document.getElementById("transactionModalLabel");
  const transactionIdInput = document.getElementById("transaction-id");

  // Set date to today by default for new transactions
  if (!transactionToEdit) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
  }

  // Populate categories based on selected type
  updateCategoryOptionsForModal(typeSelect.value, categories);

  // Event listener for type change to update category options
  typeSelect.onchange = () => {
    updateCategoryOptionsForModal(typeSelect.value, categories);
  };

  form.reset();
  document.getElementById("transaction-id").value = "";
  typeSelect.value = txFilters.type; // Default to current tab's type
  updateCategoryOptionsForModal(typeSelect.value, categories);

  if (transactionToEdit) {
    modalTitle.textContent = "Редактировать транзакцию";
    transactionIdInput.value = transactionToEdit.id;
    typeSelect.value =
      transactionToEdit.type ||
      (transactionToEdit.category && transactionToEdit.category.type) ||
      "expense"; // Default to 'expense' if type is not directly on transaction
    amountInput.value = Math.abs(transactionToEdit.amount); // Amount is always positive in form
    dateInput.value = transactionToEdit.date.split("T")[0];
    commentInput.value = transactionToEdit.comment || "";
    // Trigger change on typeSelect to populate categories correctly and select the category
    typeSelect.dispatchEvent(new Event("change"));
    categorySelect.value = transactionToEdit.category_id;
  } else {
    modalTitle.textContent = "Новая транзакция";
    transactionIdInput.value = "";
    form.reset(); // Reset form for new transaction
    const today = new Date().toISOString().split("T")[0]; // Also set date again after reset
    dateInput.value = today;
    typeSelect.dispatchEvent(new Event("change")); // Populate categories for default type
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById("transaction-id").value;
    const amount = parseFloat(
      document.getElementById("transaction-amount").value
    );
    const date = document.getElementById("transaction-date").value;
    const category_id = parseInt(
      document.getElementById("transaction-category").value
    );
    const comment = document.getElementById("transaction-comment").value.trim();
    const currency = getCurrency();

    if (!category_id) {
      alert("Пожалуйста, выберите категорию.");
      return;
    }
    if (isNaN(amount) || amount === 0) {
      alert("Пожалуйста, введите корректную сумму.");
      return;
    }
    if (!date) {
      alert("Пожалуйста, выберите дату.");
      return;
    }

    const transactionData = {
      amount,
      date,
      category_id,
      comment,
      currency,
    };

    try {
      const response = await apiCreateTransaction(token, transactionData, id);
      if (response.ok) {
        showToast(id ? "Транзакция обновлена" : "Транзакция добавлена");
        modal.hide();
        if (onSave) onSave();
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.detail || response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to save transaction:", error);
      alert("Произошла ошибка при сохранении транзакции.");
    }
  };
  modal.show();
}

// Initial load is handled by main.js calling renderTransactions via tab setup
