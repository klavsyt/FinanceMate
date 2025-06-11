// categories.js
import {
  apiGetCategories,
  apiCreateCategory,
  apiDeleteCategory,
} from "./api.js";
import { showAlert, clearAlert, confirmModal, showToast } from "./ui.js";
import { applyFilters, sortBy } from "./tableUtils.js";

let categoryPageOffset = 0;
const categoryPageLimit = 20;
let categoryFilters = {
  type: "",
  search: "",
  sort: "name_asc",
};
// Вместо let cachedCategories = null;
// Используем window.FinanceMateCategoriesCache

async function getCachedCategories(token) {
  if (!window.FinanceMateCategoriesCache) {
    const response = await apiGetCategories(token, { limit: 1000, offset: 0 });
    if (response.ok) {
      window.FinanceMateCategoriesCache = await response.json();
    } else {
      window.FinanceMateCategoriesCache = [];
    }
  }
  return window.FinanceMateCategoriesCache;
}

function setupFabAddCategoryHandler(token) {
  const fabBtn = document.getElementById("fab-add-category");
  if (fabBtn) {
    fabBtn.onclick = () => showCategoryModal(token);
  }
}

export async function renderCategories(token) {
  const view = document.getElementById("categories-view");
  // --- Вкладки типа ---
  let typeTabsHtml = `<div id="category-type-tabs-bar" class="mb-2 d-flex justify-content-center">
    <ul class="nav nav-pills" id="category-type-tabs" style="width:100%;max-width:340px;">
      <li class="nav-item flex-fill text-center"><a class="nav-link${
        categoryFilters.type === "expense" ? " active" : ""
      }" href="#" data-type="expense" style="width:100%">Расходы</a></li>
      <li class="nav-item flex-fill text-center"><a class="nav-link${
        categoryFilters.type === "income" ? " active" : ""
      }" href="#" data-type="income" style="width:100%">Доходы</a></li>
    </ul>
  </div>`;
  view.innerHTML = `
    ${typeTabsHtml}
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <div class="d-flex gap-2 flex-wrap">
        <select class="form-select" id="category-sort" style="min-width:140px;">
          <option value="name_asc">Название A→Я</option>
          <option value="name_desc">Название Я→A</option>
        </select>
      </div>
      <button class="btn btn-success d-none d-sm-inline" id="add-category-btn"><i class="bi bi-plus"></i> Новая категория</button>
    </div>
    <div id="categories-alert"></div>
    <div id="categories-table"></div>
    <button class="fab-add d-sm-none" id="fab-add-category" title="Новая категория"><i class="bi bi-plus"></i></button>`;
  // Восстановить значения фильтров
  document.getElementById("category-sort").value = categoryFilters.sort;
  // Навесить обработчики
  document.getElementById("category-sort").onchange = (e) => {
    categoryFilters.sort = e.target.value;
    loadCategories(token);
  };
  document.getElementById("add-category-btn").onclick = () =>
    showCategoryModal(token);
  setupFabAddCategoryHandler(token);
  // Вкладки типа — обработчик один раз
  document.querySelectorAll("#category-type-tabs .nav-link").forEach((el) => {
    el.onclick = (e) => {
      e.preventDefault();
      const newType = el.getAttribute("data-type");
      if (categoryFilters.type !== newType) {
        categoryFilters.type = newType;
        // Обновить активную вкладку
        document
          .querySelectorAll("#category-type-tabs .nav-link")
          .forEach((tab) => {
            tab.classList.toggle(
              "active",
              tab.getAttribute("data-type") === newType
            );
          });
        categoryPageOffset = 0;
        loadCategories(token);
      }
    };
  });
  loadCategories(token);
}

