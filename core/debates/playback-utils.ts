import type { DebateMediaTurnSegment } from './api';

/** How close to the end counts as the end, so a recording a frame short still finishes. */
export const PLAYBACK_END_EPSILON_SECONDS = 0.25;

export type TurnState = { slot: 1 | 2; seconds: number; progress: number } | null;

export function clampSeconds(value: number, duration: number) {
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(value, safeDuration));
}

export function timelineSecondsForSegments(segments: readonly DebateMediaTurnSegment[]): number {
  return segments.length > 0 ? segments[segments.length - 1].endSeconds : 0;
}

/** Who is speaking at `seconds`, how long their turn has left, and how far through it they are. */
export function turnStateFromSegments(segments: readonly DebateMediaTurnSegment[], seconds: number): TurnState {
  const segment = segments.find(span => seconds >= span.startSeconds && seconds < span.endSeconds);
  if (!segment) return null;
  const length = segment.endSeconds - segment.startSeconds;
  return {
    slot: segment.slot,
    seconds: Math.max(0, segment.endSeconds - seconds),
    progress: length > 0 ? (seconds - segment.startSeconds) / length : 0,
  };
}

export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
