import { Drama } from '../../entities/drama.entity';
import { DramaStatusEnum } from '../../entities/enums';

export type ParseTier = 'hot' | 'warm' | 'cold' | 'frozen';

export interface TierInputs {
  drama: Pick<
    Drama,
    | 'status'
    | 'parseFrozenUntil'
    | 'parseLastSucceededAt'
    | 'parseFailureCount'
    | 'sourceUrl'
  >;
  /** Max airDate of episodes for this drama, or null if none. */
  lastEpisodeAt: Date | null;
  /** Reference clock (default: now). Injectable for tests. */
  now?: Date;
}

const DAY = 86_400_000;

/**
 * Classify how aggressively we should re-scrape a drama.
 *
 *   hot    -- new episodes expected any day. On-air + last ep <= 9d old.
 *   warm   -- on-air but episodes less frequent, or just seeded. Daily scan.
 *   cold   -- dormant / upcoming shows. Weekly scan keeps the index warm.
 *   frozen -- don't scan. Completed shows, explicitly frozen rows, or
 *             dramas without a sourceUrl.
 */
export function classify({ drama, lastEpisodeAt, now = new Date() }: TierInputs): ParseTier {
  if (!drama.sourceUrl) return 'frozen';
  if (drama.parseFrozenUntil && drama.parseFrozenUntil.getTime() > now.getTime()) {
    return 'frozen';
  }
  if (drama.status === DramaStatusEnum.COMPLETED) return 'frozen';
  if (drama.status === DramaStatusEnum.UPCOMING) return 'cold';

  if (!lastEpisodeAt) return 'hot';
  const ageMs = now.getTime() - lastEpisodeAt.getTime();
  if (ageMs <= 9 * DAY) return 'hot';
  if (ageMs <= 30 * DAY) return 'warm';
  return 'cold';
}

export type FailureKind = 'transient' | 'rate_limited' | 'permanent';

export function classifyError(err: unknown): FailureKind {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  const status = msg.match(/->\s*(\d{3})/)?.[1];
  if (status === '429') return 'rate_limited';
  if (status === '404' || status === '410') return 'permanent';
  if (status && /^5\d\d$/.test(status)) return 'transient';
  if (
    msg.includes('timeout') ||
    msg.includes('etimedout') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused') ||
    msg.includes('eai_again') ||
    msg.includes('enotfound') ||
    msg.includes('aborted')
  ) {
    return 'transient';
  }
  return 'transient';
}

export function freezeWindowMs(
  kind: FailureKind,
  consecutiveFailures: number,
): number {
  if (kind === 'permanent') return 7 * DAY;
  if (kind === 'rate_limited') {
    return Math.min(12 * 3600_000, 30 * 60_000 * Math.pow(2, consecutiveFailures - 1));
  }
  return Math.min(6 * 3600_000, 15 * 60_000 * Math.pow(2, consecutiveFailures - 1));
}

/** How many consecutive transient failures before we mark "needs review". */
export const MAX_CONSECUTIVE_FAILURES = 5;
