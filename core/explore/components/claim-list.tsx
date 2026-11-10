'use client';

import * as React from 'react';

import { withOwnVote } from '../claim-votes';
import { EXPLORE_PAGE_SIZE } from '../explore-constants';
import { nextVisibleCount, paginate } from '../paginate';
import type { Claim, ClaimVote, Topic } from '../types';
import { ClaimCard } from './claim-card';

/**
 * The claims, a page at a time. Give it a `key` that changes with the query, so a new search starts
 * again from the first page.
 */
export function ClaimList({
  claims,
  topics,
  tokens,
  votes,
  onVote,
}: {
  claims: readonly Claim[];
  topics: ReadonlyMap<string, Topic>;
  tokens: readonly string[];
  votes: Readonly<Record<string, ClaimVote>>;
  onVote: (claimId: string, vote: ClaimVote) => void;
}) {
  const [visibleCount, setVisibleCount] = React.useState(EXPLORE_PAGE_SIZE);
  const { visible, remaining } = paginate(claims, visibleCount);
  return (
    <div className="grid gap-3">
      <ul className="grid gap-3">
        {visible.map(claim => (
          <li key={claim.id}>
            <ClaimCard
              claim={withOwnVote(claim, votes[claim.id])}
              topics={topics}
              tokens={tokens}
              vote={votes[claim.id]}
              onVote={vote => onVote(claim.id, vote)}
            />
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setVisibleCount(current => nextVisibleCount(current, EXPLORE_PAGE_SIZE, claims.length))}
          className="justify-self-center rounded-full border border-divider bg-white px-4 py-2 text-sm shadow-light"
        >
          Show more ({remaining} left)
        </button>
      )}
    </div>
  );
}
