/** A subject claims are filed under. A claim can sit under more than one. */
export type Topic = {
  slug: string;
  name: string;
  description: string;
};

export type ClaimSide = 'for' | 'against';

/**
 * One point a debater made, at a moment in one of the debates. `seconds` is where in the debate
 * they made it, so a claim links to `/debate/<id>?t=<seconds>`.
 */
export type Claim = {
  id: string;
  text: string;
  debateId: string;
  debateTitle: string;
  speakerName: string;
  speakerSlot: 1 | 2;
  side: ClaimSide;
  seconds: number;
  topicSlugs: string[];
  agree: number;
  disagree: number;
  /** Unix milliseconds. */
  createdAt: number;
};

export type ClaimVote = 'agree' | 'disagree';

export type ExploreSort = 'top' | 'newest' | 'debate' | 'split';

export type SideFilter = 'all' | ClaimSide;

/** What the viewer narrowed the claims to. Kept in the URL, so a filtered view can be shared. */
export type ExploreQuery = {
  q: string;
  topic: string | null;
  debate: string | null;
  side: SideFilter;
  sort: ExploreSort;
};