async function loadCategories(token) {
  const table = document.getElementById("categories-table");
  const alert = document.getElementById("categories-alert");
  table.innerHTML = "Загрузка...";
  clearAlert(alert);
  let categories = [];
  categories = await getCachedCategories(token);
  // --- Фильтрация и поиск ---
  const filters = [];
  if (categoryFilters.type)
    filters.push((c) => c.type === categoryFilters.type);
  if (categoryFilters.search)
    filters.push((c) =>
      (c.name || "")
        .toLowerCase()
        .includes(categoryFilters.search.toLowerCase())
    );
  categories = applyFilters(categories, filters);
  // --- Сортировка ---
  if (categoryFilters.sort === "name_asc")
    categories = sortBy(categories, "name", "asc");
  if (categoryFilters.sort === "name_desc")
    categories = sortBy(categories, "name", "desc");
  if (categoryFilters.sort === "id_asc")
    categories = sortBy(categories, "id", "asc");
  if (categoryFilters.sort === "id_desc")
    categories = sortBy(categories, "id", "desc");
  if (categories.length === 0 && categoryPageOffset > 0) {
    categoryPageOffset = Math.max(0, categoryPageOffset - categoryPageLimit);
    return loadCategories(token);
  }
  if (categories.length === 0) {
    table.innerHTML =
      '<div class="alert alert-info text-center py-4"><i class="bi bi-emoji-frown fs-2"></i><br>Категории не найдены. Добавьте первую!</div>';
  } else {
    // --- Современный мобильный UI: карточки категорий ---
    table.innerHTML =
      '<div class="category-cards-list">' +
      categories
        .map(
          (c, i) =>
            `<div class="category-card fade-in-row" style="background:${
              c.color
            }22;animation-delay:${i * 0.04}s">
              <div class="cat-icon" style="background:${
                c.color
              };"><i class="bi ${c.icon || "bi-tag"}"></i></div>
              <div class="cat-info">
                <div class="cat-name">${c.name}</div>
                <div class="cat-type" style="font-size:0.98em;opacity:0.7;">$${
                  c.type === "expense"
                    ? "Расход"
                    : c.type === "income"
                    ? "Доход"
                    : c.type
                }</div>
              </div>
              <div class="d-flex flex-column align-items-end gap-1">
                <button class='btn btn-sm btn-primary mb-1' data-edit-id='${
                  c.id
                }'><i class="bi bi-pencil"></i></button>
                <button class='btn btn-sm btn-danger' data-id='${
                  c.id
                }'><i class="bi bi-trash"></i></button>
              </div>
            </div>`
        )
        .join("") +
      "</div>";
    // Пагинация
    table.innerHTML += `<div class="d-flex justify-content-between align-items-center mt-3">
      <button class="btn btn-outline-secondary" id="category-prev-page" ${
        categoryPageOffset === 0 ? "disabled" : ""
      }>Назад</button>
      <button class="btn btn-outline-secondary" id="category-next-page" ${
        categories.length < categoryPageLimit ? "disabled" : ""
      }>Вперёд</button>
    </div>`;
    document.getElementById("category-prev-page").onclick = () => {
      if (categoryPageOffset > 0) {
        categoryPageOffset -= categoryPageLimit;
        loadCategories(token);
      }
    };
    document.getElementById("category-next-page").onclick = () => {
      if (categories.length === categoryPageLimit) {
        categoryPageOffset += categoryPageLimit;
        loadCategories(token);
      }
    };
    table.querySelectorAll(".btn-danger").forEach((btn) => {
      btn.onclick = async () => {
        confirmModal({
          title: "Удалить категорию?",
          body: "Вы уверены, что хотите удалить эту категорию?",
          onConfirm: async () => {
            const resp = await apiDeleteCategory(token, btn.dataset.id);
            if (resp.ok) {
              window.FinanceMateCategoriesCache = null;
              loadCategories(token);
            } else {
              showAlert(alert, "Ошибка удаления");
              showToast("Ошибка удаления категории", "danger");
            }
          },
        });
      };
    });
    table.querySelectorAll(".btn-primary").forEach((btn) => {
      btn.onclick = async () => {
        const catId = Number(btn.getAttribute("data-edit-id"));
        const cat = (window.FinanceMateCategoriesCache || []).find(
          (c) => c.id === catId
        );
        if (cat) await showEditCategoryModal(token, cat);
      };
    });
  }
}

function getIconGrid(selectedIcon = "bi-tag") {
  const icons = [
    "bi-tag",
    "bi-cart3",
    "bi-cash-coin",
    "bi-house",
    "bi-egg-fried",
    "bi-basket",
    "bi-bag",
    "bi-briefcase",
    "bi-car-front",
    "bi-credit-card",
    "bi-gift",
    "bi-heart",
    "bi-lightning",
    "bi-mortarboard",
    "bi-music-note",
    "bi-piggy-bank",
    "bi-umbrella",
    "bi-people",
    "bi-gear",
    "bi-globe",
    "bi-rocket",
  ];
  return (
    `<div class="icon-grid" style="display:flex;flex-wrap:wrap;gap:10px;">` +
    icons
      .map(
        (icon) =>
          `<div class="icon-choice${
            icon === selectedIcon ? " selected" : ""
          }" data-icon="${icon}" style="cursor:pointer;display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;border:2px solid ${
            icon === selectedIcon ? "#1976d2" : "#eee"
          };background:#f8f9fa;font-size:1.5em;transition:.15s;">
        <i class="bi ${icon}"></i>
      </div>`
      )
      .join("") +
    `</div>`
  );
}

