'use client';

import * as React from 'react';

/** The element can play from where it is without stalling at once (HTMLMediaElement.HAVE_FUTURE_DATA). */
const CAN_PLAY = 3;

/**
 * Both recordings, held until both can play.
 *
 * Starting one element that can play beside one that cannot is what makes the panels arrive one at
 * a time. The hold is for autoplay only: a viewer pressing play has chosen not to wait, and
 * `release()` lets the pair go.
 *
 * Re-armed for every `pairKey`, which changes with the debate and with each re-attach of the
 * elements.
 */
export function usePairReadiness({
  pairKey,
  slot1Ref,
  slot2Ref,
  slot1Src,
  slot2Src,
}: {
  pairKey: string;
  slot1Ref: React.RefObject<HTMLVideoElement | null>;
  slot2Ref: React.RefObject<HTMLVideoElement | null>;
  slot1Src: string | null;
  slot2Src: string | null;
}) {
  const [state, setState] = React.useState({ pairKey, slot1: false, slot2: false, released: false });
  const current = state.pairKey === pairKey ? state : { pairKey, slot1: false, slot2: false, released: false };
  if (current !== state) setState(current);

  React.useEffect(() => {
    const cleanups: Array<() => void> = [];
    for (const [slot, ref, src] of [
      ['slot1', slot1Ref, slot1Src],
      ['slot2', slot2Ref, slot2Src],
    ] as const) {
      const element = ref.current;
      if (!element || !src) continue;
      const mark = () =>
        setState(previous => (previous.pairKey === pairKey ? { ...previous, [slot]: true } : previous));
      if (element.readyState >= CAN_PLAY) mark();
      element.addEventListener('canplay', mark);
      cleanups.push(() => element.removeEventListener('canplay', mark));
    }
    return () => cleanups.forEach(cleanup => cleanup());
  }, [pairKey, slot1Ref, slot1Src, slot2Ref, slot2Src]);

  const bothCanPlay = current.slot1 && current.slot2;
  const mayStart = bothCanPlay || current.released;
  // The render above has already re-keyed the state by the time a control can call this.
  const release = React.useCallback(() => setState(previous => ({ ...previous, released: true })), []);
  return { mayStart, mayShow: mayStart, holding: !mayStart, release };
}
