import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Debate } from '~/core/debates/api';
import {
  RESUME_STORAGE_KEY,
  readDebateResumeSeconds,
  rememberDebatePosition,
} from '~/core/debates/debate-resume-positions';

import { DebateFeedPlayer } from './debate-feed-player';

const mocks = vi.hoisted(() => ({ controller: null as unknown }));

// The player's half is what is under test; the hook drives real media elements, which jsdom has not.
vi.mock('~/core/debates/use-debate-playback', () => ({
  useDebatePlayback: () => mocks.controller,
}));

const watchedMocks = vi.hoisted(() => ({ markDebateWatched: vi.fn() }));
vi.mock('~/core/debates/watched-debates', () => ({ markDebateWatched: watchedMocks.markDebateWatched }));

const debate = {
  id: 'debate-1',
  title: 'A debate',
  first_participant_slot: 1,
  turn_durations_ms: [30_000, 30_000, 30_000, 30_000],
  participants: [
    { slot: 1, name: 'Ada', position: 'For', avatarUrl: '/a.svg' },
    { slot: 2, name: 'Ben', position: 'Against', avatarUrl: '/b.svg' },
  ],
} satisfies Debate;

function controllerFixture(
  overrides: {
    mutedByUser?: boolean;
    /** Taken so the app's tests read the same; this fixture has no turns. */
    turnSlot?: 1 | 2;
    ready?: boolean;
    playing?: boolean;
    playbackEnded?: boolean;
    playheadSeconds?: number;
    /** The debate's length; 0 before its turn timings are known. */
    timelineSeconds?: number;
    seekBoth?: ReturnType<typeof vi.fn>;
    playFromStart?: ReturnType<typeof vi.fn>;
  } = {}
) {
  return {
    slot1VideoRef: { current: null },
    slot2VideoRef: { current: null },
    slot1Participant: debate.participants[0],
    slot2Participant: debate.participants[1],
    slot1Poster: '/a.svg',
    slot2Poster: '/b.svg',
    urls: { slot1: '/a.m4a', slot2: '/b.m4a' },
    turnSegments: [],
    ready: overrides.ready ?? true,
    playing: overrides.playing ?? false,
    userPaused: false,
    autoplayBlocked: false,
    isScrubbing: false,
    isResuming: false,
    playbackEnded: overrides.playbackEnded ?? false,
    mutedByUser: overrides.mutedByUser ?? true,
    setMutedByUser: vi.fn(),
    playheadSeconds: overrides.playheadSeconds ?? 0,
    // Four 30s turns, so the whole timeline is 120s.
    timelineSeconds: overrides.timelineSeconds ?? 120,
    turnState: null,
    onPlaybackTick: vi.fn(),
    onMediaLoaded: vi.fn(),
    togglePlayback: vi.fn(),
    playFromStart: overrides.playFromStart ?? vi.fn(),
    resumeBoth: vi.fn(),
    suspend: vi.fn(),
    seekBoth: overrides.seekBoth ?? vi.fn(),
    beginScrub: vi.fn(),
    endScrub: vi.fn(),
  };
}

