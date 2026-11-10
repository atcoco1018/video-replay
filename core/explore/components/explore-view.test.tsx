import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_EXPLORE_QUERY, EXPLORE_PAGE_SIZE } from '../explore-constants';
import { claimFixture, topicFixtures } from '../testing/claim-fixture';
import type { ExploreQuery } from '../types';
import { ExploreView, type ExploreViewProps } from './explore-view';

afterEach(cleanup);

const debates = [
  { id: 'debate-a', title: 'Should cities ban cars?' },
  { id: 'debate-b', title: 'Is remote work better?' },
];

const air = claimFixture({ id: 'air', text: 'Cleaner air in the streets.', agree: 90, disagree: 10 });
const vans = claimFixture({
  id: 'vans',
  text: 'Deliveries still need vans.',
  speakerName: 'Ben',
  speakerSlot: 2,
  side: 'against',
  agree: 40,
  disagree: 35,
});
const commute = claimFixture({
  id: 'commute',
  text: 'Two hours back each day.',
  debateId: 'debate-b',
  debateTitle: 'Is remote work better?',
  speakerName: 'Dev',
  topicSlugs: ['work'],
  seconds: 75,
  agree: 20,
  disagree: 0,
});

function renderView(props: Partial<ExploreViewProps> = {}) {
  const onQueryChange = vi.fn();
  const onVote = vi.fn();
  const onToggleFollow = vi.fn();
  const all: ExploreViewProps = {
    query: DEFAULT_EXPLORE_QUERY,
    onQueryChange,
    claims: [vans, commute, air],
    topics: topicFixtures,
    debates,
    followed: [],
    onToggleFollow,
    votes: {},
    onVote,
    ...props,
  };
  const view = render(<ExploreView {...all} />);
  const rerender = (change: Partial<ExploreViewProps>) => view.rerender(<ExploreView {...all} {...change} />);
  return { onQueryChange, onVote, onToggleFollow, rerender };
}

const claimTexts = () => screen.getAllByRole('article').map(article => within(article).getByText(/\.$/).textContent);
const lastChange = (onQueryChange: ReturnType<typeof vi.fn>) =>
  onQueryChange.mock.calls.at(-1)![0] as Partial<ExploreQuery>;

