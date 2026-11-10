/**
 * Normalizes an id for set / map keying: strips hyphens and lowercases, so a UUID-formatted id and
 * the same id in lowercase hex compare equal.
 */
export function normId(id: string): string {
  return id.replaceAll('-', '').toLowerCase();
}
