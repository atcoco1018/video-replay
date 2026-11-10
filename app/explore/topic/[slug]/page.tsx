import * as React from 'react';

import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { ExploreRoute } from '~/core/explore/components/explore-route';
import { EXPLORE_TOPICS, findTopic } from '~/core/explore/mock/mock-explore-data';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return EXPLORE_TOPICS.map(topic => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const topic = findTopic((await params).slug);
  return { title: topic ? `${topic.name} · Explore` : 'Explore' };
}

export default async function TopicPage({ params }: { params: Params }) {
  const topic = findTopic((await params).slug);
  if (!topic) notFound();
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <React.Suspense>
        <ExploreRoute fixedTopic={topic} />
      </React.Suspense>
    </main>
  );
}
