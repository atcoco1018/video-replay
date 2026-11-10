import { describe, expect, it } from 'vitest';

import mockDebates from '~/core/debates/mock-debates.json';

import { CLAIMS_PER_DEBATE, MOCK_NOW, MOCK_SEED, MOCK_SPREAD_DAYS } from '../explore-constants';
import { DEBATE_TEMPLATES, TOPICS } from './claim-templates';
import { EXPLORE_CLAIMS, findTopic, generateClaims, turnSlots } from './mock-explore-data';

describe('turnSlots', () => {
  it('opens with the first speaker and alternates', () => {
    expect(turnSlots({ turns: 4, first_participant_slot: 1 })).toEqual([1, 2, 1, 2]);
    expect(turnSlots({ turns: 3, first_participant_slot: 2 })).toEqual([2, 1, 2]);
  });
});

describe('generateClaims', () => {
  it('makes the same claims from the same seed', () => {
    expect(generateClaims(MOCK_SEED)).toEqual(generateClaims(MOCK_SEED));
    expect(generateClaims(MOCK_SEED + 1)).not.toEqual(generateClaims(MOCK_SEED));
  });

  it('makes the set number per debate, with unique ids and texts', () => {
    expect(EXPLORE_CLAIMS).toHaveLength(mockDebates.length * CLAIMS_PER_DEBATE);
    expect(new Set(EXPLORE_CLAIMS.map(claim => claim.id)).size).toBe(EXPLORE_CLAIMS.length);
    expect(new Set(EXPLORE_CLAIMS.map(claim => claim.text)).size).toBe(EXPLORE_CLAIMS.length);
  });

  it("places each claim inside one of its speaker's own turns, clear of the hand-overs", () => {
    for (const claim of EXPLORE_CLAIMS) {
      const debate = mockDebates.find(item => item.id === claim.debateId)!;
      const turn = Math.floor(claim.seconds / debate.turnSeconds);
      expect(turnSlots(debate)[turn]).toBe(claim.speakerSlot);
      const intoTurn = claim.seconds - turn * debate.turnSeconds;
      expect(intoTurn).toBeGreaterThanOrEqual(2);
      expect(intoTurn).toBeLessThan(debate.turnSeconds - 2);
    }
  });

  it("gives each claim its speaker's name and side", () => {
    for (const claim of EXPLORE_CLAIMS) {
      const speaker = mockDebates
        .find(item => item.id === claim.debateId)!
        .participants.find(participant => participant.slot === claim.speakerSlot)!;
      expect(claim.speakerName).toBe(speaker.name);
      expect(claim.side).toBe(speaker.position.toLowerCase());
    }
  });

  it("files each claim under one or two of its debate's topics, all of them known", () => {
    for (const claim of EXPLORE_CLAIMS) {
      expect(claim.topicSlugs.length).toBeGreaterThanOrEqual(1);
      expect(claim.topicSlugs.length).toBeLessThanOrEqual(2);
      for (const slug of claim.topicSlugs) {
        expect(DEBATE_TEMPLATES[claim.debateId].topicSlugs).toContain(slug);
        expect(findTopic(slug)).not.toBeNull();
      }
    }
  });

  it('dates every claim within the spread before the fixed now', () => {
    for (const claim of EXPLORE_CLAIMS) {
      expect(claim.createdAt).toBeLessThanOrEqual(MOCK_NOW);
      expect(claim.createdAt).toBeGreaterThanOrEqual(MOCK_NOW - MOCK_SPREAD_DAYS * 86_400_000);
    }
  });

  it('stops early rather than repeat a sentence', () => {
    const claims = generateClaims(MOCK_SEED, 500);
    expect(new Set(claims.map(claim => claim.text)).size).toBe(claims.length);
  });
});

describe('findTopic', () => {
  it('finds a topic by slug, and nothing for an unknown one', () => {
    expect(findTopic(TOPICS[0].slug)).toEqual(TOPICS[0]);
    expect(findTopic('nope')).toBeNull();
  });
});
