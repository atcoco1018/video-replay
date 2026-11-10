'use client';

import * as React from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { parseExploreQuery, serializeExploreQuery } from './explore-query';
import { EXPLORE_DEBATES, EXPLORE_TOPICS } from './mock/mock-explore-data';
import type { ExploreQuery } from './types';

const KNOWN = {
  topics: new Set(EXPLORE_TOPICS.map(topic => topic.slug)),
  debates: new Set(EXPLORE_DEBATES.map(debate => debate.id)),
};

/**
 * The explore query, read from and written to the URL. Written with `replace`, so narrowing the
 * claims does not fill the history; Back leaves the page rather than undoing one filter at a time.
 *
 * A change is applied on top of the last one written, not the URL, which catches up a moment later:
 * two changes made before it does (a side, then a sort) must both stick.
 */
export function useExploreQuery(): [ExploreQuery, (change: Partial<ExploreQuery>) => void] {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const query = React.useMemo(() => parseExploreQuery(searchParams, KNOWN), [searchParams]);

  const writtenRef = React.useRef(query);
  React.useLayoutEffect(() => {
    writtenRef.current = query;
  }, [query]);

  const update = React.useCallback(
    (change: Partial<ExploreQuery>) => {
      const next = { ...writtenRef.current, ...change };
      writtenRef.current = next;
      const search = serializeExploreQuery(next);
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [pathname, router]
  );
  return [query, update];
}
