import { notFound } from 'next/navigation';

import { findDebate } from '~/core/debates/api';
import { DebatePage } from '~/core/debates/debate-page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const debate = findDebate(id);
  if (!debate) notFound();
  return <DebatePage debate={debate} />;
}
