import {
  calculateExpectedFabric,
  calculateWastagePercentage,
} from "../../src/domain/wastage-calculator.js";

describe("Wastage calculator", () => {
  test("calculates expected fabric", () => {
    expect(
      calculateExpectedFabric(1.8, 100),
    ).toBeCloseTo(180);
  });

  test("calculates zero wastage", () => {
    expect(
      calculateWastagePercentage(180, 180),
    ).toBeCloseTo(0);
  });

  test("calculates positive wastage", () => {
    expect(
      calculateWastagePercentage(189, 180),
    ).toBeCloseTo(5);
  });
});