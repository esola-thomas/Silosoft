// completionLogic (T068) - bundle selection + resource picking helpers
// Completion logic updated for multi-role per-feature requirements.
import type { Candidate, HandCard } from './gameContext.tsx';

// Greedy selection: pick smallest sufficient set of cards to cover each role; contractors (role==='CONTRACTOR') contribute 2 points to any remaining deficit.
export function selectResourcesForCandidate(hand: HandCard[], candidate: Candidate): string[] {
  if (!candidate) return [];
  const chosen: string[] = [];
  const available = [...hand];
  for (const req of candidate.requirements) {
    let needed = req.minPoints;
    const roleCards = available.filter(c => c.role === req.role).sort((a,b) => b.points - a.points);
    for (const card of roleCards) {
      if (needed <= 0) break;
      chosen.push(card.id);
      needed -= card.points;
      const idx = available.findIndex(c => c.id === card.id);
      if (idx !== -1) available.splice(idx,1);
    }
    while (needed > 0) {
      const contractorIdx = available.findIndex(c => c.role === 'CONTRACTOR');
      if (contractorIdx === -1) return [];
      const contractor = available.splice(contractorIdx,1)[0];
      chosen.push(contractor.id);
      needed -= 2; // contractor fixed contribution
    }
  }
  return chosen;
}
