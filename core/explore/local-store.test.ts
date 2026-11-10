import { act, renderHook } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLocalStore, useLocalStore } from './local-store';

const KEY = 'test.local-store';
const parseNumbers = (stored: unknown) =>
  Array.isArray(stored) && stored.every(item => typeof item === 'number') ? (stored as number[]) : [];

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('createLocalStore', () => {
  it('reads the fallback when nothing is stored', () => {
    const fallback: number[] = [];
    expect(createLocalStore(KEY, fallback, parseNumbers).read()).toBe(fallback);
  });

  it('writes JSON and reads it back', () => {
    const store = createLocalStore(KEY, [], parseNumbers);
    store.write([1, 2]);
    expect(window.localStorage.getItem(KEY)).toBe('[1,2]');
    expect(store.read()).toEqual([1, 2]);
  });

  it('returns the same object until the stored value changes', () => {
    const store = createLocalStore(KEY, [], parseNumbers);
    store.write([1]);
    const first = store.read();
    expect(store.read()).toBe(first);
    store.write([2]);
    expect(store.read()).not.toBe(first);
  });

  it('reads the fallback for broken JSON, and lets parse reject the wrong shape', () => {
    const store = createLocalStore(KEY, [], parseNumbers);
    window.localStorage.setItem(KEY, '{not json');
    expect(store.read()).toEqual([]);
    window.localStorage.setItem(KEY, '["a"]');
    expect(store.read()).toEqual([]);
  });

  it('keeps a value storage refuses for as long as the page is open', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const store = createLocalStore(KEY, [], parseNumbers);
    expect(() => store.write([7])).not.toThrow();
    expect(store.read()).toEqual([7]);
  });

  it('tells subscribers about writes and about other tabs, until they unsubscribe', () => {
    const store = createLocalStore(KEY, [], parseNumbers);
    const onChange = vi.fn();
    const unsubscribe = store.subscribe(onChange);
    store.write([1]);
    window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'another.key' }));
    expect(onChange).toHaveBeenCalledTimes(2);
    unsubscribe();
    store.write([2]);
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe('useLocalStore', () => {
  it('re-renders with what is written', () => {
    const store = createLocalStore(KEY, [], parseNumbers);
    const { result } = renderHook(() => useLocalStore(store, []));
    expect(result.current).toEqual([]);
    act(() => store.write([3]));
    expect(result.current).toEqual([3]);
  });
});
