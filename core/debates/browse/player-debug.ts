'use client';

import * as React from 'react';

/**
 * Test-project only: what each player is doing, for the panels under the cards and the event log.
 * The player reports here and nothing reads it back, so it has no effect on playback.
 */

export type PlayerDebugState = Record<string, string | number | boolean | null>;

type Store = {
  states: Map<string, PlayerDebugState>;
  events: Array<{ at: number; debateId: string; text: string }>;
};

const MAX_EVENTS = 40;

let store: Store = { states: new Map(), events: [] };
const listeners = new Set<() => void>();

function emit(next: Store) {
  store = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function reportPlayerState(cardKey: string, state: PlayerDebugState) {
  const states = new Map(store.states);
  states.set(cardKey, state);
  emit({ ...store, states });
}

export function recordPlayerEvent(debateId: string, text: string) {
  emit({ ...store, events: [{ at: Date.now(), debateId, text }, ...store.events].slice(0, MAX_EVENTS) });
}

export function clearPlayerEvents() {
  emit({ ...store, events: [] });
}

const serverStore: Store = { states: new Map(), events: [] };

export function usePlayerDebugStore() {
  return React.useSyncExternalStore(
    subscribe,
    () => store,
    () => serverStore
  );
}
