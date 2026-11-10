import { describe, expect, it } from 'vitest';

import { createRandom } from './seeded-random';

describe('createRandom', () => {
  it('gives the same sequence for the same seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    expect(Array.from({ length: 5 }, a.next)).toEqual(Array.from({ length: 5 }, b.next));
  });

  it('gives a different sequence for another seed', () => {
    expect(createRandom(1).next()).not.toBe(createRandom(2).next());
  });

  it('stays in [0, 1)', () => {
    const random = createRandom(7);
    for (let i = 0; i < 1000; i++) {
      const value = random.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('reaches both ends of an int range, and nothing outside it', () => {
    const random = createRandom(3);
    const seen = new Set(Array.from({ length: 500 }, () => random.int(1, 4)));
    expect([...seen].sort()).toEqual([1, 2, 3, 4]);
  });

  it('refuses to pick from nothing', () => {
    expect(() => createRandom(1).pick([])).toThrow();
  });

  it('samples distinct items, at most as many as there are', () => {
    const random = createRandom(9);
    const items = ['a', 'b', 'c', 'd', 'e'];
    const three = random.sample(items, 3);
    expect(new Set(three).size).toBe(3);
    expect(three.every(item => items.includes(item))).toBe(true);
    expect(random.sample(items, Infinity).sort()).toEqual(items);
    expect(items).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});
