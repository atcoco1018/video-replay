import { matchesAllTokens, searchTokens } from './search-text';
import type { Claim, ExploreQuery } from './types';

/** The claims that pass every filter in the query. Order is left as it was; see `sortClaims`. */
export function filterClaims(claims: readonly Claim[], query: Omit<ExploreQuery, 'sort'>): Claim[] {
  const tokens = searchTokens(query.q);
  return claims.filter(
    claim =>
      (query.topic == null || claim.topicSlugs.includes(query.topic)) &&
      (query.debate == null || claim.debateId === query.debate) &&
      (query.side === 'all' || claim.side === query.side) &&
      matchesAllTokens([claim.text, claim.speakerName, claim.debateTitle], tokens)
  );
}

/** How many claims sit under each topic, for the topic chips. */
export function countByTopic(claims: readonly Claim[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const claim of claims) {
    for (const slug of claim.topicSlugs) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return counts;
}
