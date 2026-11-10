import mockDebates from './mock-debates.json';

/**
 * The mocked debates API. Nothing here goes to a network or needs a sign-in: the debates are the
 * entries in `mock-debates.json`, and their recordings and images are the files `npm run media`
 * writes to public/media.
 *
 * The two media calls answer after a delay, as the real ones do: the recordings' URLs first, the
 * turn timings later.
 *
 * A debate's length comes from two places, as in the app. `turn_durations_ms` is the format's
 * allowance, on the debate itself, so it is known at once; the turn timings replace it when they
 * arrive. "Is remote work better for teams?" has no allowance, so its player is `ready` while its
 * `timelineSeconds` is still 0 — the window in which any seek is capped at 0.
 */

export type DebateParticipant = {
  slot: 1 | 2;
  name: string;
  position: string;
  avatarUrl: string;
};

export type Debate = {
  id: string;
  title: string;
  first_participant_slot: 1 | 2;
  /** Each turn's allowance, or null when the debate has none and only its turn timings say. */
  turn_durations_ms: number[] | null;
  participants: DebateParticipant[];
};

export type DebateMediaTurnSegment = {
  slot: 1 | 2;
  startSeconds: number;
  endSeconds: number;
};

type MockDebate = (typeof mockDebates)[number];

export const SIGN_URLS_DELAY_MS = 300;
export const TURN_SEGMENTS_DELAY_MS = 900;

const mediaUrl = (debateId: string, slot: 1 | 2, extension: 'm4a' | 'svg') =>
  `/media/${debateId}-slot${slot}.${extension}`;

function toDebate(mock: MockDebate): Debate {
  return {
    id: mock.id,
    title: mock.title,
    first_participant_slot: mock.first_participant_slot as 1 | 2,
    turn_durations_ms: mock.hasTurnAllowance ? Array.from({ length: mock.turns }, () => mock.turnSeconds * 1000) : null,
    participants: mock.participants.map(participant => ({
      slot: participant.slot as 1 | 2,
      name: participant.name,
      position: participant.position,
      avatarUrl: mediaUrl(mock.id, participant.slot as 1 | 2, 'svg'),
    })),
  };
}

export const DEBATES: Debate[] = mockDebates.map(toDebate);

export function findDebate(debateId: string): Debate | null {
  return DEBATES.find(debate => debate.id === debateId) ?? null;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** The recordings' playable URLs. */
export async function signDebateMedia(debateId: string): Promise<{ slot1: string; slot2: string }> {
  await wait(SIGN_URLS_DELAY_MS);
  return { slot1: mediaUrl(debateId, 1, 'm4a'), slot2: mediaUrl(debateId, 2, 'm4a') };
}

/** Who speaks when. The last segment's end is the debate's length. */
export async function fetchTurnSegments(debateId: string): Promise<DebateMediaTurnSegment[]> {
  await wait(TURN_SEGMENTS_DELAY_MS);
  const mock = mockDebates.find(debate => debate.id === debateId);
  if (!mock) return [];
  return Array.from({ length: mock.turns }, (_, turn) => ({
    slot: (turn % 2 === 0 ? mock.first_participant_slot : 3 - mock.first_participant_slot) as 1 | 2,
    startSeconds: turn * mock.turnSeconds,
    endSeconds: (turn + 1) * mock.turnSeconds,
  }));
}
