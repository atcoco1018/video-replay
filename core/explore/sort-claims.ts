import type { Claim, ExploreSort } from './types';

/** Agreement minus disagreement. */
export const claimScore = (claim: Pick<Claim, 'agree' | 'disagree'>) => claim.agree - claim.disagree;

/**
 * How evenly the votes split, weighted by how many there are: twice the smaller side. 100 to 100
 * scores 200, 300 to 10 scores 20.
 */
export const claimDivision = (claim: Pick<Claim, 'agree' | 'disagree'>) => 2 * Math.min(claim.agree, claim.disagree);

const byNewest = (a: Claim, b: Claim) => b.createdAt - a.createdAt;
const byId = (a: Claim, b: Claim) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

const COMPARATORS: Record<ExploreSort, (a: Claim, b: Claim) => number> = {
  top: (a, b) => claimScore(b) - claimScore(a) || byNewest(a, b),
  newest: byNewest,
  // Debates in the order the claims list them, then by the moment in the debate.
  debate: (a, b) => (a.debateId === b.debateId ? a.seconds - b.seconds : 0),
  split: (a, b) => claimDivision(b) - claimDivision(a) || b.agree + b.disagree - (a.agree + a.disagree),
};

/** A sorted copy. Ties fall back to the claim id, so the order never shifts between renders. */
export function sortClaims(claims: readonly Claim[], sort: ExploreSort): Claim[] {
  const debateOrder = new Map<string, number>();
  for (const claim of claims) if (!debateOrder.has(claim.debateId)) debateOrder.set(claim.debateId, debateOrder.size);
  const compare = COMPARATORS[sort];
  return [...claims].sort(
    (a, b) =>
      (sort === 'debate' ? debateOrder.get(a.debateId)! - debateOrder.get(b.debateId)! : 0) ||
      compare(a, b) ||
      byId(a, b)
  );
}
