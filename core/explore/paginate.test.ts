import { describe, expect, it } from 'vitest';

import { nextVisibleCount, paginate } from './paginate';

describe('paginate', () => {
  const items = [1, 2, 3, 4, 5];

  it('shows the first page and counts the rest', () => {
    expect(paginate(items, 2)).toEqual({ visible: [1, 2], remaining: 3 });
  });

  it('shows everything when the page is bigger than the list', () => {
    expect(paginate(items, 10)).toEqual({ visible: items, remaining: 0 });
  });

  it('treats a negative or fractional count sensibly', () => {
    expect(paginate(items, -1)).toEqual({ visible: [], remaining: 5 });
    expect(paginate(items, 2.7)).toEqual({ visible: [1, 2], remaining: 3 });
  });
});

describe('nextVisibleCount', () => {
  it('adds a page, capped at the total', () => {
    expect(nextVisibleCount(12, 12, 30)).toBe(24);
    expect(nextVisibleCount(24, 12, 30)).toBe(30);
  });
});
