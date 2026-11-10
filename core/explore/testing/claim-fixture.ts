import type { Claim, Topic } from '../types';

let nextId = 1;

/** A claim with plain defaults; tests override what they look at. */
export function claimFixture(overrides: Partial<Claim> = {}): Claim {
  const id = `claim-${String(nextId++).padStart(3, '0')}`;
  return {
    id,
    text: 'Fewer cars means cleaner air.',
    debateId: 'debate-a',
    debateTitle: 'Should cities ban cars?',
    speakerName: 'Ada',
    speakerSlot: 1,
    side: 'for',
    seconds: 12,
    topicSlugs: ['cities'],
    agree: 10,
    disagree: 5,
    createdAt: Date.UTC(2026, 10, 1),
    ...overrides,
  };
}

export const topicFixtures: Topic[] = [
  { slug: 'cities', name: 'Cities', description: 'Streets and centres.' },
  { slug: 'work', name: 'Work', description: 'Jobs and teams.' },
  { slug: 'health', name: 'Health', description: 'Bodies and minds.' },
];
