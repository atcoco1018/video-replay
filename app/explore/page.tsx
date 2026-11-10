import * as React from 'react';

import type { Metadata } from 'next';

import { ExploreRoute } from '~/core/explore/components/explore-route';

export const metadata: Metadata = { title: 'Explore · Debate replay test' };

export default function ExplorePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* The query lives in the URL's search params, which are only known in the browser. */}
      <React.Suspense>
        <ExploreRoute />
      </React.Suspense>
    </main>
  );
}
