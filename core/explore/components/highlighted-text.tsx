import { highlightRanges, splitByRanges } from '../search-text';

/** `text` with every searched word marked. */
export function HighlightedText({ text, tokens }: { text: string; tokens: readonly string[] }) {
  if (tokens.length === 0) return <>{text}</>;
  return (
    <>
      {splitByRanges(text, highlightRanges(text, tokens)).map((part, index) =>
        part.match ? (
          <mark key={index} className="rounded-sm bg-yellow-200 px-0.5 text-text">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}
