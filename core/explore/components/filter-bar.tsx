import cx from 'classnames';

import { EXPLORE_SORTS, SIDE_FILTERS } from '../explore-constants';
import type { ExploreSort, SideFilter } from '../types';

/** Which debate, which side, and the order. */
export function FilterBar({
  debates,
  debate,
  side,
  sort,
  onDebateChange,
  onSideChange,
  onSortChange,
}: {
  debates: ReadonlyArray<{ id: string; title: string }>;
  debate: string | null;
  side: SideFilter;
  sort: ExploreSort;
  onDebateChange: (debate: string | null) => void;
  onSideChange: (side: SideFilter) => void;
  onSortChange: (sort: ExploreSort) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <label className="flex items-center gap-2">
        <span className="text-grey-04">Debate</span>
        <select
          value={debate ?? ''}
          onChange={event => onDebateChange(event.target.value || null)}
          className="max-w-64 rounded-md border border-divider bg-white px-2 py-1"
        >
          <option value="">All debates</option>
          {debates.map(item => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>

      <div role="radiogroup" aria-label="Side" className="flex rounded-full border border-divider bg-white p-0.5">
        {SIDE_FILTERS.map(option => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={side === option.value}
            onClick={() => onSideChange(option.value)}
            className={cx(
              'rounded-full px-3 py-1',
              side === option.value ? 'bg-text text-white' : 'text-grey-04 hover:text-text'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="ml-auto flex items-center gap-2">
        <span className="text-grey-04">Sort</span>
        <select
          value={sort}
          onChange={event => onSortChange(event.target.value as ExploreSort)}
          className="rounded-md border border-divider bg-white px-2 py-1"
        >
          {EXPLORE_SORTS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
