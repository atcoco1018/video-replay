'use client';

import * as React from 'react';

import { DEFAULT_EXPLORE_QUERY } from '../explore-constants';
import { isFiltered, serializeExploreQuery } from '../explore-query';
import { countByTopic, filterClaims } from '../filter-claims';
import { pluralize } from '../format';
import { searchTokens } from '../search-text';
import { sortClaims } from '../sort-claims';
import type { Claim, ClaimVote, ExploreQuery, Topic } from '../types';
import { ClaimList } from './claim-list';
import { EmptyState } from './empty-state';
import { ExploreSearch } from './explore-search';
import { FilterBar } from './filter-bar';
import { FollowedTopicsPanel } from './followed-topics-panel';
import { TopicChips } from './topic-chips';
import { TopicHeader } from './topic-header';

export type ExploreViewProps = {
  query: ExploreQuery;
  /** Called with only what changed, to apply on top of the latest query. */
  onQueryChange: (change: Partial<ExploreQuery>) => void;
  claims: readonly Claim[];
  topics: readonly Topic[];
  debates: ReadonlyArray<{ id: string; title: string }>;
  /** On a topic's page: the topic, which then cannot be changed from the chips. */
  fixedTopic?: Topic;
  followed: readonly string[];
  onToggleFollow: (slug: string) => void;
  votes: Readonly<Record<string, ClaimVote>>;
  onVote: (claimId: string, vote: ClaimVote) => void;
};

/**
 * Claims from every debate, to search, narrow and sort.
 *
 * Sorted on the claims' own counts, not counts with this browser's vote added, so a claim does not
 * jump away from under the pointer as it is voted on. The cards still show the vote in their counts.
 */
export function ExploreView({
  query,
  onQueryChange,
  claims,
  topics,
  debates,
  fixedTopic,
  followed,
  onToggleFollow,
  votes,
  onVote,
}: ExploreViewProps) {
  // On a topic's page the URL's own `topic` is ignored, and dropped from what is written back.
  const effective = React.useMemo(
    () => (fixedTopic ? { ...query, topic: fixedTopic.slug } : query),
    [fixedTopic, query]
  );
  const update = (change: Partial<ExploreQuery>) => onQueryChange(fixedTopic ? { ...change, topic: null } : change);

  const topicsBySlug = React.useMemo(() => new Map(topics.map(topic => [topic.slug, topic])), [topics]);
  const tokens = React.useMemo(() => searchTokens(effective.q), [effective.q]);
  const shown = React.useMemo(() => sortClaims(filterClaims(claims, effective), effective.sort), [claims, effective]);
  // Per topic, under every filter but the topic itself, so each chip says what choosing it would show.
  const chipCounts = React.useMemo(
    () => countByTopic(filterClaims(claims, { ...effective, topic: null })),
    [claims, effective]
  );
  const allCounts = React.useMemo(() => countByTopic(claims), [claims]);
  const fixedTopicCount = fixedTopic ? (allCounts.get(fixedTopic.slug) ?? 0) : 0;
  const total = fixedTopic ? fixedTopicCount : claims.length;
  const filtered = isFiltered(fixedTopic ? { ...effective, topic: null } : effective);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="grid content-start gap-4">
        {fixedTopic ? (
          <TopicHeader
            topic={fixedTopic}
            claimCount={fixedTopicCount}
            following={followed.includes(fixedTopic.slug)}
            onToggleFollow={() => onToggleFollow(fixedTopic.slug)}
          />
        ) : (
          <div className="grid gap-1">
            <h1 className="text-2xl font-semibold">Explore</h1>
            <p className="text-sm text-grey-04">
              What was said in every debate. Each claim opens its debate at the moment it was made.
            </p>
          </div>
        )}

        <ExploreSearch value={effective.q} onCommit={q => update({ q })} />
        {!fixedTopic && (
          <TopicChips
            topics={topics}
            counts={chipCounts}
            selected={effective.topic}
            onSelect={topic => update({ topic })}
          />
        )}
        <FilterBar
          debates={debates}
          debate={effective.debate}
          side={effective.side}
          sort={effective.sort}
          onDebateChange={debate => update({ debate })}
          onSideChange={side => update({ side })}
          onSortChange={sort => update({ sort })}
        />

        <p className="text-sm text-grey-04" aria-live="polite">
          {filtered ? `${pluralize(shown.length, 'claim')} of ${total}` : pluralize(total, 'claim')}
        </p>

        {shown.length === 0 ? (
          <EmptyState onReset={() => onQueryChange({ ...DEFAULT_EXPLORE_QUERY, sort: query.sort })} />
        ) : (
          <ClaimList
            key={serializeExploreQuery(effective)}
            claims={shown}
            topics={topicsBySlug}
            tokens={tokens}
            votes={votes}
            onVote={onVote}
          />
        )}
      </div>

      <aside className="grid content-start gap-4">
        <FollowedTopicsPanel followed={followed} topics={topicsBySlug} counts={allCounts} onUnfollow={onToggleFollow} />
      </aside>
    </div>
  );
}
