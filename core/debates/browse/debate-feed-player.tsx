'use client';

import * as React from 'react';

import cx from 'classnames';
import { useAtom } from 'jotai';

import type { Debate, DebateParticipant } from '~/core/debates/api';
import {
  forgetDebatePosition,
  readDebateResumeSeconds,
  useRememberDebatePosition,
} from '~/core/debates/debate-resume-positions';
import { usePairReadiness } from '~/core/debates/pair-readiness';
import { type TurnState, formatClock } from '~/core/debates/playback-utils';
import { useDebatePlayback } from '~/core/debates/use-debate-playback';
import { usePlaybackAnalytics } from '~/core/debates/use-playback-analytics';
import { markDebateWatched } from '~/core/debates/watched-debates';

import { DebateEndCard } from './debate-end-card';
import { feedFullPlaybackStartedAtom } from './feed-full-playback';
import { Pause, Play, RetrySmall, Speaker, SpeakerMuted } from './icons';
import { recordPlayerEvent, reportPlayerState } from './player-debug';

type DebateFeedPlayerProps = {
  debate: Debate;
  /** This card holds playback. In a feed only one card does; the rest are paused. */
  active: boolean;
  /** Load the recordings without playing them, for the card about to be reached. */
  preload?: boolean;
  /** Mount no <video> elements, for a card far from the viewport. */
  releaseMedia?: boolean;
  /** Leave out the end card, for a compact tile. */
  reducedOverlays?: boolean;
  /** This card asks the feed for playback; the feed answers by making it `active`. */
  onPlaybackRequest?: () => void;
  /** A moment the link that brought the reader here named (`?t=`). */
  initialSeekSeconds?: number | null;
  /** Attach no full recording until the viewer starts one. See `feed-full-playback.ts`. */
  holdFullPlayback?: boolean;
  /** Test-project only: the name this card reports under in the debug panel. */
  debugKey?: string;
};

const CENTERED_PLAYBACK_CONTROL_CLASS =
  'absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white';

