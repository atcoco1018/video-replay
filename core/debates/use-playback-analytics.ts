'use client';

import * as React from 'react';

import type { Debate } from './api';
import { recordPlayerEvent } from './browse/player-debug';

/**
 * Which controls the viewer used. Sent nowhere: each one is logged to the console and to the
 * event log on the page, so you can see which path a tap took.
 */
export function usePlaybackAnalytics(debate: Debate, active: boolean) {
  const activeRef = React.useRef(active);
  React.useLayoutEffect(() => {
    activeRef.current = active;
  });
  const control = React.useCallback(
    (name: string) => {
      console.info('[playback]', debate.id.slice(0, 6), name, activeRef.current ? '(active)' : '(inactive)');
      recordPlayerEvent(debate.id, `control: ${name}`);
    },
    [debate.id]
  );
  return { control };
}
