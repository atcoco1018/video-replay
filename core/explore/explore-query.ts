import { DEFAULT_EXPLORE_QUERY, EXPLORE_SORTS, SIDE_FILTERS } from './explore-constants';
import type { ExploreQuery, ExploreSort, SideFilter } from './types';

const SORT_VALUES = new Set<string>(EXPLORE_SORTS.map(sort => sort.value));
const SIDE_VALUES = new Set<string>(SIDE_FILTERS.map(side => side.value));

/** Search params are read as the URL gives them; anything unknown falls back to the default. */
type ParamsLike = { get: (name: string) => string | null };

/**
 * The query a URL names. `known` limits `topic` and `debate` to ones that exist, so a stale link
 * shows everything rather than nothing.
 */
export function parseExploreQuery(
  params: ParamsLike,
  known: { topics: ReadonlySet<string>; debates: ReadonlySet<string> }
): ExploreQuery {
  const sort = params.get('sort');
  const side = params.get('side');
  const topic = params.get('topic');
  const debate = params.get('debate');
  return {
    q: (params.get('q') ?? '').trim(),
    topic: topic && known.topics.has(topic) ? topic : null,
    debate: debate && known.debates.has(debate) ? debate : null,
    side: side && SIDE_VALUES.has(side) ? (side as SideFilter) : DEFAULT_EXPLORE_QUERY.side,
    sort: sort && SORT_VALUES.has(sort) ? (sort as ExploreSort) : DEFAULT_EXPLORE_QUERY.sort,
  };
}

/** The search string for a query, without the parts left at their default. Empty for the default. */
export function serializeExploreQuery(query: ExploreQuery): string {
  const params = new URLSearchParams();
  const q = query.q.trim();
  if (q) params.set('q', q);
  if (query.topic) params.set('topic', query.topic);
  if (query.debate) params.set('debate', query.debate);
  if (query.side !== DEFAULT_EXPLORE_QUERY.side) params.set('side', query.side);
  if (query.sort !== DEFAULT_EXPLORE_QUERY.sort) params.set('sort', query.sort);
  return params.toString();
}

/** Whether anything narrows the claims. Sorting alone does not. */
export function isFiltered(query: ExploreQuery): boolean {
  return query.q.trim() !== '' || query.topic != null || query.debate != null || query.side !== 'all';
}
