import cx from 'classnames';

import type { Topic } from '../types';

/** One chip per topic, with how many of the claims sit under it. Pressing the chosen one clears it. */
export function TopicChips({
  topics,
  counts,
  selected,
  onSelect,
}: {
  topics: readonly Topic[];
  counts: ReadonlyMap<string, number>;
  selected: string | null;
  onSelect: (slug: string | null) => void;
}) {
  return (
    <div role="group" aria-label="Topics" className="flex flex-wrap gap-2">
      {topics.map(topic => {
        const active = topic.slug === selected;
        const count = counts.get(topic.slug) ?? 0;
        return (
          <button
            key={topic.slug}
            type="button"
            aria-pressed={active}
            disabled={count === 0 && !active}
            onClick={() => onSelect(active ? null : topic.slug)}
            className={cx(
              'rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-40',
              active ? 'border-text bg-text text-white' : 'border-divider bg-white text-text hover:border-grey-04'
            )}
          >
            {topic.name}
            <span className={cx('ml-1.5 tabular-nums', active ? 'text-white/70' : 'text-grey-04')}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