function getColorPalette(selectedColor = "#4e79a7") {
  const colors = [
    "#4e79a7",
    "#f28e2b",
    "#e15759",
    "#76b7b2",
    "#59a14f",
    "#edc949",
    "#af7aa1",
    "#ff9da7",
    "#9c755f",
    "#bab0ab",
  ];
  return (
    `<div class="color-palette" style="display:flex;gap:10px;flex-wrap:wrap;">` +
    colors
      .map(
        (color) =>
          `<div class="color-choice${
            color === selectedColor ? " selected" : ""
          }" data-color="${color}" style="width:32px;height:32px;border-radius:50%;background:${color};border:2px solid ${
            color === selectedColor ? "#1976d2" : "#eee"
          };cursor:pointer;transition:.15s;"></div>`
      )
      .join("") +
    `</div>`
  );
}

function showCategoryModal(token) {
  (async () => {
    // Получаем список категорий для выпадающего списка родителя
    let categories = [];
    categories = await getCachedCategories(token);
    const parentOptions = ['<option value="">Нет</option>']
      .concat(
        categories.map((c) => `<option value="${c.id}">${c.name}</option>`)
      )
      .join("");
    let selectedIcon = "bi-tag";
    let selectedColor = "#4e79a7";
    const modalHtml = `
      <div class="modal fade" id="categoryModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Новая категория</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="category-form">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Название</label>
                  <input type="text" class="form-control" name="name" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Тип</label>
                  <select class="form-select" name="type" required>
                    <option value="expense">Расход</option>
                    <option value="income">Доход</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Иконка</label>
                  <div id="icon-grid">${getIconGrid(selectedIcon)}</div>
                  <input type="hidden" name="icon" value="${selectedIcon}">
                </div>
                <div class="mb-3">
                  <label class="form-label">Цвет</label>
                  <div id="color-palette">${getColorPalette(
                    selectedColor
                  )}</div>
                  <input type="hidden" name="color" value="${selectedColor}">
                </div>
                <div id="category-modal-alert"></div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-success">Сохранить категорию</button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = new bootstrap.Modal(document.getElementById("categoryModal"));
    modal.show();
    // --- Выбор иконки ---
    let selectedIconCurrent = selectedIcon;
    function setIconHandlers() {
      document.querySelectorAll("#icon-grid .icon-choice").forEach((el) => {
        el.onclick = () => {
          selectedIconCurrent = el.dataset.icon;
          document.querySelector("#categoryModal input[name='icon']").value =
            selectedIconCurrent;
          document.getElementById("icon-grid").innerHTML =
            getIconGrid(selectedIconCurrent);
          setIconHandlers();
        };
      });
    }
    setIconHandlers();
    // --- Выбор цвета ---
    let selectedColorCurrent = selectedColor;
    function setColorHandlers() {
      document
        .querySelectorAll("#color-palette .color-choice")
        .forEach((el) => {
          el.onclick = () => {
            selectedColorCurrent = el.dataset.color;
            document.querySelector("#categoryModal input[name='color']").value =
              selectedColorCurrent;
            document.getElementById("color-palette").innerHTML =
              getColorPalette(selectedColorCurrent);
            setColorHandlers();
          };
        });
    }
    setColorHandlers();
    document.getElementById("category-form").onsubmit = async (e) => {
      e.preventDefault();
      const form = e.target;
      const alert = document.getElementById("category-modal-alert");
      clearAlert(alert);
      // Клиентская валидация
      const name = form.name.value.trim();
      const type = form.type.value;
      let error = "";
      if (!name) error = "Введите название категории";
      else if (!type) error = "Выберите тип";
      if (error) {
        showAlert(alert, error, "warning");
        return;
      }
      const saveBtn = form.querySelector("button[type='submit']");
      const origBtnHtml = saveBtn.innerHTML;
      saveBtn.disabled = true;
      saveBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Сохранение...';
      const icon = form.icon.value;
      const color = form.color.value;
      const data = {
        name,
        type,
        icon,
        color,
        parent_id: null, // всегда отправлять parent_id (null если нет)
      };
      if (form.parent_id) {
        data.parent_id = form.parent_id.value
          ? Number(form.parent_id.value)
          : null;
      }
      const resp = await apiCreateCategory(token, data);
      saveBtn.disabled = false;
      saveBtn.innerHTML = origBtnHtml;
      if (resp.ok) {
        window.FinanceMateCategoriesCache = null;
        modal.hide();
        document.getElementById("categoryModal").remove();
        renderCategories(token);
        showToast("Категория успешно создана!", "success");
      } else {
        const err = await resp.json().catch(() => ({}));
        showAlert(alert, "Ошибка: " + (err.detail || ""));
        showToast("Ошибка создания категории: " + (err.detail || ""), "danger");
      }
    };
    document
      .getElementById("categoryModal")
      .addEventListener("hidden.bs.modal", () => {
        const modalEl = document.getElementById("categoryModal");
        if (modalEl) modalEl.remove();
      });
  })();
}

async function showEditCategoryModal(token, category) {
  // Получаем список категорий для выпадающего списка родителя
  let categories = [];
  categories = await getCachedCategories(token);
  // Исключаем саму редактируемую категорию из списка родителей
  categories = categories.filter((c) => c.id !== category.id);
  const parentOptions = ['<option value="">Нет</option>']
    .concat(
      categories.map(
        (c) =>
          `<option value="${c.id}"${
            c.id === category.parent_id ? " selected" : ""
          }>${c.name}</option>`
      )
    )
    .join("");
  let selectedIcon = category.icon || "bi-tag";
  let selectedColor = category.color || "#4e79a7";
  const modalHtml = `
    <div class="modal fade" id="editCategoryModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Редактировать категорию</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="edit-category-form">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Название</label>
                <input type="text" class="form-control" name="name" value="${
                  category.name
                }" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Тип</label>
                <select class="form-select" name="type" required>
                  <option value="expense"${
                    category.type === "expense" ? " selected" : ""
                  }>Расход</option>
                  <option value="income"${
                    category.type === "income" ? " selected" : ""
                  }>Доход</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Иконка</label>
                <div id="icon-grid-edit">${getIconGrid(selectedIcon)}</div>
                <input type="hidden" name="icon" value="${selectedIcon}">
              </div>
              <div class="mb-3">
                <label class="form-label">Цвет</label>
                <div id="color-palette-edit">${getColorPalette(
                  selectedColor
                )}</div>
                <input type="hidden" name="color" value="${selectedColor}">
              </div>
              <div id="edit-category-modal-alert"></div>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-success">Сохранить категорию</button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const modal = new bootstrap.Modal(
    document.getElementById("editCategoryModal")
  );
  modal.show();
  // --- Выбор иконки ---
  let selectedIconCurrent = selectedIcon;
  let selectedColorCurrent = selectedColor;
  function setIconHandlersEdit() {
    document.querySelectorAll("#icon-grid-edit .icon-choice").forEach((el) => {
      el.onclick = () => {
        selectedIconCurrent = el.dataset.icon;
        document.querySelector("#editCategoryModal input[name='icon']").value =
          selectedIconCurrent;
        document.getElementById("icon-grid-edit").innerHTML =
          getIconGrid(selectedIconCurrent);
        setIconHandlersEdit();
      };
    });
  }
  function setColorHandlersEdit() {
    document
      .querySelectorAll("#color-palette-edit .color-choice")
      .forEach((el) => {
        el.onclick = () => {
          selectedColorCurrent = el.dataset.color;
          document.querySelector(
            "#editCategoryModal input[name='color']"
          ).value = selectedColorCurrent;
          document.getElementById("color-palette-edit").innerHTML =
            getColorPalette(selectedColorCurrent);
          setColorHandlersEdit();
        };
      });
  }
  setIconHandlersEdit();
  setColorHandlersEdit();
  document.getElementById("edit-category-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const alert = document.getElementById("edit-category-modal-alert");
    clearAlert(alert);
    // Клиентская валидация
    const name = form.name.value.trim();
    const type = form.type.value;
    let error = "";
    if (!name) error = "Введите название категории";
    else if (!type) error = "Выберите тип";
    if (error) {
      showAlert(alert, error, "warning");
      return;
    }
    const saveBtn = form.querySelector("button[type='submit']");
    const origBtnHtml = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Сохранение...';
    const icon = form.icon.value;
    const color = form.color.value;
    const data = {
      name: form.name.value.trim(),
      type: form.type.value,
      icon,
      color,
    };
    // Используем fetchWithRefresh и API_BASE для PUT-запроса
    const resp = await import("./api.js").then((m) =>
      m.fetchWithRefresh(
        m.API_BASE + `/api/v1/category/categories/${category.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify(data),
        }
      )
    );
    saveBtn.disabled = false;
    saveBtn.innerHTML = origBtnHtml;
    if (resp.ok) {
      window.FinanceMateCategoriesCache = null;
      modal.hide();
      const modalEl = document.getElementById("editCategoryModal");
      if (modalEl) modalEl.remove();
      renderCategories(token);
      showToast("Категория успешно обновлена!", "success");
    } else {
      const err = await resp.json().catch(() => ({}));
      showAlert(alert, "Ошибка: " + (err.detail || ""));
      showToast("Ошибка обновления категории: " + (err.detail || ""), "danger");
    }
  };
  // Безопасно навешиваем обработчик закрытия модалки
  const modalEl = document.getElementById("editCategoryModal");
  if (modalEl) {
    modalEl.addEventListener("hidden.bs.modal", () => {
      const el = document.getElementById("editCategoryModal");
      if (el) el.remove();
    });
  }
}
