import mockDebates from '~/core/debates/mock-debates.json';

import { CLAIMS_PER_DEBATE, MOCK_NOW, MOCK_SEED, MOCK_SPREAD_DAYS } from '../explore-constants';
import type { Claim, ClaimSide, Topic } from '../types';
import { DEBATE_TEMPLATES, TOPICS } from './claim-templates';
import { createRandom } from './seeded-random';

const MINUTE_MS = 60_000;

/** Seconds kept clear at each end of a turn, so a claim never sits on a hand-over. */
const TURN_EDGE_SECONDS = 2;

type MockDebate = (typeof mockDebates)[number];

/** Which slot speaks in each turn: the first speaker opens, then they alternate. */
export function turnSlots(debate: Pick<MockDebate, 'turns' | 'first_participant_slot'>): Array<1 | 2> {
  return Array.from(
    { length: debate.turns },
    (_, turn) => (turn % 2 === 0 ? debate.first_participant_slot : 3 - debate.first_participant_slot) as 1 | 2
  );
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Every opener and point of one side put together, so claims can be drawn without repeats. */
function sentences(fragments: { openers: string[]; points: string[] }): string[] {
  return fragments.openers.flatMap(opener => fragments.points.map(point => `${capitalize(opener)} ${point}.`));
}

/**
 * Claims for every mock debate, made by its two debaters during their own turns.
 *
 * The same `seed` always gives the same claims, so the server and the browser agree.
 */
export function generateClaims(seed: number, perDebate = CLAIMS_PER_DEBATE): Claim[] {
  const random = createRandom(seed);
  const claims: Claim[] = [];
  for (const debate of mockDebates) {
    const template = DEBATE_TEMPLATES[debate.id];
    if (!template) continue;
    const slots = turnSlots(debate);
    const unused: Record<ClaimSide, string[]> = {
      for: random.sample(sentences(template.for), Infinity),
      against: random.sample(sentences(template.against), Infinity),
    };
    for (let index = 0; index < perDebate; index++) {
      const speaker = random.pick(debate.participants);
      const side = speaker.position.toLowerCase() as ClaimSide;
      const text = unused[side].shift();
      if (!text) break;
      const turns = slots.flatMap((slot, turn) => (slot === speaker.slot ? [turn] : []));
      const turn = random.pick(turns);
      const seconds =
        turn * debate.turnSeconds + random.int(TURN_EDGE_SECONDS, debate.turnSeconds - TURN_EDGE_SECONDS - 1);
      claims.push({
        id: `${debate.id.slice(0, 6)}-${String(index + 1).padStart(2, '0')}`,
        text,
        debateId: debate.id,
        debateTitle: debate.title,
        speakerName: speaker.name,
        speakerSlot: speaker.slot as 1 | 2,
        side,
        seconds,
        topicSlugs: random.sample(template.topicSlugs, random.int(1, 2)),
        agree: random.int(0, 400),
        disagree: random.int(0, 300),
        createdAt: MOCK_NOW - random.int(0, MOCK_SPREAD_DAYS * 24 * 60) * MINUTE_MS,
      });
    }
  }
  return claims;
}

export const EXPLORE_TOPICS: Topic[] = TOPICS;

export const EXPLORE_CLAIMS: Claim[] = generateClaims(MOCK_SEED);

export const EXPLORE_DEBATES: Array<{ id: string; title: string }> = mockDebates.map(debate => ({
  id: debate.id,
  title: debate.title,
}));

export function findTopic(slug: string): Topic | null {
  return EXPLORE_TOPICS.find(topic => topic.slug === slug) ?? null;
}
