'use client';

import * as React from 'react';

import Link from 'next/link';

import { DEBATES, type Debate } from '~/core/debates/api';

import { DebateFeedPlayer } from './debate-feed-player';
import { PlayerDebugPanel } from './debug-panels';
import { DEBATE_FEED_HOLDS_FULL_PLAYBACK } from './feed-full-playback';

/** A card this much in view takes playback. */
const ACTIVE_RATIO = 0.6;

/**
 * The feed: one debate card per row, and only one of them holds playback.
 *
 * The card most in view is `active`. A card that is not can ask for playback
 * (`onPlaybackRequest`), and the feed answers by making it active, a render later.
 *
 * Cards are keyed by position, not by debate, as the app's feed keys them by claim: "Re-rank"
 * hands each player a different debate without remounting it. The next card preloads, and a card
 * two or more away releases its media.
 */
export function DebateFeed() {
  const [order, setOrder] = React.useState<Debate[]>(DEBATES);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const cardRefs = React.useRef<Array<HTMLElement | null>>([]);

  React.useEffect(() => {
    const ratios = new Map<number, number>();
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries)
          ratios.set(Number((entry.target as HTMLElement).dataset.index), entry.intersectionRatio);
        let best: number | null = null;
        for (const [index, ratio] of ratios) {
          if (ratio >= ACTIVE_RATIO && (best == null || ratio > (ratios.get(best) ?? 0))) best = index;
        }
        if (best != null) setActiveIndex(best);
      },
      { threshold: [0, 0.25, 0.5, ACTIVE_RATIO, 0.75, 1] }
    );
    for (const card of cardRefs.current) if (card) observer.observe(card);
    return () => observer.disconnect();
  }, [order.length]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => setOrder(current => [...current.slice(1), current[0]])}
          className="rounded-full border border-divider bg-white px-3 py-1.5 shadow-light"
        >
          Re-rank (move each debate up one card)
        </button>
        <span className="text-grey-04">
          {DEBATE_FEED_HOLDS_FULL_PLAYBACK
            ? 'Cards are held until the first Play tap.'
            : 'Cards autoplay muted (hold turned off).'}
        </span>
      </div>
      {order.map((debate, index) => (
        <section
          key={index}
          ref={element => {
            cardRefs.current[index] = element;
          }}
          data-index={index}
          className="grid min-h-[75vh] content-center gap-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">
              <span className="mr-2 text-grey-04">Card {index + 1}</span>
              {debate.title}
            </h2>
            <div className="flex gap-3 text-sm">
              <Link className="underline" href={`/debate/${debate.id}`}>
                Open page
              </Link>
              <Link className="underline" href={`/debate/${debate.id}?t=40`}>
                Open at 0:40
              </Link>
            </div>
          </div>
          <DebateFeedPlayer
            debate={debate}
            active={index === activeIndex}
            preload={index === activeIndex + 1}
            releaseMedia={Math.abs(index - activeIndex) > 1}
            onPlaybackRequest={() => setActiveIndex(index)}
            holdFullPlayback={DEBATE_FEED_HOLDS_FULL_PLAYBACK}
            debugKey={`card-${index}`}
          />
          <PlayerDebugPanel cardKey={`card-${index}`} />
        </section>
      ))}
    </div>
  );
}
