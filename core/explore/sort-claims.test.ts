import { describe, expect, it } from 'vitest';

import { claimDivision, claimScore, sortClaims } from './sort-claims';
import { claimFixture } from './testing/claim-fixture';

const ids = (claims: Array<{ id: string }>) => claims.map(claim => claim.id);

describe('claimScore and claimDivision', () => {
  it('scores agreement minus disagreement', () => {
    expect(claimScore({ agree: 30, disagree: 10 })).toBe(20);
  });

  it('rates an even split above a lopsided one', () => {
    expect(claimDivision({ agree: 100, disagree: 100 })).toBe(200);
    expect(claimDivision({ agree: 300, disagree: 10 })).toBe(20);
  });
});

describe('sortClaims', () => {
  const day = 86_400_000;
  const a = claimFixture({ id: 'a', agree: 50, disagree: 0, createdAt: 3 * day, debateId: 'd1', seconds: 40 });
  const b = claimFixture({ id: 'b', agree: 100, disagree: 90, createdAt: 1 * day, debateId: 'd2', seconds: 5 });
  const c = claimFixture({ id: 'c', agree: 20, disagree: 10, createdAt: 2 * day, debateId: 'd1', seconds: 10 });

  it('puts the best-scored first for top', () => {
    expect(ids(sortClaims([b, c, a], 'top'))).toEqual(['a', 'c', 'b']);
  });

  it('puts the most recent first for newest', () => {
    expect(ids(sortClaims([b, c, a], 'newest'))).toEqual(['a', 'c', 'b']);
    expect(ids(sortClaims([a, b, c], 'newest'))).toEqual(['a', 'c', 'b']);
  });

  it('keeps debates in the order they first appear, and each in time order', () => {
    expect(ids(sortClaims([a, b, c], 'debate'))).toEqual(['c', 'a', 'b']);
    expect(ids(sortClaims([b, a, c], 'debate'))).toEqual(['b', 'c', 'a']);
  });

  it('puts the most evenly split first for split', () => {
    expect(ids(sortClaims([a, b, c], 'split'))).toEqual(['b', 'c', 'a']);
  });

  it('breaks ties by id, whatever order it was given', () => {
    const x = claimFixture({ id: 'x', agree: 5, disagree: 5, createdAt: day });
    const y = claimFixture({ id: 'y', agree: 5, disagree: 5, createdAt: day });
    expect(ids(sortClaims([y, x], 'top'))).toEqual(['x', 'y']);
    expect(ids(sortClaims([x, y], 'top'))).toEqual(['x', 'y']);
  });

  it('returns a copy', () => {
    const input = [b, a];
    sortClaims(input, 'top');
    expect(ids(input)).toEqual(['b', 'a']);
  });
});
