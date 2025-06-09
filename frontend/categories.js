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

export async function renderCategories(token) {
  console.log("renderCategories вызвана");
  const view = document.getElementById("categories-view");
  view.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <div class="d-flex gap-2 flex-wrap">
        <select class="form-select" id="category-filter-type" style="min-width:120px;">
          <option value="">Все типы</option>
          <option value="expense">Расход</option>
          <option value="income">Доход</option>
        </select>
        <input class="form-control" id="category-filter-search" placeholder="Поиск по названию..." style="min-width:180px;">
        <select class="form-select" id="category-sort" style="min-width:140px;">
          <option value="name_asc">Название A→Я</option>
          <option value="name_desc">Название Я→A</option>
          <option value="id_asc">ID ↑</option>
          <option value="id_desc">ID ↓</option>
        </select>
      </div>
      <button class="btn btn-success" id="add-category-btn"><i class="bi bi-plus"></i> Добавить</button>
    </div>
    <div id="categories-alert"></div>
    <div id="categories-table"></div>`;
  // Восстановить значения фильтров
  document.getElementById("category-filter-type").value = categoryFilters.type;
  document.getElementById("category-filter-search").value =
    categoryFilters.search;
  document.getElementById("category-sort").value = categoryFilters.sort;
  // Навесить обработчики
  document.getElementById("category-filter-type").onchange = (e) => {
    categoryFilters.type = e.target.value;
    categoryPageOffset = 0;
    loadCategories(token);
  };
  document.getElementById("category-filter-search").oninput = (e) => {
    categoryFilters.search = e.target.value;
    categoryPageOffset = 0;
    loadCategories(token);
  };
  document.getElementById("category-sort").onchange = (e) => {
    categoryFilters.sort = e.target.value;
    loadCategories(token);
  };
  document.getElementById("add-category-btn").onclick = () =>
    showCategoryModal(token);
  loadCategories(token);
}

async function loadCategories(token) {
  const table = document.getElementById("categories-table");
  const alert = document.getElementById("categories-alert");
  table.innerHTML = "Загрузка...";
  clearAlert(alert);
  const response = await apiGetCategories(token, {
    limit: categoryPageLimit,
    offset: categoryPageOffset,
  });
  if (response.ok) {
    let categories = await response.json();
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
      table.innerHTML = `<div class="table-responsive"><table class="table table-hover align-middle">
        <thead><tr><th>Название</th><th>Тип</th><th>Родитель</th><th></th></tr></thead><tbody>
        ${categories
          .map(
            (c) =>
              `<tr class="fade-in-row"><td>${c.name}</td><td>${
                c.type
              }</td><td>${
                c.parent_id ?? ""
              }</td><td><button class='btn btn-sm btn-primary' data-edit-id='${
                c.id
              }'><i class="bi bi-pencil"></i> Редактировать</button> <button class='btn btn-sm btn-danger' data-id='${
                c.id
              }'><i class="bi bi-trash"></i> Удалить</button></td></tr>`
          )
          .join("")}
        </tbody></table></div>`;
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
              if (resp.ok) loadCategories(token);
              else {
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
          const cat = categories.find((c) => c.id === catId);
          if (cat) await showEditCategoryModal(token, cat);
        };
      });
    }
  } else {
    table.innerHTML = "";
    showAlert(alert, "Ошибка загрузки категорий");
  }
}

function showCategoryModal(token) {
  (async () => {
    // Получаем список категорий для выпадающего списка родителя
    const categoriesResp = await apiGetCategories(token);
    let categories = [];
    if (categoriesResp.ok) categories = await categoriesResp.json();
    const parentOptions = ['<option value="">Нет</option>']
      .concat(
        categories.map((c) => `<option value="${c.id}">${c.name}</option>`)
      )
      .join("");
    const modalHtml = `
      <div class="modal fade" id="categoryModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Добавить категорию</h5>
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
                  <label class="form-label">Родительская категория (необязательно)</label>
                  <select class="form-select" name="parent_id">
                    ${parentOptions}
                  </select>
                </div>
                <div id="category-modal-alert"></div>
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
    const modal = new bootstrap.Modal(document.getElementById("categoryModal"));
    modal.show();
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
      const data = {
        name,
        type,
        parent_id: form.parent_id.value ? Number(form.parent_id.value) : null,
      };
      const resp = await apiCreateCategory(token, data);
      saveBtn.disabled = false;
      saveBtn.innerHTML = origBtnHtml;
      if (resp.ok) {
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
        document.getElementById("categoryModal").remove();
      });
  })();
}

async function showEditCategoryModal(token, category) {
  // Получаем список категорий для выпадающего списка родителя
  const categoriesResp = await apiGetCategories(token);
  let categories = [];
  if (categoriesResp.ok) categories = await categoriesResp.json();
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
                <label class="form-label">Родительская категория (необязательно)</label>
                <select class="form-select" name="parent_id">
                  ${parentOptions}
                </select>
              </div>
              <div id="edit-category-modal-alert"></div>
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
    document.getElementById("editCategoryModal")
  );
  modal.show();
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
    const data = {
      name,
      type,
      parent_id: form.parent_id.value ? Number(form.parent_id.value) : null,
    };
    const resp = await fetch(`/api/v1/category/categories/${category.id}/`, {
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
      document.getElementById("editCategoryModal").remove();
      renderCategories(token);
      showToast("Категория успешно обновлена!", "success");
    } else {
      const err = await resp.json().catch(() => ({}));
      showAlert(alert, "Ошибка: " + (err.detail || ""));
      showToast("Ошибка обновления категории: " + (err.detail || ""), "danger");
    }
  };
  document
    .getElementById("editCategoryModal")
    .addEventListener("hidden.bs.modal", () => {
      document.getElementById("editCategoryModal").remove();
    });
}
