import { atom } from 'jotai';

/**
 * The feed attaches no full recording until the viewer starts one.
 *
 * A held card shows the stills and a Play control, and neither autoplays nor buffers. The first tap
 * on any held card lifts the hold for every player in the tab. Set
 * `NEXT_PUBLIC_DEBATE_FEED_FULL_AUTOPLAY=1` to turn the hold off.
 */
export const DEBATE_FEED_HOLDS_FULL_PLAYBACK = process.env.NEXT_PUBLIC_DEBATE_FEED_FULL_AUTOPLAY !== '1';

export const feedFullPlaybackStartedAtom = atom(false);
