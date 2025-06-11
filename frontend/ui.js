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

// --- Профиль пользователя ---
export function showProfileModal(user) {
  const id = "profileModal";
  if (document.getElementById(id)) document.getElementById(id).remove();
  // --- аватарки на выбор ---
  const avatars = [
    "https://api.dicebear.com/7.x/bottts/svg?seed=cat",
    "https://api.dicebear.com/7.x/bottts/svg?seed=fox",
    "https://api.dicebear.com/7.x/bottts/svg?seed=dog",
    "https://api.dicebear.com/7.x/bottts/svg?seed=owl",
    "https://api.dicebear.com/7.x/bottts/svg?seed=alien",
  ];
  let selectedAvatar = user.avatar || avatars[0];
  const avatarHtml = `
    <div class="profile-avatar mb-2">
      <img src="${selectedAvatar}" alt="avatar" style="width:72px;height:72px;border-radius:50%;background:#f8fafc;object-fit:cover;box-shadow:0 2px 8px rgba(13,110,253,0.08);">
    </div>
    <div class="d-flex justify-content-center gap-2 mb-2">
      ${avatars
        .map(
          (url) =>
            `<img src="${url}" class="avatar-choice${
              url === selectedAvatar ? " selected" : ""
            }" style="width:38px;height:38px;border-radius:50%;border:2px solid ${
              url === selectedAvatar ? "#1976d2" : "#eee"
            };background:#f8fafc;object-fit:cover;cursor:pointer;transition:.15s;">`
        )
        .join("")}
    </div>
  `;
  const bodyHtml = `
    <div class="d-flex flex-column align-items-center gap-2 py-2">
      ${avatarHtml}
      <div class="mb-1 w-100 text-center">
        <span class="fw-bold">${user.username || "-"}</span>
        <div class="text-muted" style="font-size:0.98em;">${
          user.email || "-"
        }</div>
      </div>
      <button class="btn btn-outline-primary btn-sm mt-2" id="change-password-btn"><i class="bi bi-key"></i> Сменить пароль</button>
      <button class="btn btn-outline-danger btn-sm mt-2" id="profile-logout-btn"><i class="bi bi-box-arrow-right"></i> Выйти</button>
      <div id="profile-modal-alert" class="w-100 mt-2"></div>
    </div>
  `;
  const footerHtml = `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>`;
  document.body.insertAdjacentHTML(
    "beforeend",
    createModal(id, "Профиль пользователя", bodyHtml, footerHtml)
  );
  const modal = new bootstrap.Modal(document.getElementById(id));
  modal.show();
  // обработка выбора аватарки
  document.querySelectorAll(".avatar-choice").forEach((el) => {
    el.onclick = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Необходима авторизация", "danger");
        return;
      }
      // UI feedback
      document
        .querySelectorAll(".avatar-choice")
        .forEach((e) => e.classList.remove("selected"));
      el.classList.add("selected");
      document.querySelector(".profile-avatar img").src = el.src;
      // Сохраняем на сервере
      try {
        const resp = await import("./api.js").then((m) =>
          m.apiUpdateProfile(token, { avatar: el.src })
        );
        if (resp.ok) {
          localStorage.setItem("financemate_avatar", el.src);
          import("./main.js").then((m) => m.updateProfileBtnAvatar());
          showToast("Аватар обновлён", "success");
        } else {
          const err = await resp.json().catch(() => ({}));
          showToast(err.detail || "Ошибка обновления профиля", "danger");
        }
      } catch (e) {
        showToast("Ошибка сети или сервера", "danger");
      }
    };
  });
  // При открытии — если есть user.avatar, показываем его и сохраняем в localStorage
  if (user.avatar) {
    document.querySelector(".profile-avatar img").src = user.avatar;
    localStorage.setItem("financemate_avatar", user.avatar);
    document.querySelectorAll(".avatar-choice").forEach((el) => {
      el.classList.toggle("selected", el.src === user.avatar);
    });
  } else {
    // если есть сохранённый аватар, показываем его
    const savedAvatar = localStorage.getItem("financemate_avatar");
    if (savedAvatar) {
      document.querySelector(".profile-avatar img").src = savedAvatar;
      document.querySelectorAll(".avatar-choice").forEach((el) => {
        el.classList.toggle("selected", el.src === savedAvatar);
      });
    }
  }
  document.getElementById("change-password-btn").onclick = () => {
    showChangePasswordModal();
  };
  document.getElementById("profile-logout-btn").onclick = () => {
    import("./auth.js").then((m) => m.logout());
    modal.hide();
  };
  document.getElementById(id).addEventListener("hidden.bs.modal", () => {
    document.getElementById(id)?.remove();
  });
}

// --- Модалка смены пароля ---
export function showChangePasswordModal() {
  const id = "changePasswordModal";
  if (document.getElementById(id)) document.getElementById(id).remove();
  const bodyHtml = `
    <form id="change-password-form">
      <div class="mb-3">
        <label class="form-label">Текущий пароль</label>
        <input type="password" class="form-control" name="old_password" required autocomplete="current-password">
      </div>
      <div class="mb-3">
        <label class="form-label">Новый пароль</label>
        <input type="password" class="form-control" name="new_password" required autocomplete="new-password">
      </div>
      <div class="mb-3">
        <label class="form-label">Повторите новый пароль</label>
        <input type="password" class="form-control" name="new_password2" required autocomplete="new-password">
      </div>
      <div id="change-password-alert"></div>
    </form>
  `;
  const footerHtml = `<button type="submit" class="btn btn-success" form="change-password-form">Сменить</button><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>`;
  document.body.insertAdjacentHTML(
    "beforeend",
    createModal(id, "Смена пароля", bodyHtml, footerHtml)
  );
  const modal = new bootstrap.Modal(document.getElementById(id));
  modal.show();
  document.getElementById(id).addEventListener("hidden.bs.modal", () => {
    document.getElementById(id)?.remove();
  });
  document.getElementById("change-password-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const old_password = form.old_password.value.trim();
    const new_password = form.new_password.value.trim();
    const new_password2 = form.new_password2.value.trim();
    const alert = document.getElementById("change-password-alert");
    clearAlert(alert);
    if (!old_password || !new_password || !new_password2) {
      showAlert(alert, "Заполните все поля", "warning");
      return;
    }
    if (new_password !== new_password2) {
      showAlert(alert, "Пароли не совпадают", "warning");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      showAlert(alert, "Необходима авторизация", "danger");
      return;
    }
    try {
      const resp = await import("./api.js").then((m) =>
        m.apiChangePassword(token, old_password, new_password)
      );
      if (resp.ok) {
        showAlert(alert, "Пароль успешно изменён", "success");
        setTimeout(() => {
          const modal = bootstrap.Modal.getInstance(
            document.getElementById(id)
          );
          if (modal) modal.hide();
        }, 1200);
      } else {
        const err = await resp.json().catch(() => ({}));
        showAlert(alert, err.detail || "Ошибка смены пароля", "danger");
      }
    } catch (e) {
      showAlert(alert, "Ошибка сети или сервера", "danger");
    }
  };
}