export function DebateFeedPlayer({
  debate,
  active,
  preload = false,
  releaseMedia = false,
  reducedOverlays = false,
  onPlaybackRequest,
  initialSeekSeconds = null,
  holdFullPlayback = false,
  debugKey,
}: DebateFeedPlayerProps) {
  const [fullPlaybackStarted, setFullPlaybackStarted] = useAtom(feedFullPlaybackStartedAtom);
  // Which debate the viewer started on this card. The app keys its preview clips on it; this project
  // has none, so it is only written.
  const [, setStartedDebateId] = React.useState<string | null>(null);
  const held = holdFullPlayback && !fullPlaybackStarted;
  // Loading is deliberately wider than playing: a preloading card fetches without autoplaying
  // off-screen. Playback is driven by `active` in the effect below.
  const controller = useDebatePlayback(debate, active || preload);
  // What the <video> elements actually hold: a released card, or a held one, has none.
  const detached = releaseMedia || held;
  const measurement = usePlaybackAnalytics(debate, active);
  const {
    slot1VideoRef,
    slot2VideoRef,
    slot1Participant,
    slot2Participant,
    slot1Poster,
    slot2Poster,
    urls,
    ready,
    playing,
    userPaused,
    autoplayBlocked,
    isScrubbing,
    isResuming,
    playbackEnded,
    mutedByUser,
    setMutedByUser,
    playheadSeconds,
    timelineSeconds,
    turnState,
    onPlaybackTick,
    onMediaLoaded,
    togglePlayback: togglePlaybackRaw,
    playFromStart: playFromStartRaw,
    resumeBoth,
    suspend,
    seekBoth: seekBothRaw,
    beginScrub,
    endScrub,
  } = controller;
  // Bumped by every seek, so the turn timer restarts its animation from the new position.
  const [animationSeekGeneration, resetAnimationSeek] = React.useReducer((generation: number) => generation + 1, 0);
  const animationSeekKey = `${debate.id}:${animationSeekGeneration}`;
  /*
   * Both recordings, held until both can play. See `pair-readiness.ts`.
   *
   * Keyed on the debate, not the card: the feed keys its cards by position, so a re-rank hands this
   * same player a different debate, and that debate's pair has to be held on its own terms.
   */
  const slot1Src = detached ? null : urls.slot1;
  const slot2Src = detached ? null : urls.slot2;
  // Each re-attach brings new elements, so the hold re-arms for them. Derived during render so the
  // hold is in place before the autoplay effect sees the re-attached pair.
  const [attachment, setAttachment] = React.useState({ detached, generation: 0 });
  if (attachment.detached !== detached) {
    setAttachment({ detached, generation: detached ? attachment.generation : attachment.generation + 1 });
  }
  const pair = usePairReadiness({
    pairKey: `${debate.id}:${attachment.generation}`,
    slot1Ref: slot1VideoRef,
    slot2Ref: slot2VideoRef,
    slot1Src,
    slot2Src,
  });
  // The hold is for autoplay. A viewer pressing play has chosen not to wait, so every control that
  // starts playback lets the pair go first.
  const togglePlayback = () => {
    measurement.control(playing ? 'pause' : playbackEnded ? 'replay' : 'play');
    if (playbackEnded) resetAnimationSeek();
    if (!playing) {
      setFullPlaybackStarted(true);
      setStartedDebateId(debate.id);
    }
    pair.release();
    togglePlaybackRaw();
  };
  /**
   * The viewer asking to watch a held card.
   *
   * Lifting the hold is all it takes: the recordings attach, the pair waits until both can play,
   * and the autoplay effect starts them muted, as on any card before the hold.
   */
  const startFullPlayback = () => {
    measurement.control('play');
    setFullPlaybackStarted(true);
    setStartedDebateId(debate.id);
    if (!active) onPlaybackRequest?.();
  };
  const playFromStart = (control: 'replay' | 'start_over' = 'replay') => {
    measurement.control(control);
    resetAnimationSeek();
    setStartOverId(null);
    forgetDebatePosition(debate.id);
    pair.release();
    void playFromStartRaw();
  };
  const seekBoth = (seconds: number) => {
    measurement.control('seek');
    resetAnimationSeek();
    seekBothRaw(seconds);
  };

  /**
   * Honour a link that named a moment, once per moment.
   *
   * Waits for `ready` rather than firing on mount: before the media is seekable the request would
   * be dropped, and this is the arriving reader's one chance to land where they were sent. Latched so
   * that re-renders, a re-activation, or the viewer scrolling back to this card cannot yank the
   * playhead back to where the link pointed after they have moved it themselves.
   *
   * Latched on the debate *and* the moment, not the debate alone. Two claims extracted from the same
   * debate carry two timecodes, and following one after the other is a client-side navigation that
   * changes `initialSeekSeconds` without remounting this card — which the id-only latch swallowed, so
   * the second timecode did nothing at all.
   *
   * Not routed through the measured `seekBoth` above: this is a seek the reader asked for on the
   * previous page, not a scrub performed on this player, and counting it as one would report a
   * control interaction nobody made here.
   */
  const appliedInitialSeekRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    // No moment asked for means the last one has been let go. Without this the latch outlived the
    // request that set it: `?t=124`, then the parameter dropped, then `?t=124` again — browser Back
    // does exactly that — matched the stale latch and never seeked, though it was a new navigation
    // asking for that moment. Only a missing timecode clears it; a render that is merely not ready
    // yet keeps it, so the same request still cannot fire twice.
    if (initialSeekSeconds == null) {
      appliedInitialSeekRef.current = null;
      return;
    }
    if (!ready) return;
    const request = `${debate.id}@${initialSeekSeconds}`;
    if (appliedInitialSeekRef.current === request) return;
    appliedInitialSeekRef.current = request;
    resetAnimationSeek();
    seekBothRaw(initialSeekSeconds);
  }, [debate.id, initialSeekSeconds, ready, seekBothRaw]);

  /**
   * Pick up where this browser's viewer stopped, once per debate.
   *
   * Read when the player first holds the debate and kept: the position is rewritten as the debate
   * plays, and following it would seek the viewer back to their own last save. A link that named a
   * moment wins, and is not followed by a resume once it is dropped (browser Back), which the
   * `?t=` latch alone would allow.
   *
   * Waits for the elements as well as `ready`, so the seek lands on them rather than waiting as a
   * pending seek on a held card. Waits for the debate's length too: a seek is capped at it, so
   * before it is known the resume would land at 0. Placed before the autoplay effect, which runs in the same commit:
   * the pair starts from here, not from the top.
   */
  const [resume, setResume] = React.useState(() => ({
    debateId: debate.id,
    seconds: readDebateResumeSeconds(debate.id),
  }));
  const currentResume =
    resume.debateId === debate.id ? resume : { debateId: debate.id, seconds: readDebateResumeSeconds(debate.id) };
  if (currentResume !== resume) setResume(currentResume);
  const resumeSeconds = currentResume.seconds;
  const [resumeSettledId, setResumeSettledId] = React.useState<string | null>(null);

  const [startOverId, setStartOverId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (resumeSettledId === debate.id) return;
    if (initialSeekSeconds == null && resumeSeconds != null) {
      if (!ready || detached || timelineSeconds <= 0) return;
      resetAnimationSeek();
      seekBothRaw(resumeSeconds);
      setStartOverId(debate.id);
    }
    setResumeSettledId(debate.id);
  }, [debate.id, detached, initialSeekSeconds, ready, resumeSeconds, resumeSettledId, seekBothRaw, timelineSeconds]);
  useRememberDebatePosition({
    debateId: debate.id,
    playheadSeconds,
    timelineSeconds,
    recording: active && ready && playing && !isScrubbing && resumeSettledId === debate.id,
  });

  /**
   * Stopped, and only a tap will start it.
   *
   * The two ways in are different facts — the viewer paused, or the browser
   * refused — and identical from here: the video is not running and the control
   * is the only answer either accepts.
   */
  const awaitingTap = userPaused || autoplayBlocked;

  // Autoplay the debate that's in view; pause the rest. Respect an explicit
  // user pause so scrolling back doesn't fight the viewer, and don't resume
  // mid-scrub.
  //
  // And not before the pair has been let go: starting one element that can play beside
  // one that cannot is what made the panels arrive one at a time.
  const pairMayStart = pair.mayStart;
  React.useEffect(() => {
    if (!ready) return;
    // A refusal is not retried: the browser gives the same answer every time, and
    // only the viewer's tap is a gesture it will accept.
    // A detached pair has no elements to start; this re-runs when they arrive.
    if (active && !detached && pairMayStart && !awaitingTap && !isScrubbing && !playing && !playbackEnded) {
      void resumeBoth();
    } else if (!active && playing) {
      suspend();
    }
  }, [active, awaitingTap, detached, isScrubbing, pairMayStart, playbackEnded, playing, ready, resumeBoth, suspend]);

  // A resume still confirming when the card goes inactive or loses its media is retired, since its
  // elements may be released. Read through a ref so a resume settling doesn't re-run autoplay.
  const isResumingRef = React.useRef(isResuming);
  isResumingRef.current = isResuming;
  React.useEffect(() => {
    if ((!active || detached) && isResumingRef.current) suspend();
  }, [active, detached, suspend]);

  const showReplay = ready && playbackEnded;
  // A compact tile shows the centred replay control instead of the end card.
  const endCardShown = showReplay && !reducedOverlays;

  // Watched to the end, whichever layout it ended in — a compact tile never shows the end card, and
  // a debate finished there must not come back as a suggestion.
  // Finished, too, is where a resume stops: the next visit opens at the beginning.
  React.useEffect(() => {
    if (!showReplay) return;
    markDebateWatched(debate.id);
    forgetDebatePosition(debate.id);
  }, [showReplay, debate.id]);

  /*
   * Replay from the end card, or Start over on a resumed debate, held until this player may play.
   *
   * In a row of cards only one holds playback, and pressing Replay on another first hands playback
   * over — which `active` reports a render later. Playing at once would run this debate beside the
   * one still holding playback; dropping the press made Replay take two taps, because an ended
   * debate does not resume by itself once it is handed playback. So the press asks for playback,
   * is kept, and is carried out the moment playback arrives. A Replay lapses if the debate stops
   * being ended in the meantime; a Start over if it ends, or the card moves to another debate.
   */
  const [restartPending, setRestartPending] = React.useState<'replay' | 'start_over' | null>(null);
  const restartWhenActive = (control: 'replay' | 'start_over') => {
    if (active) {
      playFromStart(control);
      return;
    }
    setRestartPending(control);
    onPlaybackRequest?.();
  };
  const replayFromEndCard = () => restartWhenActive('replay');
  // An effect event, so the effect runs on the facts that decide it rather than on every render
  // for a `playFromStart` that is a fresh function each time.
  const restartNow = React.useEffectEvent((control: 'replay' | 'start_over') => playFromStart(control));
  const startOverOffered = startOverId === debate.id;
  React.useEffect(() => {
    if (restartPending == null) return;
    const lapsed = restartPending === 'replay' ? !playbackEnded : playbackEnded || !startOverOffered;
    if (lapsed) {
      setRestartPending(null);
      return;
    }
    if (!active) return;
    setRestartPending(null);
    restartNow(restartPending);
  }, [active, playbackEnded, restartPending, startOverOffered]);
  // An ended debate always offers a replay; a stopped one shows the paused glyph.
  const showPausedGlyph = ready && awaitingTap && !playbackEnded && !held;

  // A tap on the video: play or pause. A card that is not active asks for playback first.
  const toggleFromVideo = () => {
    if (!ready || held || showReplay) return;
    if (!active) {
      onPlaybackRequest?.();
      return;
    }
    togglePlayback();
  };

  // Test-project only: what the debug panel under the card shows.
  React.useEffect(() => {
    reportPlayerState(debugKey ?? debate.id, {
      debate: debate.id.slice(0, 8),
      active,
      held,
      detached,
      ready,
      timelineSeconds,
      playheadSeconds: Math.round(playheadSeconds * 10) / 10,
      playing,
      userPaused,
      autoplayBlocked,
      playbackEnded,
      pairMayStart,
      restartPending,
      initialSeekSeconds,
    });
  });
  const previousReady = React.useRef(ready);
  React.useEffect(() => {
    if (ready && !previousReady.current) recordPlayerEvent(debate.id, 'ready (URLs signed)');
    previousReady.current = ready;
  }, [debate.id, ready]);
  const previousTimeline = React.useRef(timelineSeconds);
  React.useEffect(() => {
    if (timelineSeconds > 0 && previousTimeline.current <= 0)
      recordPlayerEvent(debate.id, `timeline known: ${timelineSeconds}s`);
    previousTimeline.current = timelineSeconds;
  }, [debate.id, timelineSeconds]);

  return (
    <div className="group relative w-full overflow-hidden rounded-xl bg-black select-none">
      <div className="grid aspect-[16/9] grid-cols-2 gap-px">
        <DebaterVideo
          slot={1}
          inert={endCardShown}
          participant={slot1Participant}
          src={slot1Src}
          poster={slot1Poster}
          videoRef={slot1VideoRef}
          concealed={!pair.mayShow}
          audible={!mutedByUser && turnState?.slot === 1}
          countdown={playing && turnState?.slot === 1 ? turnState : null}
          countdownKey={animationSeekKey}
          onPlaybackTick={onPlaybackTick}
          onMediaLoaded={onMediaLoaded}
          onToggle={toggleFromVideo}
          // Not on a held card: there is nothing to pause, and an unmute there would have no element
          // to make audible inside the tap.
          topLeft={
            ready && !playbackEnded && !held ? (
              <div className="flex items-center gap-2">
                <ControlCircle
                  ariaLabel={playing ? 'Pause debate' : 'Play debate'}
                  onClick={() => {
                    if (!active) {
                      onPlaybackRequest?.();
                      return;
                    }
                    togglePlayback();
                  }}
                >
                  {playing ? <Pause /> : <Play />}
                </ControlCircle>
                {/* Feed debates autoplay muted, so the unmute control stays visible during
                  playback — otherwise there's no way to hear audio. */}
                <ControlCircle
                  ariaLabel={mutedByUser ? 'Unmute' : 'Mute'}
                  onClick={() => {
                    measurement.control(mutedByUser ? 'unmute' : 'mute');
                    setMutedByUser(current => !current);
                  }}
                >
                  {mutedByUser ? <SpeakerMuted /> : <Speaker />}
                </ControlCircle>
                {startOverOffered && (
                  <button
                    type="button"
                    onClick={event => {
                      event.stopPropagation();
                      restartWhenActive('start_over');
                    }}
                    className="flex h-10.5 items-center gap-1 rounded-full bg-white px-3 text-smallButton text-text shadow-light"
                  >
                    <RetrySmall />
                    Start over
                  </button>
                )}
              </div>
            ) : null
          }
        />
        <DebaterVideo
          slot={2}
          inert={endCardShown}
          participant={slot2Participant}
          src={slot2Src}
          poster={slot2Poster}
          videoRef={slot2VideoRef}
          concealed={!pair.mayShow}
          audible={!mutedByUser && turnState?.slot === 2}
          countdown={playing && turnState?.slot === 2 ? turnState : null}
          countdownKey={animationSeekKey}
          onPlaybackTick={() => {}}
          onMediaLoaded={onMediaLoaded}
          onToggle={toggleFromVideo}
        />
      </div>

      {/* The replay and resume states are mutually exclusive, so they share one centered control. */}
      {((showReplay && !endCardShown) || showPausedGlyph) && (
        <button
          type="button"
          aria-label={showReplay ? 'Replay debate' : 'Resume debate'}
          onClick={showReplay ? () => playFromStart() : togglePlayback}
          className={cx(CENTERED_PLAYBACK_CONTROL_CLASS, 'z-30 grid', showReplay && '[&>svg]:scale-[2]')}
        >
          {showReplay ? <RetrySmall /> : <Play />}
        </button>
      )}

      {/* A held card's one control: nothing plays until it is pressed. */}
      {held && (
        <button
          type="button"
          aria-label="Play debate"
          onClick={startFullPlayback}
          className={cx(CENTERED_PLAYBACK_CONTROL_CLASS, 'z-30 grid')}
        >
          <Play />
        </button>
      )}

      {endCardShown && <DebateEndCard title={debate.title} onReplay={replayFromEndCard} />}

      {ready && !held && (
        <Scrubber
          playheadSeconds={playheadSeconds}
          timelineSeconds={timelineSeconds}
          onBegin={beginScrub}
          onSeek={seekBoth}
          onEnd={endScrub}
        />
      )}
    </div>
  );
}

