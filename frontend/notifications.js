// notifications.js
import { apiGetNotifications } from "./api.js";

export async function renderNotifications(token) {
  const view = document.getElementById("notifications-view");
  view.innerHTML = `<div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0"><i class="bi bi-bell"></i> Уведомления</h4>
  </div>
  <div id="notifications-table"></div>`;
  loadNotifications(token);
}

async function loadNotifications(token) {
  const table = document.getElementById("notifications-table");
  table.innerHTML = "Загрузка...";
  const response = await apiGetNotifications(token);
  if (response.ok) {
    const notifs = await response.json();
    if (notifs.length === 0) {
      table.innerHTML = '<div class="alert alert-info">Уведомлений нет.</div>';
    } else {
      table.innerHTML = `<div class="table-responsive"><table class="table table-hover align-middle">
        <thead><tr><th>Дата</th><th>Сообщение</th><th>Прочитано</th></tr></thead><tbody>
        ${notifs
          .map(
            (n) =>
              `<tr><td>${
                n.created_at.split("T")[0]
              }</td><td>${formatNotificationMessage(n.message)}</td><td>${
                n.is_read ? "Да" : "Нет"
              }</td></tr>`
          )
          .join("")}
        </tbody></table></div>`;
    }
  } else {
    table.innerHTML =
      '<div class="alert alert-danger">Ошибка загрузки уведомлений</div>';
  }
}

function formatNotificationMessage(message) {
  // Здесь можно реализовать реальную конвертацию, если есть API/логика
  // Пока просто возвращаем сообщение без изменений
  return message;
}
