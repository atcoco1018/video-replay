import * as React from 'react';

import { FOLLOWED_TOPICS_STORAGE_KEY } from './explore-constants';
import { createLocalStore, useLocalStore } from './local-store';

const NONE: readonly string[] = [];

/** Keeps the strings, once each, in the order they were followed. */
export function parseFollowedTopics(stored: unknown): readonly string[] {
  if (!Array.isArray(stored)) return NONE;
  return [...new Set(stored.filter((slug): slug is string => typeof slug === 'string' && slug !== ''))];
}

/** Followed when it was not, unfollowed when it was. Newly followed topics go last. */
export function toggleTopic(followed: readonly string[], slug: string): string[] {
  return followed.includes(slug) ? followed.filter(s => s !== slug) : [...followed, slug];
}

export const followedTopicsStore = createLocalStore(FOLLOWED_TOPICS_STORAGE_KEY, NONE, parseFollowedTopics);

/** The topics this browser follows, and a toggle. Per browser; there are no accounts here. */
export function useFollowedTopics() {
  const followed = useLocalStore(followedTopicsStore, NONE);
  const toggle = React.useCallback(
    (slug: string) => followedTopicsStore.write(toggleTopic(followedTopicsStore.read(), slug)),
    []
  );
  return { followed, toggle };
}
