import { VerificationStatus } from "@prisma/client";

export { VerificationStatus };

export function getVerificationStatus(
  expectedQty: number,
  actualQty: number | null,
): VerificationStatus {
  if (actualQty === null || actualQty < expectedQty) {
    return VerificationStatus.RED;
  }

  if (actualQty === expectedQty) {
    return VerificationStatus.GREEN;
  }

  return VerificationStatus.YELLOW;
}

export function canApproveVerification(
  statuses: VerificationStatus[],
): boolean {
  return (
    statuses.length > 0 &&
    statuses.every(
      (status) =>
        status === VerificationStatus.GREEN ||
        status === VerificationStatus.YELLOW,
    )
  );
}

export function validateApproval(
  statuses: VerificationStatus[],
): void {
  if (!canApproveVerification(statuses)) {
    throw new Error(
      "Verification cannot be approved: all components must be GREEN or YELLOW.",
    );
  }
}

export function validateRejectionReason(
  rejectionReason: string | null | undefined,
): void {
  if (
    !rejectionReason ||
    rejectionReason.trim().length === 0
  ) {
    throw new Error("Rejection reason is required.");
  }
}