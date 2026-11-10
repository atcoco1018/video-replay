'use client';

import * as React from 'react';

import cx from 'classnames';

import { clearPlayerEvents, usePlayerDebugStore } from './player-debug';

/** Test-project only: one player's state, under its card. */
export function PlayerDebugPanel({ cardKey }: { cardKey: string }) {
  const state = usePlayerDebugStore().states.get(cardKey);
  if (!state) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5 rounded-lg border border-divider bg-white p-3 font-mono text-xs sm:grid-cols-4">
      {Object.entries(state).map(([name, value]) => (
        <div key={name} className="flex justify-between gap-2">
          <dt className="text-grey-04">{name}</dt>
          <dd className={cx(value === true && 'font-semibold text-green-700')}>{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function readStorage(): Array<[string, string]> {
  try {
    return Object.keys(window.localStorage)
      .sort()
      .map(key => [key, window.localStorage.getItem(key) ?? '']);
  } catch {
    return [];
  }
}

/** Test-project only: this browser's localStorage, and what the players did, beside the page. */
export function DevPanels() {
  const { events } = usePlayerDebugStore();
  const [entries, setEntries] = React.useState<Array<[string, string]>>([]);
  React.useEffect(() => {
    const read = () => setEntries(readStorage());
    read();
    const timer = window.setInterval(read, 500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <aside className="grid content-start gap-4 text-xs lg:sticky lg:top-6">
      <section className="grid gap-2 rounded-lg border border-divider bg-white p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">localStorage</h3>
          <button
            type="button"
            className="rounded border border-divider px-2 py-0.5"
            onClick={() => {
              try {
                window.localStorage.clear();
              } catch {}
              setEntries(readStorage());
            }}
          >
            Clear
          </button>
        </div>
        {entries.length === 0 ? (
          <p className="text-grey-04">Empty.</p>
        ) : (
          entries.map(([key, value]) => (
            <div key={key} className="grid gap-0.5">
              <code className="font-semibold">{key}</code>
              <pre className="max-h-40 overflow-auto rounded bg-bg p-1.5 break-all whitespace-pre-wrap">
                {pretty(value)}
              </pre>
            </div>
          ))
        )}
      </section>
      <section className="grid gap-2 rounded-lg border border-divider bg-white p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Player events</h3>
          <button type="button" className="rounded border border-divider px-2 py-0.5" onClick={clearPlayerEvents}>
            Clear
          </button>
        </div>
        {events.length === 0 ? (
          <p className="text-grey-04">Nothing yet.</p>
        ) : (
          <ol className="grid max-h-80 gap-0.5 overflow-auto font-mono">
            {events.map((event, index) => (
              <li key={`${event.at}-${index}`}>
                <span className="text-grey-04">{new Date(event.at).toLocaleTimeString()}</span>{' '}
                <span className="text-grey-04">{event.debateId.slice(0, 6)}</span> {event.text}
              </li>
            ))}
          </ol>
        )}
      </section>
    </aside>
  );
}

function pretty(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}
