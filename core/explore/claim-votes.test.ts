import { act, renderHook } from '@testing-library/react';

import { afterEach, describe, expect, it } from 'vitest';

import { castVote, parseVotes, useClaimVotes, withOwnVote } from './claim-votes';
import { CLAIM_VOTES_STORAGE_KEY } from './explore-constants';

afterEach(() => window.localStorage.clear());

describe('parseVotes', () => {
  it('keeps only agree and disagree', () => {
    expect(parseVotes({ a: 'agree', b: 'disagree', c: 'maybe', d: 1 })).toEqual({ a: 'agree', b: 'disagree' });
  });

  it('is empty for anything but an object', () => {
    expect(parseVotes(['agree'])).toEqual({});
    expect(parseVotes('agree')).toEqual({});
    expect(parseVotes(null)).toEqual({});
  });
});

describe('castVote', () => {
  it('casts, switches and takes back', () => {
    const cast = castVote({}, 'a', 'agree');
    expect(cast).toEqual({ a: 'agree' });
    expect(castVote(cast, 'a', 'disagree')).toEqual({ a: 'disagree' });
    expect(castVote(cast, 'a', 'agree')).toEqual({});
  });

  it('leaves the votes it was given alone', () => {
    const votes = { a: 'agree' as const };
    castVote(votes, 'a', 'agree');
    expect(votes).toEqual({ a: 'agree' });
  });
});

describe('withOwnVote', () => {
  const claim = { agree: 4, disagree: 2 };

  it("adds this browser's vote to the matching count", () => {
    expect(withOwnVote(claim, 'agree')).toEqual({ agree: 5, disagree: 2 });
    expect(withOwnVote(claim, 'disagree')).toEqual({ agree: 4, disagree: 3 });
  });

  it('returns the same claim with no vote', () => {
    expect(withOwnVote(claim, undefined)).toBe(claim);
  });
});

describe('useClaimVotes', () => {
  it('saves votes for the next visit', () => {
    const { result } = renderHook(() => useClaimVotes());
    act(() => result.current.vote('claim-1', 'disagree'));
    expect(result.current.votes).toEqual({ 'claim-1': 'disagree' });
    expect(JSON.parse(window.localStorage.getItem(CLAIM_VOTES_STORAGE_KEY)!)).toEqual({ 'claim-1': 'disagree' });
  });
});
