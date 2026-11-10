/** 0:07, 1:52, 1:02:03. */
export function formatTimecode(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** 999, 1.2k, 12k, 1.5M. */
export function formatCount(count: number): string {
  const n = Math.max(0, Math.round(count));
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k < 10 ? Number(k.toFixed(1)) : Math.round(k)}k`;
  }
  const m = n / 1_000_000;
  return `${m < 10 ? Number(m.toFixed(1)) : Math.round(m)}M`;
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * "Nov 3, 2026". In UTC rather than the viewer's zone, so the server and the browser print the same
 * date and hydration does not mismatch.
 */
export function formatDate(timestamp: number): string {
  return DATE_FORMAT.format(timestamp);
}

/** "1 claim", "12 claims". */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** The share of votes that agree, as a whole percentage, or null with no votes. */
export function agreePercent(agree: number, disagree: number): number | null {
  const total = agree + disagree;
  return total > 0 ? Math.round((agree / total) * 100) : null;
}
