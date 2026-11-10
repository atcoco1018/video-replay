import { act, renderHook } from '@testing-library/react';

import { afterEach, describe, expect, it } from 'vitest';

import { FOLLOWED_TOPICS_STORAGE_KEY } from './explore-constants';
import { parseFollowedTopics, toggleTopic, useFollowedTopics } from './followed-topics';

afterEach(() => window.localStorage.clear());

describe('parseFollowedTopics', () => {
  it('keeps non-empty strings once each, in order', () => {
    expect(parseFollowedTopics(['work', '', 3, 'work', 'cities', null])).toEqual(['work', 'cities']);
  });

  it('is empty for anything but a list', () => {
    expect(parseFollowedTopics({ work: true })).toEqual([]);
    expect(parseFollowedTopics(null)).toEqual([]);
  });
});

describe('toggleTopic', () => {
  it('follows at the end, and unfollows', () => {
    expect(toggleTopic(['work'], 'cities')).toEqual(['work', 'cities']);
    expect(toggleTopic(['work', 'cities'], 'work')).toEqual(['cities']);
  });
});

describe('useFollowedTopics', () => {
  it('saves follows for the next visit', () => {
    const { result } = renderHook(() => useFollowedTopics());
    act(() => result.current.toggle('health'));
    act(() => result.current.toggle('work'));
    expect(result.current.followed).toEqual(['health', 'work']);
    expect(JSON.parse(window.localStorage.getItem(FOLLOWED_TOPICS_STORAGE_KEY)!)).toEqual(['health', 'work']);

    act(() => result.current.toggle('health'));
    expect(result.current.followed).toEqual(['work']);
  });

  it('is shared by every component that reads it', () => {
    const first = renderHook(() => useFollowedTopics());
    const second = renderHook(() => useFollowedTopics());
    act(() => first.result.current.toggle('cities'));
    expect(second.result.current.followed).toEqual(['cities']);
  });
});