describe('ExploreView', () => {
  it('lists every claim, best scored first', () => {
    renderView();
    expect(claimTexts()).toEqual([
      'Cleaner air in the streets.',
      'Two hours back each day.',
      'Deliveries still need vans.',
    ]);
    expect(screen.getByText('3 claims')).toBeTruthy();
  });

  it('narrows to the query, and says how many of how many', () => {
    renderView({ query: { ...DEFAULT_EXPLORE_QUERY, side: 'against' } });
    expect(claimTexts()).toEqual(['Deliveries still need vans.']);
    expect(screen.getByText('1 claim of 3')).toBeTruthy();
  });

  it('marks the searched words', () => {
    renderView({ query: { ...DEFAULT_EXPLORE_QUERY, q: 'vans' } });
    expect(screen.getByText('vans', { selector: 'mark' })).toBeTruthy();
  });

  it('links each claim to its moment in its debate', () => {
    renderView();
    const link = screen.getByRole('link', { name: 'Watch at 1:15' });
    expect(link.getAttribute('href')).toBe('/debate/debate-b?t=75');
  });

  it('counts each topic under the other filters, and chooses one', () => {
    const { onQueryChange } = renderView({ query: { ...DEFAULT_EXPLORE_QUERY, debate: 'debate-a' } });
    const chips = screen.getByRole('group', { name: 'Topics' });
    expect(within(chips).getByRole('button', { name: /Cities/ }).textContent).toBe('Cities2');
    expect((within(chips).getByRole('button', { name: /Work/ }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(within(chips).getByRole('button', { name: /Cities/ }));
    expect(lastChange(onQueryChange)).toEqual({ topic: 'cities' });
  });

  it('changes side, debate and sort', () => {
    const { onQueryChange } = renderView();
    fireEvent.click(screen.getByRole('radio', { name: 'For' }));
    expect(lastChange(onQueryChange).side).toBe('for');
    fireEvent.change(screen.getByRole('combobox', { name: 'Debate' }), { target: { value: 'debate-b' } });
    expect(lastChange(onQueryChange).debate).toBe('debate-b');
    fireEvent.change(screen.getByRole('combobox', { name: 'Sort' }), { target: { value: 'newest' } });
    expect(lastChange(onQueryChange).sort).toBe('newest');
  });

  it('offers to clear the filters when nothing matches, keeping the sort', () => {
    const { onQueryChange } = renderView({
      query: { ...DEFAULT_EXPLORE_QUERY, q: 'nothing like this', sort: 'newest' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));
    expect(lastChange(onQueryChange)).toEqual({ ...DEFAULT_EXPLORE_QUERY, sort: 'newest' });
  });

  it("shows this browser's vote in the counts without reordering", () => {
    const { onVote, rerender } = renderView();
    const vans = screen.getAllByRole('article')[2];
    fireEvent.click(within(vans).getByRole('button', { name: /Agree/ }));
    expect(onVote).toHaveBeenCalledWith('vans', 'agree');

    rerender({ votes: { vans: 'agree' } });
    const voted = screen.getAllByRole('article')[2];
    expect(within(voted).getByRole('button', { name: /Agree/ }).textContent).toBe('Agree 41');
    expect(within(voted).getByRole('button', { name: /Agree/ }).getAttribute('aria-pressed')).toBe('true');
  });

  it('shows a page at a time', () => {
    const many = Array.from({ length: EXPLORE_PAGE_SIZE + 3 }, (_, index) =>
      claimFixture({ id: `c${String(index).padStart(2, '0')}`, text: `Claim number ${index}.` })
    );
    renderView({ claims: many });
    expect(screen.getAllByRole('article')).toHaveLength(EXPLORE_PAGE_SIZE);
    fireEvent.click(screen.getByRole('button', { name: 'Show more (3 left)' }));
    expect(screen.getAllByRole('article')).toHaveLength(EXPLORE_PAGE_SIZE + 3);
    expect(screen.queryByRole('button', { name: /Show more/ })).toBeNull();
  });

  describe("on a topic's page", () => {
    const work = topicFixtures.find(topic => topic.slug === 'work')!;

    it('shows only that topic, with a Follow toggle and no chips', () => {
      const { onToggleFollow } = renderView({ fixedTopic: work });
      expect(screen.getByRole('heading', { name: 'Work' })).toBeTruthy();
      expect(claimTexts()).toEqual(['Two hours back each day.']);
      expect(screen.queryByRole('group', { name: 'Topics' })).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Follow' }));
      expect(onToggleFollow).toHaveBeenCalledWith('work');
    });

    it('ignores a topic in the URL, and drops it from what it writes back', () => {
      const { onQueryChange } = renderView({ fixedTopic: work, query: { ...DEFAULT_EXPLORE_QUERY, topic: 'cities' } });
      expect(claimTexts()).toEqual(['Two hours back each day.']);
      fireEvent.click(screen.getByRole('radio', { name: 'For' }));
      expect(lastChange(onQueryChange)).toEqual({ side: 'for', topic: null });
    });
  });

  it('lists followed topics beside the claims, with a way to unfollow', () => {
    const { onToggleFollow } = renderView({ followed: ['work', 'gone'] });
    const panel = screen.getByRole('region', { name: 'Following' });
    expect(
      within(panel)
        .getAllByRole('link')
        .map(link => link.textContent)
    ).toEqual(['Work']);
    fireEvent.click(within(panel).getByRole('button', { name: 'Unfollow Work' }));
    expect(onToggleFollow).toHaveBeenCalledWith('work');
  });
});
