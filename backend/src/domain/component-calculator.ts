export function calculateExpectedComponentQuantity(
  piecesPerGarment: number,
  targetQuantity: number,
): number {
  if (piecesPerGarment < 0) {
    throw new Error("Pieces per garment cannot be negative.");
  }

  if (targetQuantity <= 0) {
    throw new Error("Target quantity must be greater than zero.");
  }

  return piecesPerGarment * targetQuantity;
}