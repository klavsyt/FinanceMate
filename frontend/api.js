// api.js
// Все функции для работы с backend API

// Автоматически определяем API_BASE: если фронт открыт с localhost/127.0.0.1:5500, используем http://localhost:8000, иначе относительный путь
export const API_BASE =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1") &&
  window.location.port === "5500"
    ? "http://localhost:8000"
    : "/api";

export async function apiLogin(username, password) {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);
  const response = await fetch(API_BASE + "/api/v1/user/login/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });
  return response;
}

export async function apiRefreshToken(refresh_token) {
  return fetch(API_BASE + "/api/v1/user/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });
}

export async function apiRegister(email, username, password) {
  const response = await fetch(API_BASE + "/api/v1/user/register/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  return response;
}

export async function apiGetBudgets(token, { limit = 20, offset = 0 } = {}) {
  const url = `${API_BASE}/api/v1/budget/budgets/?limit=${encodeURIComponent(
    limit
  )}&offset=${encodeURIComponent(offset)}`;
  return fetchWithRefresh(url, {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiCreateBudget(token, data) {
  return fetchWithRefresh(API_BASE + "/api/v1/budget/budgets/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(data),
  });
}

export async function apiDeleteBudget(token, id) {
  return fetchWithRefresh(API_BASE + `/api/v1/budget/budgets/${id}/`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiGetTransactions(
  token,
  { limit = 20, offset = 0 } = {}
) {
  const url = `${API_BASE}/api/v1/transaction/transactions/?limit=${encodeURIComponent(
    limit
  )}&offset=${encodeURIComponent(offset)}`;
  return fetchWithRefresh(url, {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiCreateTransaction(token, data) {
  return fetchWithRefresh(API_BASE + "/api/v1/transaction/transactions/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(data),
  });
}

export async function apiDeleteTransaction(token, id) {
  return fetchWithRefresh(API_BASE + `/api/v1/transaction/transactions/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiGetCategories(token, { limit = 20, offset = 0 } = {}) {
  const url = `${API_BASE}/api/v1/category/categories/?limit=${encodeURIComponent(
    limit
  )}&offset=${encodeURIComponent(offset)}`;
  return fetchWithRefresh(url, {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiCreateCategory(token, data) {
  return fetchWithRefresh(API_BASE + "/api/v1/category/categories/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(data),
  });
}

export async function apiDeleteCategory(token, id) {
  return fetchWithRefresh(API_BASE + `/api/v1/category/categories/${id}/`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiGetNotifications(token) {
  return fetchWithRefresh(API_BASE + "/api/v1/notification/notifications/", {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiGetCategorySummary(
  token,
  year,
  month,
  base_currency = "RUB"
) {
  let url = API_BASE + `/api/v1/report/category-summary/?year=${year}`;
  if (month) url += `&month=${month}`;
  if (base_currency) url += `&base_currency=${base_currency}`;
  return fetch(url, {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiGetMonthlySummary(
  token,
  year,
  base_currency = "RUB",
  category_type = null
) {
  let url = API_BASE + `/api/v1/report/monthly-summary/?year=${year}`;
  if (base_currency) url += `&base_currency=${base_currency}`;
  if (category_type) url += `&category_type=${category_type}`;
  return fetch(url, {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiGetProfile(token) {
  return fetchWithRefresh(API_BASE + "/api/v1/user/me/", {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiChangePassword(token, old_password, new_password) {
  return fetchWithRefresh(API_BASE + "/api/v1/user/change-password/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ old_password, new_password }),
  });
}

export async function apiUpdateProfile(token, data) {
  return fetchWithRefresh(API_BASE + "/api/v1/user/me/", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(data),
  });
}

export async function apiEditBudget(token, id, data) {
  return fetchWithRefresh(API_BASE + `/api/v1/budget/budgets/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(data),
  });
}

export async function fetchWithRefresh(url, options = {}) {
  let token = localStorage.getItem("token");
  if (!options.headers) options.headers = {};
  if (token) options.headers["Authorization"] = "Bearer " + token;
  let response = await fetch(url, options);
  if (response.status === 401 && localStorage.getItem("refresh_token")) {
    // Попробовать обновить access_token
    const refreshResp = await apiRefreshToken(
      localStorage.getItem("refresh_token")
    );
    if (refreshResp.ok) {
      const data = await refreshResp.json();
      localStorage.setItem("token", data.access_token);
      // Повторить исходный запрос с новым токеном
      options.headers["Authorization"] = "Bearer " + data.access_token;
      response = await fetch(url, options);
    } else {
      // refresh не сработал — разлогинить
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      window.location.reload();
    }
  }
  // --- Обработка rate limit (429) ---
  if (response.status === 429) {
    let msg = "Слишком много запросов. Попробуйте позже.";
    try {
      const err = await response.json();
      if (err && err.detail) msg = err.detail;
    } catch {}
    import("./ui.js").then((m) => m.showToast(msg, "warning", 5000));
  }
  return response;
}
