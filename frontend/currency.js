// currency.js
// Глобальные функции для работы с валютой

export function getCurrency() {
  return localStorage.getItem("global_currency") || "RUB";
}

export function setCurrency(currency) {
  localStorage.setItem("global_currency", currency);
}
