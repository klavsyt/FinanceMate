// ui.js
// UI-утилиты и функции для отображения элементов, алертов, модалок

export function showAlert(container, message, type = "danger") {
  const icon = {
    success: "bi-check-circle",
    danger: "bi-x-circle",
    info: "bi-info-circle",
    warning: "bi-exclamation-triangle",
  }[type];
  container.innerHTML = `<div class="alert alert-${type} mt-2" role="alert">
    <i class="bi ${icon}"></i> ${message}
  </div>`;
}

export function clearAlert(container) {
  container.innerHTML = "";
}

export function createModal(id, title, bodyHtml, footerHtml = "") {
  return `
    <div class="modal fade" id="${id}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">${bodyHtml}</div>
          <div class="modal-footer">${footerHtml}</div>
        </div>
      </div>
    </div>
  `;
}

export function showModal(id) {
  const modal = new bootstrap.Modal(document.getElementById(id));
  modal.show();
}

export function hideModal(id) {
  const modal = bootstrap.Modal.getInstance(document.getElementById(id));
  if (modal) modal.hide();
}

export function confirmModal({
  title = "Подтвердите действие",
  body = "",
  onConfirm,
}) {
  const id = "confirmModal";
  if (document.getElementById(id)) document.getElementById(id).remove();
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="modal fade" id="${id}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">${body}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
            <button type="button" class="btn btn-danger" id="confirm-ok-btn">ОК</button>
          </div>
        </div>
      </div>
    </div>`
  );
  const modal = new bootstrap.Modal(document.getElementById(id));
  modal.show();
  document.getElementById("confirm-ok-btn").onclick = () => {
    modal.hide();
    document.getElementById(id).remove();
    if (onConfirm) onConfirm();
  };
  document.getElementById(id).addEventListener("hidden.bs.modal", () => {
    if (document.getElementById(id)) document.getElementById(id).remove();
  });
}

export function showToast(message, type = "success", timeout = 3500) {
  // type: success, danger, info, warning
  const icon = {
    success: "bi-check-circle",
    danger: "bi-x-circle",
    info: "bi-info-circle",
    warning: "bi-exclamation-triangle",
  }[type];
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.style.position = "fixed";
    toastContainer.style.top = "20px";
    toastContainer.style.right = "20px";
    toastContainer.style.zIndex = 9999;
    document.body.appendChild(toastContainer);
  }
  const id = `toast-${Date.now()}-${Math.random()}`;
  const toastHtml = `
    <div id="${id}" class="toast align-items-center text-bg-${type} border-0 show mb-2" role="alert" aria-live="assertive" aria-atomic="true" style="min-width:220px;">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi ${icon}"></i> ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;
  toastContainer.insertAdjacentHTML("beforeend", toastHtml);
  const toastEl = document.getElementById(id);
  const bsToast = new bootstrap.Toast(toastEl, { delay: timeout });
  bsToast.show();
  setTimeout(() => {
    toastEl && toastEl.remove();
  }, timeout + 500);
}

export function showNetworkError(error) {
  let msg = "Ошибка сети или сервера. Попробуйте позже.";
  if (typeof error === "string") msg = error;
  showToast(msg, "danger", 5000);
}

export function showEmptyState(container, icon, text) {
  container.innerHTML = `<div class="alert alert-info text-center py-4">
    <i class="bi ${icon} fs-2"></i><br>${text}
  </div>`;
}
