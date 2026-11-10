import { normId } from '~/core/utils/norm-id';

/**
 * Debates this browser has watched to the end, so a feed could offer one the viewer has not seen.
 *
 * Per browser rather than per account, in plain `localStorage` behind try/catch.
 */
const STORAGE_KEY = 'debates.watched.v1';

/** Oldest dropped past this. */
const MAX_REMEMBERED = 500;

export function readWatchedDebateIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

export function markDebateWatched(debateId: string): void {
  if (typeof window === 'undefined') return;
  const id = normId(debateId);
  try {
    // Most recent last, so trimming from the front forgets the oldest.
    const ids = [...readWatchedDebateIds()].filter(existing => existing !== id);
    ids.push(id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(-MAX_REMEMBERED)));
  } catch {
    // Quota or private mode: the next recommendation may repeat, which is all this was preventing.
  }
}
