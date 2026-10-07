export function calculateExpectedFabric(
  standardFabricYards: number,
  targetQuantity: number,
): number {
  if (standardFabricYards < 0) {
    throw new Error("Standard fabric yards cannot be negative.");
  }

  if (targetQuantity <= 0) {
    throw new Error("Target quantity must be greater than zero.");
  }

  return standardFabricYards * targetQuantity;
}

export function calculateWastagePercentage(
  actualFabricYards: number,
  expectedFabricYards: number,
): number {
  if (expectedFabricYards <= 0) {
    throw new Error("Expected fabric must be greater than zero.");
  }

  if (actualFabricYards < 0) {
    throw new Error("Actual fabric yards cannot be negative.");
  }

  return (
    ((actualFabricYards - expectedFabricYards) /
      expectedFabricYards) *
    100
  );
}