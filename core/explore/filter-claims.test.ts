import { describe, expect, it } from 'vitest';

import { DEFAULT_EXPLORE_QUERY } from './explore-constants';
import { countByTopic, filterClaims } from './filter-claims';
import { claimFixture } from './testing/claim-fixture';

const air = claimFixture({ text: 'Cleaner air for the café', speakerName: 'Ada', topicSlugs: ['cities', 'health'] });
const bus = claimFixture({ text: 'Buses run on time', speakerName: 'Ben', side: 'against', topicSlugs: ['cities'] });
const remote = claimFixture({
  text: 'Two hours back each day',
  debateId: 'debate-b',
  debateTitle: 'Is remote work better?',
  speakerName: 'Dev',
  topicSlugs: ['work'],
});
const claims = [air, bus, remote];

const query = (change: Partial<typeof DEFAULT_EXPLORE_QUERY>) => ({ ...DEFAULT_EXPLORE_QUERY, ...change });

describe('filterClaims', () => {
  it('keeps everything with the default query', () => {
    expect(filterClaims(claims, DEFAULT_EXPLORE_QUERY)).toEqual(claims);
  });

  it('narrows by topic, debate and side', () => {
    expect(filterClaims(claims, query({ topic: 'health' }))).toEqual([air]);
    expect(filterClaims(claims, query({ debate: 'debate-b' }))).toEqual([remote]);
    expect(filterClaims(claims, query({ side: 'against' }))).toEqual([bus]);
  });

  it('searches the text, the speaker and the debate, ignoring accents and case', () => {
    expect(filterClaims(claims, query({ q: 'CAFE' }))).toEqual([air]);
    expect(filterClaims(claims, query({ q: 'ben' }))).toEqual([bus]);
    expect(filterClaims(claims, query({ q: 'remote' }))).toEqual([remote]);
  });

  it('needs every word searched for', () => {
    expect(filterClaims(claims, query({ q: 'ada air' }))).toEqual([air]);
    expect(filterClaims(claims, query({ q: 'ada buses' }))).toEqual([]);
  });

  it('combines filters', () => {
    expect(filterClaims(claims, query({ topic: 'cities', side: 'for' }))).toEqual([air]);
  });

  it('keeps the order it was given', () => {
    expect(filterClaims([remote, air], DEFAULT_EXPLORE_QUERY)).toEqual([remote, air]);
  });
});

describe('countByTopic', () => {
  it('counts a claim under each of its topics', () => {
    expect(Object.fromEntries(countByTopic(claims))).toEqual({ cities: 2, health: 1, work: 1 });
  });

  it('is empty with no claims', () => {
    expect(countByTopic([]).size).toBe(0);
  });
});
