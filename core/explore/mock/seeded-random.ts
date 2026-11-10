/**
 * A small seeded random source (mulberry32). The same seed gives the same sequence everywhere, so
 * mock data generated on the server matches what the browser generates when it hydrates.
 */
export type Random = {
  /** In [0, 1). */
  next: () => number;
  /** An integer in [min, max], both included. */
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  /** `count` distinct items, in random order. */
  sample: <T>(items: readonly T[], count: number) => T[];
};

export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error('pick from an empty list');
    return items[int(0, items.length - 1)];
  };
  const sample = <T>(items: readonly T[], count: number): T[] => {
    const pool = [...items];
    // Fisher-Yates, stopped once `count` are placed at the front.
    const taken = Math.min(count, pool.length);
    for (let i = 0; i < taken; i++) {
      const j = int(i, pool.length - 1);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, taken);
  };
  return { next, int, pick, sample };
}
