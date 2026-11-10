'use client';

import * as React from 'react';

import { type Debate, type DebateMediaTurnSegment, fetchTurnSegments, signDebateMedia } from './api';
import {
  PLAYBACK_END_EPSILON_SECONDS,
  type TurnState,
  clampSeconds,
  timelineSecondsForSegments,
  turnStateFromSegments,
} from './playback-utils';

/** The two recordings drift a little while they play; past this they are put back in step. */
const PAIR_DRIFT_SECONDS = 0.3;

type Slot = 1 | 2;

export type DebatePlaybackController = ReturnType<typeof useDebatePlayback>;

/**
 * Plays a debate's two recordings as one.
 *
 * Both debaters were recorded at once, so the two recordings run the whole debate side by side and
 * one playhead drives both. Only the debater whose turn it is can be heard.
 *
 * `enabled` gates loading only (the URLs and the turn timings); whether the pair plays, and whether
 * its <video> elements are attached at all, is up to the player.
 */
export function useDebatePlayback(debate: Debate, enabled: boolean) {
  const slot1VideoRef = React.useRef<HTMLVideoElement | null>(null);
  const slot2VideoRef = React.useRef<HTMLVideoElement | null>(null);

  // Keyed on the debate, as one player can be handed another debate.
  const [loadedUrls, setLoadedUrls] = React.useState<{ debateId: string; slot1: string; slot2: string } | null>(null);
  const [loadedSegments, setLoadedSegments] = React.useState<{
    debateId: string;
    segments: DebateMediaTurnSegment[];
  } | null>(null);
  const haveUrls = loadedUrls?.debateId === debate.id;
  const haveSegments = loadedSegments?.debateId === debate.id;

  React.useEffect(() => {
    if (!enabled || haveUrls) return;
    let cancelled = false;
    void signDebateMedia(debate.id).then(urls => {
      if (!cancelled) setLoadedUrls({ debateId: debate.id, ...urls });
    });
    return () => {
      cancelled = true;
    };
  }, [debate.id, enabled, haveUrls]);

  React.useEffect(() => {
    if (!enabled || haveSegments) return;
    let cancelled = false;
    void fetchTurnSegments(debate.id).then(segments => {
      if (!cancelled) setLoadedSegments({ debateId: debate.id, segments });
    });
    return () => {
      cancelled = true;
    };
  }, [debate.id, enabled, haveSegments]);

  const urls = React.useMemo(
    () => ({
      slot1: haveUrls ? loadedUrls.slot1 : null,
      slot2: haveUrls ? loadedUrls.slot2 : null,
    }),
    [haveUrls, loadedUrls]
  );
  const turnSegments = React.useMemo(
    () => (haveSegments ? loadedSegments.segments : []),
    [haveSegments, loadedSegments]
  );
  // The turn timings once they arrive; until then the debate's allowance, and 0 without one.
  const timelineSeconds = React.useMemo(
    () =>
      turnSegments.length > 0
        ? timelineSecondsForSegments(turnSegments)
        : debate.turn_durations_ms
          ? debate.turn_durations_ms.reduce((total, ms) => total + ms, 0) / 1000
          : 0,
    [debate.turn_durations_ms, turnSegments]
  );

  const [playheadSeconds, setPlayheadSeconds] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [userPaused, setUserPaused] = React.useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = React.useState(false);
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [isResuming, setIsResuming] = React.useState(false);
  // The feed autoplays muted; the viewer unmutes.
  const [mutedByUser, setMutedByUser] = React.useState(true);

  // A new debate starts from nothing.
  const [stateDebateId, setStateDebateId] = React.useState(debate.id);
  if (stateDebateId !== debate.id) {
    setStateDebateId(debate.id);
    setPlayheadSeconds(0);
    setPlaying(false);
    setUserPaused(false);
    setAutoplayBlocked(false);
    setIsScrubbing(false);
  }

  const resumeGenerationRef = React.useRef(0);
  const pendingSeekSecondsRef = React.useRef<number | null>(null);
  const timelineSecondsRef = React.useRef(timelineSeconds);
  timelineSecondsRef.current = timelineSeconds;

  const videos = React.useCallback(
    () => [slot1VideoRef.current, slot2VideoRef.current].filter((video): video is HTMLVideoElement => video !== null),
    []
  );

  /** Moves both elements, or reports that they cannot be moved yet. */
  const seekVideosTo = React.useCallback((seconds: number) => {
    const slot1 = slot1VideoRef.current;
    const slot2 = slot2VideoRef.current;
    if (!slot1 || !slot2 || slot1.readyState < 1 || slot2.readyState < 1) return false;
    slot1.currentTime = seconds;
    slot2.currentTime = seconds;
    return true;
  }, []);

  /** A seek asked for before the elements could take it lands once they can. */
  const onMediaLoaded = React.useCallback(() => {
    const pending = pendingSeekSecondsRef.current;
    if (pending != null && seekVideosTo(pending)) pendingSeekSecondsRef.current = null;
  }, [seekVideosTo]);

  /** Each media tick: read the playhead from slot 1, and stop both at the end. */
  const onPlaybackTick = React.useCallback(() => {
    const slot1 = slot1VideoRef.current;
    const slot2 = slot2VideoRef.current;
    if (!slot1) return;
    const seconds = slot1.currentTime;
    setPlayheadSeconds(seconds);
    if (slot2 && !slot1.paused && Math.abs(slot2.currentTime - seconds) > PAIR_DRIFT_SECONDS) {
      slot2.currentTime = seconds;
    }
    const timeline = timelineSecondsRef.current;
    if ((timeline > 0 && seconds >= timeline - PLAYBACK_END_EPSILON_SECONDS) || slot1.ended) {
      resumeGenerationRef.current++;
      for (const video of videos()) video.pause();
      setPlaying(false);
    }
  }, [videos]);

  const pauseBoth = React.useCallback(() => {
    // Supersede any resume still confirming, so it cannot un-pause the viewer.
    resumeGenerationRef.current++;
    for (const video of videos()) video.pause();
    setPlaying(false);
    setUserPaused(true);
  }, [videos]);

  const resumeBoth = React.useCallback(async () => {
    const primaryVideo = slot1VideoRef.current;
    const secondaryVideo = slot2VideoRef.current;
    if (!primaryVideo || !secondaryVideo) return;
    // Claim this attempt. Bumping on entry also supersedes an earlier resume still awaiting.
    const generation = ++resumeGenerationRef.current;
    secondaryVideo.currentTime = primaryVideo.currentTime;
    setIsResuming(true);
    try {
      await Promise.all([primaryVideo.play(), secondaryVideo.play()]);
      if (generation !== resumeGenerationRef.current) return;
      setPlaying(true);
      setUserPaused(false);
      setAutoplayBlocked(false);
    } catch (error) {
      if (generation !== resumeGenerationRef.current) return;
      primaryVideo.pause();
      secondaryVideo.pause();
      setPlaying(false);
      // The browser refused a start without a gesture. Only the viewer's tap will do.
      if (error instanceof DOMException && error.name === 'NotAllowedError') setAutoplayBlocked(true);
    } finally {
      if (generation === resumeGenerationRef.current) setIsResuming(false);
    }
  }, []);

  // When a debate scrolls out of view it is paused silently, without flipping userPaused, so it can
  // resume by itself when it is back.
  const suspend = React.useCallback(() => {
    // The card left the viewport; a resume still confirming is stale by definition.
    resumeGenerationRef.current++;
    for (const video of videos()) video.pause();
    setPlaying(false);
    setIsResuming(false);
  }, [videos]);

  const playFromStart = React.useCallback(async () => {
    const primaryVideo = slot1VideoRef.current;
    const secondaryVideo = slot2VideoRef.current;
    if (!primaryVideo || !secondaryVideo) return;
    setUserPaused(false);
    setPlayheadSeconds(0);
    pendingSeekSecondsRef.current = null;
    primaryVideo.pause();
    secondaryVideo.pause();
    seekVideosTo(0);
    await resumeBoth();
  }, [resumeBoth, seekVideosTo]);

  /**
   * Both to one moment. Capped at the debate's length, so before the turn timings arrive (a length
   * of 0) every seek lands at 0.
   */
  const seekBoth = React.useCallback(
    (seconds: number) => {
      const nextTime = clampSeconds(seconds, timelineSeconds);
      pendingSeekSecondsRef.current = nextTime;
      if (seekVideosTo(nextTime)) pendingSeekSecondsRef.current = null;
      setPlayheadSeconds(nextTime);
    },
    [seekVideosTo, timelineSeconds]
  );

  const ready = Boolean(urls.slot1 && urls.slot2);
  const playbackEnded =
    ready && timelineSeconds > 0 && playheadSeconds >= timelineSeconds - PLAYBACK_END_EPSILON_SECONDS;

  const togglePlayback = React.useCallback(() => {
    if (playing) {
      pauseBoth();
      return;
    }
    if (playbackEnded) {
      void playFromStart();
      return;
    }
    void resumeBoth();
  }, [pauseBoth, playFromStart, playbackEnded, playing, resumeBoth]);

  // While the viewer drags the scrubber the videos are paused, so the clock does not move the
  // playhead out from under the drag. Playback picks back up on release if it was running.
  const wasPlayingRef = React.useRef(false);
  const beginScrub = React.useCallback(() => {
    if (isScrubbing) return;
    wasPlayingRef.current = playing;
    for (const video of videos()) video.pause();
    setPlaying(false);
    setIsScrubbing(true);
  }, [isScrubbing, playing, videos]);
  const endScrub = React.useCallback(() => {
    setIsScrubbing(false);
    if (wasPlayingRef.current) void resumeBoth();
  }, [resumeBoth]);

  const turnState: TurnState = turnStateFromSegments(turnSegments, playheadSeconds);
  const participantIn = (slot: Slot) => debate.participants.find(participant => participant.slot === slot) ?? null;

  return {
    slot1VideoRef,
    slot2VideoRef,
    slot1Participant: participantIn(1),
    slot2Participant: participantIn(2),
    slot1Poster: participantIn(1)?.avatarUrl ?? null,
    slot2Poster: participantIn(2)?.avatarUrl ?? null,
    urls,
    turnSegments,
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
    togglePlayback,
    playFromStart,
    resumeBoth,
    suspend,
    seekBoth,
    beginScrub,
    endScrub,
  };
}
