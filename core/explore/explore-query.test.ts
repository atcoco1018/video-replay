import { describe, expect, it } from 'vitest';

import { DEFAULT_EXPLORE_QUERY } from './explore-constants';
import { isFiltered, parseExploreQuery, serializeExploreQuery } from './explore-query';

const known = { topics: new Set(['cities', 'work']), debates: new Set(['debate-a']) };
const parse = (search: string) => parseExploreQuery(new URLSearchParams(search), known);

describe('parseExploreQuery', () => {
  it('reads the default from an empty URL', () => {
    expect(parse('')).toEqual(DEFAULT_EXPLORE_QUERY);
  });

  it('reads every part', () => {
    expect(parse('q=clean+air&topic=cities&debate=debate-a&side=against&sort=newest')).toEqual({
      q: 'clean air',
      topic: 'cities',
      debate: 'debate-a',
      side: 'against',
      sort: 'newest',
    });
  });

  it('falls back to the default for anything it does not know', () => {
    expect(parse('topic=gone&debate=gone&side=both&sort=random')).toEqual(DEFAULT_EXPLORE_QUERY);
  });

  it('trims the search', () => {
    expect(parse('q=%20%20air%20').q).toBe('air');
  });
});

describe('serializeExploreQuery', () => {
  it('is empty for the default', () => {
    expect(serializeExploreQuery(DEFAULT_EXPLORE_QUERY)).toBe('');
  });

  it('leaves out the parts at their default', () => {
    expect(serializeExploreQuery({ ...DEFAULT_EXPLORE_QUERY, topic: 'work', sort: 'split' })).toBe(
      'topic=work&sort=split'
    );
  });

  it('round-trips through parse', () => {
    const query = { q: 'café bus', topic: 'cities', debate: 'debate-a', side: 'for' as const, sort: 'debate' as const };
    expect(parse(serializeExploreQuery(query))).toEqual(query);
  });

  it('drops a search that is only spaces', () => {
    expect(serializeExploreQuery({ ...DEFAULT_EXPLORE_QUERY, q: '   ' })).toBe('');
  });
});

describe('isFiltered', () => {
  it('is false for the default, and for a sort alone', () => {
    expect(isFiltered(DEFAULT_EXPLORE_QUERY)).toBe(false);
    expect(isFiltered({ ...DEFAULT_EXPLORE_QUERY, sort: 'newest' })).toBe(false);
  });

  it('is true for any filter', () => {
    expect(isFiltered({ ...DEFAULT_EXPLORE_QUERY, q: 'air' })).toBe(true);
    expect(isFiltered({ ...DEFAULT_EXPLORE_QUERY, topic: 'work' })).toBe(true);
    expect(isFiltered({ ...DEFAULT_EXPLORE_QUERY, debate: 'debate-a' })).toBe(true);
    expect(isFiltered({ ...DEFAULT_EXPLORE_QUERY, side: 'for' })).toBe(true);
  });
});
