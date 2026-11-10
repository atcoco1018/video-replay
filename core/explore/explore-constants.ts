import type { ExploreQuery, ExploreSort, SideFilter } from './types';

/** Claims shown at first, and added by each "Show more". */
export const EXPLORE_PAGE_SIZE = 12;

/** Claims made per debate by the mock data. */
export const CLAIMS_PER_DEBATE = 30;

/** Fixes the mock data, so the server and the browser render the same claims. */
export const MOCK_SEED = 20_261_110;

/** The mock claims were made in the 30 days up to this moment. Fixed for the same reason. */
export const MOCK_NOW = Date.UTC(2026, 10, 10, 12);

export const MOCK_SPREAD_DAYS = 30;

/** How long typing waits before the search is applied. */
export const SEARCH_DEBOUNCE_MS = 250;

export const FOLLOWED_TOPICS_STORAGE_KEY = 'explore.followed-topics.v1';

export const CLAIM_VOTES_STORAGE_KEY = 'explore.votes.v1';

export const EXPLORE_SORTS: ReadonlyArray<{ value: ExploreSort; label: string }> = [
  { value: 'top', label: 'Top' },
  { value: 'newest', label: 'Newest' },
  { value: 'debate', label: 'In debate order' },
  { value: 'split', label: 'Most divided' },
];

export const SIDE_FILTERS: ReadonlyArray<{ value: SideFilter; label: string }> = [
  { value: 'all', label: 'Both sides' },
  { value: 'for', label: 'For' },
  { value: 'against', label: 'Against' },
];

export const DEFAULT_EXPLORE_QUERY: ExploreQuery = {
  q: '',
  topic: null,
  debate: null,
  side: 'all',
  sort: 'top',
};
