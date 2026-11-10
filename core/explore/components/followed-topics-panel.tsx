import Link from 'next/link';

import type { Topic } from '../types';

/** The topics this browser follows, each with its claim count, beside the claims. */
export function FollowedTopicsPanel({
  followed,
  topics,
  counts,
  onUnfollow,
}: {
  followed: readonly string[];
  topics: ReadonlyMap<string, Topic>;
  counts: ReadonlyMap<string, number>;
  onUnfollow: (slug: string) => void;
}) {
  const known = followed.flatMap(slug => {
    const topic = topics.get(slug);
    return topic ? [topic] : [];
  });
  return (
    <section
      aria-labelledby="followed-topics"
      className="grid content-start gap-3 rounded-xl border border-divider bg-white p-4"
    >
      <h2 id="followed-topics" className="font-semibold">
        Following
      </h2>
      {known.length === 0 ? (
        <p className="text-sm text-grey-04">Follow a topic from its page to keep it here.</p>
      ) : (
        <ul className="grid gap-2 text-sm">
          {known.map(topic => (
            <li key={topic.slug} className="flex items-center justify-between gap-2">
              <Link href={`/explore/topic/${topic.slug}`} className="underline">
                {topic.name}
              </Link>
              <span className="ml-auto text-xs text-grey-04 tabular-nums">{counts.get(topic.slug) ?? 0}</span>
              <button
                type="button"
                aria-label={`Unfollow ${topic.name}`}
                onClick={() => onUnfollow(topic.slug)}
                className="text-xs text-grey-04 hover:text-text"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
