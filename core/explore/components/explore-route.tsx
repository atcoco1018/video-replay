'use client';

import { useClaimVotes } from '../claim-votes';
import { useFollowedTopics } from '../followed-topics';
import { EXPLORE_CLAIMS, EXPLORE_DEBATES, EXPLORE_TOPICS } from '../mock/mock-explore-data';
import type { Topic } from '../types';
import { useExploreQuery } from '../use-explore-query';
import { ExploreView } from './explore-view';

/** The explore view wired to the URL, the mock claims, and this browser's follows and votes. */
export function ExploreRoute({ fixedTopic }: { fixedTopic?: Topic }) {
  const [query, setQuery] = useExploreQuery();
  const { followed, toggle } = useFollowedTopics();
  const { votes, vote } = useClaimVotes();
  return (
    <ExploreView
      query={query}
      onQueryChange={setQuery}
      claims={EXPLORE_CLAIMS}
      topics={EXPLORE_TOPICS}
      debates={EXPLORE_DEBATES}
      fixedTopic={fixedTopic}
      followed={followed}
      onToggleFollow={toggle}
      votes={votes}
      onVote={vote}
    />
  );
}
