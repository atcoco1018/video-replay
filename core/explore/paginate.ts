/** The first `visibleCount` items, and how many are left for "Show more". */
export function paginate<T>(items: readonly T[], visibleCount: number): { visible: T[]; remaining: number } {
  const count = Math.max(0, Math.floor(visibleCount));
  return { visible: items.slice(0, count), remaining: Math.max(0, items.length - count) };
}

/** How many to show after one more "Show more", capped at what there is. */
export function nextVisibleCount(current: number, pageSize: number, total: number): number {
  return Math.min(total, current + pageSize);
}
