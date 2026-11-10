import * as React from 'react';

/**
 * One value kept in `localStorage`, shared by every component that reads it and by other tabs.
 *
 * Read through `useSyncExternalStore`, with `fallback` on the server and during hydration, so the
 * first render in the browser matches the server's. `parse` gets whatever is stored, which may be
 * from an older version or edited by hand, and returns `fallback` for anything it does not accept.
 */
export type LocalStore<T> = {
  read: () => T;
  write: (value: T) => void;
  subscribe: (onChange: () => void) => () => void;
};

export function createLocalStore<T>(key: string, fallback: T, parse: (stored: unknown) => T): LocalStore<T> {
  const listeners = new Set<() => void>();
  // Parsed once per stored string, so `read` returns the same object until the value changes.
  let cache: { raw: string | null; value: T } | null = null;
  // A value storage refused (quota, private mode), kept for as long as the page is open.
  let unsaved: { value: T } | null = null;

  const read = (): T => {
    if (unsaved) return unsaved.value;
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return fallback;
    }
    if (cache && cache.raw === raw) return cache.value;
    let value = fallback;
    if (raw != null) {
      try {
        value = parse(JSON.parse(raw));
      } catch {
        value = fallback;
      }
    }
    cache = { raw, value };
    return value;
  };

  const write = (value: T) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      unsaved = null;
    } catch {
      unsaved = { value };
    }
    for (const listener of listeners) listener();
  };

  const subscribe = (onChange: () => void) => {
    listeners.add(onChange);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) onChange();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener('storage', onStorage);
    };
  };

  return { read, write, subscribe };
}

export function useLocalStore<T>(store: LocalStore<T>, fallback: T): T {
  return React.useSyncExternalStore(store.subscribe, store.read, () => fallback);
}
