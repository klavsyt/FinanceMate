// tableUtils.js
// Универсальные функции для фильтрации и сортировки таблиц

/**
 * Фильтрует массив по набору правил
 * @param {Array} arr - исходный массив
 * @param {Array} rules - массив функций-предикатов (item) => true/false
 * @returns {Array}
 */
export function applyFilters(arr, rules = []) {
  return rules.reduce((res, rule) => res.filter(rule), arr);
}

/**
 * Сортирует массив по ключу и направлению
 * @param {Array} arr - исходный массив
 * @param {string} key - поле для сортировки
 * @param {string} direction - 'asc' | 'desc'
 * @param {Function} [primer] - функция преобразования значения
 * @returns {Array}
 */
export function sortBy(arr, key, direction = "asc", primer) {
  const dir = direction === "desc" ? -1 : 1;
  return arr.slice().sort((a, b) => {
    let vA = primer ? primer(a[key]) : a[key];
    let vB = primer ? primer(b[key]) : b[key];
    if (vA < vB) return -1 * dir;
    if (vA > vB) return 1 * dir;
    return 0;
  });
}
