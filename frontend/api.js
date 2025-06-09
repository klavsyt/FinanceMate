// api.js
// Все функции для работы с backend API

const API_BASE = "http://localhost:8000";

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

export async function apiRegister(email, username, password) {
  const response = await fetch(API_BASE + "/api/v1/user/register/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  return response;
}

export async function apiGetBudgets(token, { limit = 20, offset = 0 } = {}) {
  const url = new URL(API_BASE + "/api/v1/budget/budgets/");
  url.searchParams.set("limit", limit);
  url.searchParams.set("offset", offset);
  return fetch(url, {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiCreateBudget(token, data) {
  return fetch(API_BASE + "/api/v1/budget/budgets/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(data),
  });
}

export async function apiDeleteBudget(token, id) {
  return fetch(API_BASE + `/api/v1/budget/budgets/${id}/`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiGetTransactions(
  token,
  { limit = 20, offset = 0 } = {}
) {
  const url = new URL(API_BASE + "/api/v1/transaction/transactions/");
  url.searchParams.set("limit", limit);
  url.searchParams.set("offset", offset);
  return fetch(url, {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiCreateTransaction(token, data) {
  return fetch(API_BASE + "/api/v1/transaction/transactions/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(data),
  });
}

export async function apiDeleteTransaction(token, id) {
  return fetch(API_BASE + `/api/v1/transaction/transactions/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiGetCategories(token, { limit = 20, offset = 0 } = {}) {
  const url = new URL(API_BASE + "/api/v1/category/categories/");
  url.searchParams.set("limit", limit);
  url.searchParams.set("offset", offset);
  return fetch(url, {
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiCreateCategory(token, data) {
  return fetch(API_BASE + "/api/v1/category/categories/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(data),
  });
}

export async function apiDeleteCategory(token, id) {
  return fetch(API_BASE + `/api/v1/category/categories/${id}/`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
}

export async function apiGetNotifications(token) {
  return fetch(API_BASE + "/api/v1/notification/notifications/", {
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

export async function apiGetMonthlySummary(token, year, base_currency = "RUB") {
  let url = API_BASE + `/api/v1/report/monthly-summary/?year=${year}`;
  if (base_currency) url += `&base_currency=${base_currency}`;
  return fetch(url, {
    headers: { Authorization: "Bearer " + token },
  });
}
