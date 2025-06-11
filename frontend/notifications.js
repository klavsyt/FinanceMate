// notifications.js
import { apiGetNotifications } from "./api.js";

export async function renderNotifications(token) {
  const view = document.getElementById("notifications-view");
  view.innerHTML = `<div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0"><i class="bi bi-bell"></i> Уведомления</h4>
  </div>
  <div id="notifications-list"></div>`;
  loadNotifications(token);
}

function formatDateTime(dt) {
  // dt: "2025-06-10T13:45:12.123456"
  if (!dt) return "";
  const [date, time] = dt.split("T");
  return `${date} ${time ? time.slice(0, 5) : ""}`;
}

async function loadNotifications(token) {
  const list = document.getElementById("notifications-list");
  list.innerHTML =
    '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>';
  const response = await apiGetNotifications(token);
  if (response.ok) {
    const notifs = await response.json();
    if (notifs.length === 0) {
      list.innerHTML =
        '<div class="alert alert-info text-center py-4"><i class="bi bi-emoji-smile fs-2"></i><br>Уведомлений нет</div>';
    } else {
      list.innerHTML =
        '<div class="notification-cards-list">' +
        notifs
          .map((n, i) => {
            const icon = n.is_read ? "bi-envelope-open" : "bi-bell-fill";
            const cardClass = `notification-card fade-in-row ${
              n.is_read ? "read" : "unread"
            }`;
            return `<div class="${cardClass}" style="animation-delay:${
              i * 0.04
            }s">
                <div class="notif-icon"><i class="bi ${icon}"></i></div>
                <div class="notif-info">
                  <div class="notif-date">${formatDateTime(n.created_at)}</div>
                  <div class="notif-message">${formatNotificationMessage(
                    n.message
                  )}</div>
                </div>
                <div class="notif-status">${
                  n.is_read
                    ? "<span class='badge bg-success'>Прочитано</span>"
                    : "<span class='badge bg-warning text-dark'>Новое</span>"
                }</div>
              </div>`;
          })
          .join("") +
        "</div>";
    }
  } else {
    list.innerHTML =
      '<div class="alert alert-danger text-center py-4">Ошибка загрузки уведомлений</div>';
  }
}

function formatNotificationMessage(message) {
  // Здесь можно реализовать реальную конвертацию, если есть API/логика
  // Пока просто возвращаем сообщение без изменений
  return message;
}
