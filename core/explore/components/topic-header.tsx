import cx from 'classnames';
import Link from 'next/link';

import { pluralize } from '../format';
import type { Topic } from '../types';

/** A topic page's heading, with a Follow toggle. */
export function TopicHeader({
  topic,
  claimCount,
  following,
  onToggleFollow,
}: {
  topic: Topic;
  claimCount: number;
  following: boolean;
  onToggleFollow: () => void;
}) {
  return (
    <div className="grid gap-2">
      <Link href="/explore" className="text-sm underline">
        ← All topics
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{topic.name}</h1>
        <button
          type="button"
          aria-pressed={following}
          onClick={onToggleFollow}
          className={cx(
            'rounded-full border px-3 py-1 text-sm',
            following ? 'border-text bg-text text-white' : 'border-divider bg-white hover:border-grey-04'
          )}
        >
          {following ? 'Following' : 'Follow'}
        </button>
      </div>
      <p className="text-sm text-grey-04">
        {topic.description} {pluralize(claimCount, 'claim')}.
      </p>
    </div>
  );
}
