'use client';

import * as React from 'react';

import { SEARCH_DEBOUNCE_MS } from '../explore-constants';

/**
 * The search box. What is typed shows at once; it is applied after a pause in typing, so the URL is
 * not rewritten on every key. Clearing applies at once.
 *
 * Follows `value` when it changes from outside (a link, Back), unless that change is the one this
 * box just applied.
 */
export function ExploreSearch({ value, onCommit }: { value: string; onCommit: (value: string) => void }) {
  const [draft, setDraft] = React.useState(value);
  const [seenValue, setSeenValue] = React.useState(value);
  // What this box last applied. The URL trims it, so it is compared trimmed: a trailing space typed
  // before the next word must not be taken away when the URL catches up.
  const [applied, setApplied] = React.useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    if (value !== applied.trim()) setDraft(value);
  }

  const apply = (next: string) => {
    setApplied(next);
    onCommit(next);
  };

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  React.useEffect(() => cancel, []);

  const commitLater = (next: string) => {
    cancel();
    if (next.trim() === '') {
      apply('');
      return;
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      apply(next);
    }, SEARCH_DEBOUNCE_MS);
  };

  return (
    <form
      role="search"
      onSubmit={event => {
        event.preventDefault();
        cancel();
        apply(draft);
      }}
      className="flex items-center gap-2 rounded-full border border-divider bg-white px-4 py-2 shadow-light"
    >
      <input
        type="search"
        aria-label="Search claims"
        placeholder="Search claims, speakers or debates"
        value={draft}
        onChange={event => {
          setDraft(event.target.value);
          commitLater(event.target.value);
        }}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
      />
      {draft !== '' && (
        <button
          type="button"
          onClick={() => {
            setDraft('');
            commitLater('');
          }}
          className="text-xs text-grey-04 underline"
        >
          Clear
        </button>
      )}
    </form>
  );
}
