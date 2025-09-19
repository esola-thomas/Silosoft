// ptoUtil - helper to compute remaining locked turns for a card
export function remainingPtoTurns(turnNumber: number, availableOnTurn: number): number {
  return Math.max(0, availableOnTurn - turnNumber);
}
