import {
  canApproveVerification,
  getVerificationStatus,
  validateApproval,
  validateRejectionReason,
} from "../../src/domain/verification-rules.js";

describe("Verification rules", () => {
  test("GREEN when actual equals expected", () => {
    expect(
      getVerificationStatus(100, 100),
    ).toBe("GREEN");
  });

  test("YELLOW when actual exceeds expected", () => {
    expect(
      getVerificationStatus(100, 105),
    ).toBe("YELLOW");
  });

  test("RED when actual is below expected", () => {
    expect(
      getVerificationStatus(100, 95),
    ).toBe("RED");
  });

  test("RED when actual quantity is missing", () => {
    expect(
      getVerificationStatus(100, null),
    ).toBe("RED");
  });

  test("GREEN and YELLOW can be approved", () => {
    expect(
      canApproveVerification([
        "GREEN",
        "YELLOW",
      ]),
    ).toBe(true);
  });

  test("RED cannot be approved", () => {
    expect(
      canApproveVerification([
        "GREEN",
        "RED",
      ]),
    ).toBe(false);
  });

  test("approval throws when RED exists", () => {
    expect(() =>
      validateApproval([
        "GREEN",
        "RED",
      ]),
    ).toThrow();
  });

  test("rejection reason is required", () => {
    expect(() =>
      validateRejectionReason(""),
    ).toThrow();
  });

  test("valid rejection reason is accepted", () => {
    expect(() =>
      validateRejectionReason(
        "Sleeve cuff shortage",
      ),
    ).not.toThrow();
  });
});