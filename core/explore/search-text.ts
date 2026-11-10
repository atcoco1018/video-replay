/**
 * Search that ignores case and accents: "cafe" finds "café". Every word typed must appear somewhere
 * in the claim, its speaker or its debate, in any order.
 */

function foldUnit(unit: string): string {
  const folded = unit
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase();
  return folded.length === 1 ? folded : unit;
}

/**
 * Lowercased, accents dropped. Folded one UTF-16 unit at a time and only where that keeps one unit,
 * so the result is as long as the text and match offsets map straight back onto it.
 */
export function foldText(text: string): string {
  return text.split('').map(foldUnit).join('');
}

/** The words of a search, folded, without repeats. */
export function searchTokens(query: string): string[] {
  return [...new Set(foldText(query).split(/\s+/).filter(Boolean))];
}

export function matchesAllTokens(haystacks: readonly string[], tokens: readonly string[]): boolean {
  if (tokens.length === 0) return true;
  const folded = haystacks.map(foldText).join('\n');
  return tokens.every(token => folded.includes(token));
}

export type TextRange = { start: number; end: number };

/** Where each token appears in `text`, merged where they touch or overlap, in order. */
export function highlightRanges(text: string, tokens: readonly string[]): TextRange[] {
  const folded = foldText(text);
  const ranges: TextRange[] = [];
  for (const token of tokens) {
    for (let from = folded.indexOf(token); from !== -1; from = folded.indexOf(token, from + token.length)) {
      ranges.push({ start: from, end: from + token.length });
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const merged: TextRange[] = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}

/** `text` split into plain and matched parts, for rendering. */
export function splitByRanges(text: string, ranges: readonly TextRange[]): Array<{ text: string; match: boolean }> {
  const parts: Array<{ text: string; match: boolean }> = [];
  let at = 0;
  for (const range of ranges) {
    if (range.start > at) parts.push({ text: text.slice(at, range.start), match: false });
    parts.push({ text: text.slice(range.start, range.end), match: true });
    at = range.end;
  }
  if (at < text.length) parts.push({ text: text.slice(at), match: false });
  return parts;
}