function DebaterVideo({
  slot,
  inert,
  participant,
  src,
  poster,
  videoRef,
  concealed,
  audible,
  countdown,
  countdownKey,
  onPlaybackTick,
  onMediaLoaded,
  onToggle,
  topLeft,
}: {
  slot: 1 | 2;
  inert: boolean;
  participant: DebateParticipant | null;
  src: string | null;
  poster: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  concealed: boolean;
  audible: boolean;
  countdown: TurnState;
  countdownKey: string;
  onPlaybackTick: () => void;
  onMediaLoaded: () => void;
  onToggle: () => void;
  topLeft?: React.ReactNode;
}) {
  // Set on the element itself: React's `muted` prop does not reach the element on the first render.
  React.useLayoutEffect(() => {
    if (videoRef.current) videoRef.current.muted = !audible;
  }, [audible, src, videoRef]);

  return (
    <div className="relative overflow-hidden bg-neutral-900" inert={inert} onClick={onToggle}>
      {/* The recordings are audio only, so the profile image is the picture. */}
      {poster && (
        <img
          src={poster}
          alt=""
          className={cx('absolute inset-0 size-full object-cover transition-opacity', concealed && src && 'opacity-40')}
        />
      )}
      {src && (
        <video
          ref={videoRef}
          src={src}
          preload="auto"
          playsInline
          muted
          className="pointer-events-none absolute inset-0 size-full opacity-0"
          onTimeUpdate={onPlaybackTick}
          onPause={onPlaybackTick}
          onEnded={onPlaybackTick}
          onLoadedMetadata={onMediaLoaded}
        />
      )}
      {countdown && <div className="pointer-events-none absolute inset-0 ring-4 ring-white/80 ring-inset" />}
      {topLeft && (
        <div className="absolute top-3 left-3 z-30" onClick={event => event.stopPropagation()}>
          {topLeft}
        </div>
      )}
      <div className="absolute right-0 bottom-9 left-0 flex items-center justify-between px-3 text-white">
        <span className="rounded bg-black/50 px-2 py-0.5 text-sm font-medium">
          {participant?.name ?? `Slot ${slot}`}
          <span className="ml-1.5 text-xs text-white/70">{participant?.position}</span>
        </span>
        {countdown && (
          <span className="rounded bg-black/50 px-2 py-0.5 font-mono text-xs tabular-nums">
            {formatClock(countdown.seconds)}
          </span>
        )}
      </div>
      {countdown && (
        <div key={countdownKey} className="absolute right-0 bottom-7 left-0 h-1 bg-white/20">
          <div className="h-full bg-white" style={{ width: `${countdown.progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}

function ControlCircle({
  ariaLabel,
  onClick,
  className,
  children,
}: {
  ariaLabel: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={event => {
        event.stopPropagation();
        onClick();
      }}
      className={cx('grid size-10.5 place-items-center rounded-full bg-white text-text shadow-light', className)}
    >
      {children}
    </button>
  );
}

function Scrubber({
  playheadSeconds,
  timelineSeconds,
  onBegin,
  onSeek,
  onEnd,
}: {
  playheadSeconds: number;
  timelineSeconds: number;
  onBegin: () => void;
  onSeek: (seconds: number) => void;
  onEnd: () => void;
}) {
  return (
    <div
      className="absolute right-0 bottom-0 left-0 z-30 flex h-7 items-center gap-2 bg-black/60 px-3 text-white"
      onClick={event => event.stopPropagation()}
    >
      <span className="w-10 font-mono text-xs tabular-nums">{formatClock(playheadSeconds)}</span>
      <input
        type="range"
        aria-label="Seek"
        min={0}
        max={Math.max(timelineSeconds, 0)}
        step={0.1}
        value={Math.min(playheadSeconds, timelineSeconds)}
        disabled={timelineSeconds <= 0}
        onPointerDown={onBegin}
        onKeyDown={onBegin}
        onChange={event => onSeek(Number(event.target.value))}
        onPointerUp={onEnd}
        onKeyUp={onEnd}
        className="h-1 flex-1 accent-white"
      />
      <span className="w-10 text-right font-mono text-xs tabular-nums">
        {timelineSeconds > 0 ? formatClock(timelineSeconds) : '–:––'}
      </span>
    </div>
  );
}
