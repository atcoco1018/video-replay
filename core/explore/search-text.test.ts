import { describe, expect, it } from 'vitest';

import { foldText, highlightRanges, matchesAllTokens, searchTokens, splitByRanges } from './search-text';

describe('foldText', () => {
  it('lowercases and drops accents, keeping the length', () => {
    expect(foldText('Café ÉLAN')).toBe('cafe elan');
    expect(foldText('Café ÉLAN')).toHaveLength('Café ÉLAN'.length);
  });

  it('keeps the length for text it cannot fold to one unit', () => {
    const text = 'é 🚗 İ';
    expect(foldText(text)).toHaveLength(text.length);
  });
});

describe('searchTokens', () => {
  it('splits on whitespace, folds, and drops repeats and blanks', () => {
    expect(searchTokens('  Café   cafe  AIR ')).toEqual(['cafe', 'air']);
    expect(searchTokens('   ')).toEqual([]);
  });
});

describe('matchesAllTokens', () => {
  it('needs every token, in any of the texts, in any order', () => {
    expect(matchesAllTokens(['Cleaner air', 'Ada'], ['ada', 'air'])).toBe(true);
    expect(matchesAllTokens(['Cleaner air', 'Ada'], ['ada', 'bus'])).toBe(false);
  });

  it('matches everything with no tokens', () => {
    expect(matchesAllTokens([], [])).toBe(true);
  });

  it('does not match across the gap between two texts', () => {
    expect(matchesAllTokens(['clean', 'air'], ['cleanair'])).toBe(false);
  });
});

describe('highlightRanges', () => {
  it('finds every occurrence, accent-insensitively', () => {
    expect(highlightRanges('Café and cafe', ['cafe'])).toEqual([
      { start: 0, end: 4 },
      { start: 9, end: 13 },
    ]);
  });

  it('merges ranges that overlap or touch', () => {
    expect(highlightRanges('abcdef', ['abcd', 'de'])).toEqual([{ start: 0, end: 5 }]);
    expect(highlightRanges('abcdef', ['abc', 'bcd', 'ef'])).toEqual([{ start: 0, end: 6 }]);
  });

  it('keeps ranges apart when there is text between them', () => {
    expect(highlightRanges('abcdef', ['ab', 'ef'])).toEqual([
      { start: 0, end: 2 },
      { start: 4, end: 6 },
    ]);
  });
});

describe('splitByRanges', () => {
  it('alternates plain and matched parts, covering the whole text', () => {
    const parts = splitByRanges('clean air now', [{ start: 6, end: 9 }]);
    expect(parts).toEqual([
      { text: 'clean ', match: false },
      { text: 'air', match: true },
      { text: ' now', match: false },
    ]);
    expect(parts.map(part => part.text).join('')).toBe('clean air now');
  });

  it('returns the text whole with no ranges', () => {
    expect(splitByRanges('text', [])).toEqual([{ text: 'text', match: false }]);
  });
});
