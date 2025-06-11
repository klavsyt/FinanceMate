// chart-utils.js
// Утилиты для работы с Chart.js и генерации цветов для категорий

// Генерация ярких цветов для категорий
export function getCategoryColor(index) {
  // 12 ярких цветов (можно расширить)
  const palette = [
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
    "#6f4e7c",
    "#f1ce63",
  ];
  return palette[index % palette.length];
}

// Получить массив цветов для N категорий
export function getCategoryColors(count) {
  return Array.from({ length: count }, (_, i) => getCategoryColor(i));
}

// Получить иконку Bootstrap для типа категории (расход/доход)
export function getCategoryIcon(type) {
  if (type === "expense") return "bi bi-cart3";
  if (type === "income") return "bi bi-cash-coin";
  return "bi bi-tag";
}
