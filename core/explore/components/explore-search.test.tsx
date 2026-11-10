import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SEARCH_DEBOUNCE_MS } from '../explore-constants';
import { ExploreSearch } from './explore-search';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const box = () => screen.getByRole('searchbox', { name: 'Search claims' }) as HTMLInputElement;
const type = (value: string) => fireEvent.change(box(), { target: { value } });

describe('ExploreSearch', () => {
  it('applies what is typed once typing pauses, not on every key', () => {
    const onCommit = vi.fn();
    render(<ExploreSearch value="" onCommit={onCommit} />);
    type('a');
    type('ai');
    type('air');
    expect(box().value).toBe('air');
    expect(onCommit).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(onCommit.mock.calls).toEqual([['air']]);
  });

  it('applies at once on Enter, and on clearing', () => {
    const onCommit = vi.fn();
    render(<ExploreSearch value="" onCommit={onCommit} />);
    type('bus');
    fireEvent.submit(screen.getByRole('search'));
    expect(onCommit.mock.calls).toEqual([['bus']]);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onCommit.mock.calls).toEqual([['bus'], ['']]);
    expect(box().value).toBe('');
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(onCommit).toHaveBeenCalledTimes(2);
  });

  it('follows a value changed from outside', () => {
    const view = render(<ExploreSearch value="air" onCommit={vi.fn()} />);
    view.rerender(<ExploreSearch value="bus" onCommit={vi.fn()} />);
    expect(box().value).toBe('bus');
  });

  it('keeps typing that went on while its own search was being applied', () => {
    const onCommit = vi.fn();
    const view = render(<ExploreSearch value="" onCommit={onCommit} />);
    type('clean ');
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    type('clean a');

    // The URL catches up with the search applied a moment ago, trimmed.
    view.rerender(<ExploreSearch value="clean" onCommit={onCommit} />);
    expect(box().value).toBe('clean a');
  });
});
