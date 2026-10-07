export enum CuttingOrderState {
  CUTTING_IN_PROGRESS = "CUTTING_IN_PROGRESS",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  COUNT_QC = "COUNT_QC",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  SEWING_QUEUE = "SEWING_QUEUE",
}

const allowedTransitions: Record<
  CuttingOrderState,
  CuttingOrderState[]
> = {
  [CuttingOrderState.CUTTING_IN_PROGRESS]: [
    CuttingOrderState.PENDING_VERIFICATION,
  ],

  [CuttingOrderState.PENDING_VERIFICATION]: [
    CuttingOrderState.COUNT_QC,
  ],

  [CuttingOrderState.COUNT_QC]: [
    CuttingOrderState.VERIFIED,
    CuttingOrderState.REJECTED,
  ],

  [CuttingOrderState.VERIFIED]: [
    CuttingOrderState.SEWING_QUEUE,
  ],

  [CuttingOrderState.REJECTED]: [],

  [CuttingOrderState.SEWING_QUEUE]: [],
};

export function canTransition(
  currentState: CuttingOrderState,
  nextState: CuttingOrderState,
): boolean {
  return allowedTransitions[currentState].includes(nextState);
}

export function assertValidTransition(
  currentState: CuttingOrderState,
  nextState: CuttingOrderState,
): void {
  if (!canTransition(currentState, nextState)) {
    throw new Error(
      `Invalid cutting order transition: ${currentState} -> ${nextState}`,
    );
  }
}