beforeEach(() => {
  mocks.controller = controllerFixture();
  watchedMocks.markDebateWatched.mockClear();
  window.localStorage.removeItem(RESUME_STORAGE_KEY);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('a seek asked for by the link that brought the reader here', () => {
  it('seeks once the media is ready, and only once', () => {
    const seekBoth = vi.fn();
    mocks.controller = controllerFixture({ ready: false, seekBoth });
    const view = render(<DebateFeedPlayer debate={debate} active initialSeekSeconds={40} />);
    expect(seekBoth).not.toHaveBeenCalled();

    mocks.controller = controllerFixture({ ready: true, seekBoth });
    view.rerender(<DebateFeedPlayer debate={debate} active initialSeekSeconds={40} />);
    view.rerender(<DebateFeedPlayer debate={debate} active initialSeekSeconds={40} />);

    expect(seekBoth.mock.calls).toEqual([[40]]);
  });

  it('seeks again when the moment is dropped and asked for again, as browser Back does', () => {
    const seekBoth = vi.fn();
    mocks.controller = controllerFixture({ seekBoth });
    const view = render(<DebateFeedPlayer debate={debate} active initialSeekSeconds={40} />);
    view.rerender(<DebateFeedPlayer debate={debate} active initialSeekSeconds={null} />);
    view.rerender(<DebateFeedPlayer debate={debate} active initialSeekSeconds={40} />);

    expect(seekBoth.mock.calls).toEqual([[40], [40]]);
  });

  it('opens a debate without one at the beginning', () => {
    const seekBoth = vi.fn();
    mocks.controller = controllerFixture({ seekBoth, playheadSeconds: 0 });
    render(<DebateFeedPlayer debate={debate} active />);

    expect(seekBoth).not.toHaveBeenCalled();
  });
});

describe('the end card', () => {
  it('marks the debate watched when it ends', () => {
    mocks.controller = controllerFixture({ playbackEnded: true, playheadSeconds: 120 });
    render(<DebateFeedPlayer debate={debate} active />);

    expect(watchedMocks.markDebateWatched).toHaveBeenCalledWith(debate.id);
  });

  it('replays at once on the card that holds playback', () => {
    const playFromStart = vi.fn();
    mocks.controller = controllerFixture({ playbackEnded: true, playheadSeconds: 120, playFromStart });
    render(<DebateFeedPlayer debate={debate} active />);

    fireEvent.click(screen.getByRole('button', { name: 'Replay debate' }));

    expect(playFromStart).toHaveBeenCalledTimes(1);
  });

  it('on another card, asks for playback first and replays when it arrives', () => {
    const playFromStart = vi.fn();
    const onPlaybackRequest = vi.fn();
    mocks.controller = controllerFixture({ playbackEnded: true, playheadSeconds: 120, playFromStart });
    const view = render(<DebateFeedPlayer debate={debate} active={false} onPlaybackRequest={onPlaybackRequest} />);

    fireEvent.click(screen.getByRole('button', { name: 'Replay debate' }));
    expect(onPlaybackRequest).toHaveBeenCalledTimes(1);
    expect(playFromStart).not.toHaveBeenCalled();

    act(() => view.rerender(<DebateFeedPlayer debate={debate} active onPlaybackRequest={onPlaybackRequest} />));
    expect(playFromStart).toHaveBeenCalledTimes(1);
  });

  it('drops a held Replay if the debate stops being ended before playback arrives', () => {
    const playFromStart = vi.fn();
    mocks.controller = controllerFixture({ playbackEnded: true, playheadSeconds: 120, playFromStart });
    const view = render(<DebateFeedPlayer debate={debate} active={false} onPlaybackRequest={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Replay debate' }));

    mocks.controller = controllerFixture({ playbackEnded: false, playheadSeconds: 30, playFromStart });
    act(() => view.rerender(<DebateFeedPlayer debate={debate} active={false} onPlaybackRequest={() => {}} />));
    act(() => view.rerender(<DebateFeedPlayer debate={debate} active onPlaybackRequest={() => {}} />));

    expect(playFromStart).not.toHaveBeenCalled();
  });
});

describe('resuming where this browser left a debate', () => {
  function renderResumable({
    initialSeekSeconds = null,
    ready = true,
    releaseMedia = false,
    playheadSeconds = 5,
    playing = true,
    timelineSeconds = 120,
    active = true,
    playbackEnded = false,
    onPlaybackRequest,
  }: {
    active?: boolean;
    playbackEnded?: boolean;
    onPlaybackRequest?: () => void;
    initialSeekSeconds?: number | null;
    ready?: boolean;
    releaseMedia?: boolean;
    playheadSeconds?: number;
    playing?: boolean;
    timelineSeconds?: number;
  } = {}) {
    const seeks: number[] = [];
    const makeSeek = () => vi.fn((seconds: number) => void seeks.push(seconds));
    let props = {
      initialSeekSeconds,
      ready,
      releaseMedia,
      playheadSeconds,
      playing,
      timelineSeconds,
      active,
      playbackEnded,
      debateId: debate.id,
    };

    const element = () => (
      <DebateFeedPlayer
        debate={props.debateId === debate.id ? debate : ({ ...debate, id: props.debateId } as typeof debate)}
        active={props.active}
        onPlaybackRequest={onPlaybackRequest}
        releaseMedia={props.releaseMedia}
        initialSeekSeconds={props.initialSeekSeconds}
      />
    );
    const fixture = () =>
      controllerFixture({
        mutedByUser: true,
        turnSlot: 1,
        ready: props.ready,
        playing: props.playing,
        playheadSeconds: props.playheadSeconds,
        timelineSeconds: props.timelineSeconds,
        playbackEnded: props.playbackEnded,
        seekBoth: makeSeek(),
      });

    mocks.controller = fixture();
    const view = render(element());

    return {
      seeks,
      controller: () => mocks.controller as ReturnType<typeof controllerFixture>,
      update(next: Partial<typeof props> = {}) {
        props = { ...props, ...next };
        mocks.controller = fixture();
        view.rerender(element());
      },
      unmount: view.unmount,
    };
  }

  const startOver = () => screen.queryByRole('button', { name: 'Start over' });

  it('opens a debate watched part of the way a few seconds before where the viewer stopped', () => {
    rememberDebatePosition(debate.id, 80, 120);

    const player = renderResumable();

    expect(player.seeks).toEqual([75]);
    expect(startOver()).not.toBeNull();
  });

  it('starts a debate never watched at the beginning, with no Start over', () => {
    const player = renderResumable();

    expect(player.seeks).toEqual([]);
    expect(startOver()).toBeNull();
  });

  it('waits for the media to be seekable and attached rather than seeking a held card', () => {
    rememberDebatePosition(debate.id, 80, 120);
    const player = renderResumable({ ready: false });
    expect(player.seeks).toEqual([]);

    player.update({ ready: true, releaseMedia: true });
    expect(player.seeks).toEqual([]);
    // Playing at 0 while the resume waits must not save over the position it is waiting to apply.
    expect(readDebateResumeSeconds(debate.id)).toBe(75);

    player.update({ releaseMedia: false });
    expect(player.seeks).toEqual([75]);
  });

  it("waits for the debate's length before resuming", () => {
    rememberDebatePosition(debate.id, 80, 120);
    const player = renderResumable({ timelineSeconds: 0 });

    expect(player.seeks).toEqual([]);
    expect(screen.queryByRole('button', { name: 'Start over' })).toBeNull();
    // Playing from 0 while it waits must not forget the position either.
    player.update({ playheadSeconds: 8, playing: false });
    expect(readDebateResumeSeconds(debate.id)).toBe(75);

    player.update({ timelineSeconds: 120 });
    expect(player.seeks).toEqual([75]);
    expect(screen.queryByRole('button', { name: 'Start over' })).not.toBeNull();
  });

  it('does not chase its own saves back while the debate plays on', () => {
    rememberDebatePosition(debate.id, 80, 120);
    const player = renderResumable({ playheadSeconds: 75 });

    // Each of these is saved, so a resume read live would seek again every few seconds.
    for (const seconds of [76, 82, 90, 101]) player.update({ playheadSeconds: seconds });

    expect(player.seeks).toEqual([75]);
    expect(readDebateResumeSeconds(debate.id)).toBe(96);
  });

  it('lets a link that named a moment win, and does not resume once that link is dropped', () => {
    rememberDebatePosition(debate.id, 80, 120);
    const player = renderResumable({ initialSeekSeconds: 30 });

    expect(player.seeks).toEqual([30]);
    expect(startOver()).toBeNull();

    // Browser Back to the same debate without `?t=`: the viewer is already where the link put them.
    player.update({ initialSeekSeconds: null });
    expect(player.seeks).toEqual([30]);
  });

  it('reads its own position for a different debate on the same card', () => {
    rememberDebatePosition(debate.id, 80, 120);
    rememberDebatePosition('debate-2', 50, 120);
    const player = renderResumable({ playing: false });

    player.update({ debateId: 'debate-2' });

    expect(player.seeks).toEqual([75, 45]);
  });

  it('Start over plays from the beginning and forgets the position', () => {
    rememberDebatePosition(debate.id, 80, 120);
    const player = renderResumable({ playing: false });

    fireEvent.click(startOver()!);

    expect(player.controller().playFromStart).toHaveBeenCalledOnce();
    expect(readDebateResumeSeconds(debate.id)).toBeNull();
    expect(startOver()).toBeNull();
  });

  it('Start over on a card that does not hold playback asks for it, and starts over once handed it', () => {
    rememberDebatePosition(debate.id, 80, 120);
    const onPlaybackRequest = vi.fn();
    const player = renderResumable({ active: false, playing: false, onPlaybackRequest });

    fireEvent.click(startOver()!);

    // Playing now would run beside the card that holds playback, then be paused by it.
    expect(onPlaybackRequest).toHaveBeenCalledOnce();
    expect(player.controller().playFromStart).not.toHaveBeenCalled();
    expect(readDebateResumeSeconds(debate.id)).toBe(75);
    expect(startOver()).not.toBeNull();

    player.update({ active: true });

    expect(player.controller().playFromStart).toHaveBeenCalledOnce();
    expect(readDebateResumeSeconds(debate.id)).toBeNull();
    expect(startOver()).toBeNull();
  });

  it('drops a held Start over once the card moves to another debate', () => {
    rememberDebatePosition(debate.id, 80, 120);
    const player = renderResumable({ active: false, playing: false, onPlaybackRequest: vi.fn() });
    fireEvent.click(startOver()!);

    player.update({ debateId: 'debate-2' });
    player.update({ active: true });

    expect(player.controller().playFromStart).not.toHaveBeenCalled();
    expect(readDebateResumeSeconds(debate.id)).toBe(75);
  });

  it('drops a held Start over once the debate ends', () => {
    rememberDebatePosition(debate.id, 80, 120);
    const player = renderResumable({ active: false, playing: false, onPlaybackRequest: vi.fn() });
    fireEvent.click(startOver()!);

    player.update({ playbackEnded: true });
    player.update({ active: true });

    expect(player.controller().playFromStart).not.toHaveBeenCalled();
  });

  it('saves where the viewer stopped when they pause', () => {
    const player = renderResumable({ playheadSeconds: 40 });
    player.update({ playheadSeconds: 43 });
    expect(readDebateResumeSeconds(debate.id)).toBe(35);

    // Under the save interval while playing; written once playback stops.
    player.update({ playheadSeconds: 43, playing: false });
    expect(readDebateResumeSeconds(debate.id)).toBe(38);
  });

  it('saves where the viewer stopped when the player goes away', () => {
    const player = renderResumable({ playheadSeconds: 40 });
    player.update({ playheadSeconds: 44 });

    player.unmount();

    expect(readDebateResumeSeconds(debate.id)).toBe(39);
  });

  it('saves nothing for a viewer who watched only the first few seconds', () => {
    const player = renderResumable({ playheadSeconds: 3 });
    player.update({ playheadSeconds: 12, playing: false });

    expect(readDebateResumeSeconds(debate.id)).toBeNull();
  });

  it('forgets the position once the debate is finished', () => {
    rememberDebatePosition(debate.id, 80, 120);
    mocks.controller = controllerFixture({ mutedByUser: true, turnSlot: 1, playing: false, playbackEnded: true });

    render(<DebateFeedPlayer debate={debate} active />);

    expect(readDebateResumeSeconds(debate.id)).toBeNull();
  });
});
