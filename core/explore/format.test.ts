import { describe, expect, it } from 'vitest';

import { agreePercent, formatCount, formatDate, formatTimecode, pluralize } from './format';

describe('formatTimecode', () => {
  it.each([
    [0, '0:00'],
    [7, '0:07'],
    [112, '1:52'],
    [112.9, '1:52'],
    [3723, '1:02:03'],
    [-4, '0:00'],
  ])('%s seconds is %s', (seconds, expected) => {
    expect(formatTimecode(seconds)).toBe(expected);
  });
});

describe('formatCount', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1000, '1k'],
    [1234, '1.2k'],
    [12_345, '12k'],
    [1_500_000, '1.5M'],
    [-3, '0'],
  ])('%s is %s', (count, expected) => {
    expect(formatCount(count)).toBe(expected);
  });
});

describe('formatDate', () => {
  it('prints the UTC date, whatever the local zone', () => {
    expect(formatDate(Date.UTC(2026, 10, 3, 23, 30))).toBe('Nov 3, 2026');
  });
});

describe('pluralize', () => {
  it('uses the singular for one only', () => {
    expect(pluralize(1, 'claim')).toBe('1 claim');
    expect(pluralize(0, 'claim')).toBe('0 claims');
    expect(pluralize(2, 'person', 'people')).toBe('2 people');
  });
});

describe('agreePercent', () => {
  it('rounds the share that agrees', () => {
    expect(agreePercent(2, 1)).toBe(67);
    expect(agreePercent(0, 4)).toBe(0);
  });

  it('is null with no votes', () => {
    expect(agreePercent(0, 0)).toBeNull();
  });
});
