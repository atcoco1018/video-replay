import cx from 'classnames';
import Link from 'next/link';

import { agreePercent, formatCount, formatDate, formatTimecode } from '../format';
import type { Claim, ClaimVote, Topic } from '../types';
import { HighlightedText } from './highlighted-text';

/**
 * One claim: who said it, in which debate and when, and how people voted.
 *
 * "Watch" opens the debate at the moment the claim was made. `claim` already carries this browser's
 * vote in its counts; `vote` says which button is pressed.
 */
export function ClaimCard({
  claim,
  topics,
  tokens,
  vote,
  onVote,
}: {
  claim: Claim;
  topics: ReadonlyMap<string, Topic>;
  tokens: readonly string[];
  vote: ClaimVote | undefined;
  onVote: (vote: ClaimVote) => void;
}) {
  const percent = agreePercent(claim.agree, claim.disagree);
  return (
    <article className="grid gap-3 rounded-xl border border-divider bg-white p-4 shadow-light">
      <header className="flex items-center gap-3">
        <img
          src={`/media/${claim.debateId}-slot${claim.speakerSlot}.svg`}
          alt=""
          className="size-9 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            <HighlightedText text={claim.speakerName} tokens={tokens} />
            <span
              className={cx(
                'ml-2 rounded-full px-2 py-0.5 text-xs font-medium',
                claim.side === 'for' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
              )}
            >
              {claim.side === 'for' ? 'For' : 'Against'}
            </span>
          </p>
          <p className="truncate text-xs text-grey-04">
            <HighlightedText text={claim.debateTitle} tokens={tokens} />
          </p>
        </div>
        <time dateTime={new Date(claim.createdAt).toISOString()} className="shrink-0 text-xs text-grey-04">
          {formatDate(claim.createdAt)}
        </time>
      </header>

      <p className="text-base leading-snug">
        <HighlightedText text={claim.text} tokens={tokens} />
      </p>

      <div className="flex flex-wrap gap-1.5">
        {claim.topicSlugs.map(slug => {
          const topic = topics.get(slug);
          if (!topic) return null;
          return (
            <Link
              key={slug}
              href={`/explore/topic/${slug}`}
              className="rounded-full bg-divider px-2 py-0.5 text-xs text-grey-04 hover:text-text"
            >
              {topic.name}
            </Link>
          );
        })}
      </div>

      <footer className="flex flex-wrap items-center gap-2 text-sm">
        <VoteButton label="Agree" count={claim.agree} pressed={vote === 'agree'} onPress={() => onVote('agree')} />
        <VoteButton
          label="Disagree"
          count={claim.disagree}
          pressed={vote === 'disagree'}
          onPress={() => onVote('disagree')}
        />
        {percent != null && <span className="text-xs text-grey-04">{percent}% agree</span>}
        <Link
          href={`/debate/${claim.debateId}?t=${claim.seconds}`}
          className="ml-auto rounded-full border border-divider px-3 py-1 font-medium hover:border-grey-04"
        >
          Watch at {formatTimecode(claim.seconds)}
        </Link>
      </footer>
    </article>
  );
}

function VoteButton({
  label,
  count,
  pressed,
  onPress,
}: {
  label: string;
  count: number;
  pressed: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onPress}
      className={cx(
        'rounded-full border px-3 py-1',
        pressed ? 'border-text bg-text text-white' : 'border-divider bg-white hover:border-grey-04'
      )}
    >
      {label} <span className="tabular-nums">{formatCount(count)}</span>
    </button>
  );
}
