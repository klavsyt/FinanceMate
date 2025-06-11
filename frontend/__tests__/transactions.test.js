// Пример простого unit-теста для frontend
// Замените someFunction на реальную функцию из transactions.js для проверки
import { showTransactionModal } from "../transactions.js";

describe("showTransactionModal", () => {
  it("должен быть определён", () => {
    expect(showTransactionModal).toBeDefined();
  });
});
