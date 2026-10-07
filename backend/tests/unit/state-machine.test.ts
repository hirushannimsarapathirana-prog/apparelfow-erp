import {
  assertValidTransition,
  canTransition,
  CuttingOrderState,
} from "../../src/domain/state-machine.js";

describe("Cutting order state machine", () => {
  test("cutting can move to pending verification", () => {
    expect(
      canTransition(
        CuttingOrderState.CUTTING_IN_PROGRESS,
        CuttingOrderState.PENDING_VERIFICATION,
      ),
    ).toBe(true);
  });

  test("pending verification can move to count QC", () => {
    expect(
      canTransition(
        CuttingOrderState.PENDING_VERIFICATION,
        CuttingOrderState.COUNT_QC,
      ),
    ).toBe(true);
  });

  test("count QC can move to verified", () => {
    expect(
      canTransition(
        CuttingOrderState.COUNT_QC,
        CuttingOrderState.VERIFIED,
      ),
    ).toBe(true);
  });

  test("count QC cannot move directly to sewing queue", () => {
    expect(
      canTransition(
        CuttingOrderState.COUNT_QC,
        CuttingOrderState.SEWING_QUEUE,
      ),
    ).toBe(false);
  });

  test("rejected order cannot move anywhere", () => {
    expect(
      canTransition(
        CuttingOrderState.REJECTED,
        CuttingOrderState.VERIFIED,
      ),
    ).toBe(false);
  });

  test("invalid transition throws", () => {
    expect(() =>
      assertValidTransition(
        CuttingOrderState.COUNT_QC,
        CuttingOrderState.SEWING_QUEUE,
      ),
    ).toThrow();
  });
});