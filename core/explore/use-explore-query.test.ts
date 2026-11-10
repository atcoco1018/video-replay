import { act, renderHook } from '@testing-library/react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_EXPLORE_QUERY } from './explore-constants';
import { useExploreQuery } from './use-explore-query';

const mocks = vi.hoisted(() => ({ search: '', replace: vi.fn(), params: new Map<string, URLSearchParams>() }));
// One object per URL, as Next gives, so a re-render alone does not look like the URL changed.
vi.mock('next/navigation', () => ({
  useSearchParams: () => {
    if (!mocks.params.has(mocks.search)) mocks.params.set(mocks.search, new URLSearchParams(mocks.search));
    return mocks.params.get(mocks.search)!;
  },
  usePathname: () => '/explore',
  useRouter: () => ({ replace: mocks.replace }),
}));

beforeEach(() => {
  mocks.search = '';
  mocks.replace.mockReset();
});

describe('useExploreQuery', () => {
  it('reads the query from the URL', () => {
    mocks.search = 'q=air&sort=newest';
    const { result } = renderHook(() => useExploreQuery());
    expect(result.current[0]).toEqual({ ...DEFAULT_EXPLORE_QUERY, q: 'air', sort: 'newest' });
  });

  it('writes a change into the URL, replacing the entry', () => {
    mocks.search = 'q=air';
    const { result } = renderHook(() => useExploreQuery());
    act(() => result.current[1]({ side: 'for' }));
    expect(mocks.replace).toHaveBeenCalledWith('/explore?q=air&side=for', { scroll: false });
  });

  it('keeps both of two changes made before the URL catches up', () => {
    const { result } = renderHook(() => useExploreQuery());
    act(() => {
      result.current[1]({ side: 'against' });
      result.current[1]({ sort: 'split' });
    });
    expect(mocks.replace).toHaveBeenLastCalledWith('/explore?side=against&sort=split', { scroll: false });
  });

  it('builds on the URL again once it has changed, as Back changes it', () => {
    const { result, rerender } = renderHook(() => useExploreQuery());
    act(() => result.current[1]({ side: 'against' }));
    mocks.search = 'topic=work';
    rerender();
    act(() => result.current[1]({ sort: 'newest' }));
    expect(mocks.replace).toHaveBeenLastCalledWith('/explore?topic=work&sort=newest', { scroll: false });
  });

  it('writes the bare path for the default query', () => {
    mocks.search = 'q=air';
    const { result } = renderHook(() => useExploreQuery());
    act(() => result.current[1]({ q: '' }));
    expect(mocks.replace).toHaveBeenCalledWith('/explore', { scroll: false });
  });
});
