'use client';

import * as React from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import type { Debate } from './api';
import { DebateFeedPlayer } from './browse/debate-feed-player';
import { DevPanels, PlayerDebugPanel } from './browse/debug-panels';

/**
 * One debate on its own page. The player is always active here and never held, and `?t=` names a
 * moment to open at, as a link to a claim inside the debate does.
 */
export function DebatePage({ debate }: { debate: Debate }) {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_300px]">
      <div className="grid content-start gap-4">
        <Link href="/" className="text-sm underline">
          ← All debates
        </Link>
        <h1 className="text-2xl font-semibold">{debate.title}</h1>
        <React.Suspense>
          <DebatePagePlayer debate={debate} />
        </React.Suspense>
      </div>
      <DevPanels />
    </main>
  );
}

function DebatePagePlayer({ debate }: { debate: Debate }) {
  const searchParams = useSearchParams();
  const t = searchParams.get('t');
  const initialSeekSeconds = t != null && Number.isFinite(Number(t)) ? Number(t) : null;

  return (
    <>
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="text-grey-04">Link to a moment:</span>
        <Link className="underline" href={`/debate/${debate.id}?t=40`}>
          ?t=40
        </Link>
        <Link className="underline" href={`/debate/${debate.id}?t=70`}>
          ?t=70
        </Link>
        <Link className="underline" href={`/debate/${debate.id}`}>
          no ?t=
        </Link>
      </div>
      <DebateFeedPlayer debate={debate} active initialSeekSeconds={initialSeekSeconds} debugKey="page" />
      <PlayerDebugPanel cardKey="page" />
    </>
  );
}
