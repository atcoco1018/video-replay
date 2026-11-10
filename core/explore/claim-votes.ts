import * as React from 'react';

import { CLAIM_VOTES_STORAGE_KEY } from './explore-constants';
import { createLocalStore, useLocalStore } from './local-store';
import type { Claim, ClaimVote } from './types';

type Votes = Readonly<Record<string, ClaimVote>>;

const NO_VOTES: Votes = {};

export function parseVotes(stored: unknown): Votes {
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return NO_VOTES;
  const votes: Record<string, ClaimVote> = {};
  for (const [id, vote] of Object.entries(stored)) {
    if (vote === 'agree' || vote === 'disagree') votes[id] = vote;
  }
  return votes;
}

/** Pressing the vote already cast takes it back; pressing the other one switches. */
export function castVote(votes: Votes, claimId: string, vote: ClaimVote): Votes {
  const next = { ...votes };
  if (next[claimId] === vote) delete next[claimId];
  else next[claimId] = vote;
  return next;
}

/** The claim's counts with this browser's vote added, as the viewer expects to see it. */
export function withOwnVote<T extends Pick<Claim, 'agree' | 'disagree'>>(claim: T, vote: ClaimVote | undefined): T {
  if (!vote) return claim;
  return vote === 'agree' ? { ...claim, agree: claim.agree + 1 } : { ...claim, disagree: claim.disagree + 1 };
}

export const claimVotesStore = createLocalStore(CLAIM_VOTES_STORAGE_KEY, NO_VOTES, parseVotes);

export function useClaimVotes() {
  const votes = useLocalStore(claimVotesStore, NO_VOTES);
  const vote = React.useCallback(
    (claimId: string, choice: ClaimVote) => claimVotesStore.write(castVote(claimVotesStore.read(), claimId, choice)),
    []
  );
  return { votes, vote };
}
