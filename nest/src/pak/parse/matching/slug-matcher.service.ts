import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drama } from '../../entities/drama.entity';
import { MatchMethodEnum } from '../../entities/enums';

export interface MatchResult {
  drama: Drama;
  confidence: number;
  method: MatchMethodEnum;
}

const NOISE_SUFFIXES = [
  '-drama', '-online', '-watch', '-full', '-hd',
  '-hum-tv', '-humtv', '-ary-digital', '-arydigital',
  '-geo-tv', '-geotv', '-express-tv',
];

const NOISE_PREFIXES = ['watch-'];

const TITLE_NOISE = /\b(watch|online|drama|full|hd|hum\s*tv|ary\s*digital|geo\s*tv|express\s*tv)\b/gi;

@Injectable()
export class SlugMatcherService {
  private readonly logger = new Logger(SlugMatcherService.name);

  constructor(
    @InjectRepository(Drama, 'pak')
    private readonly dramaRepo: Repository<Drama>,
  ) {}

  async findMatch(sourceSlug: string, title: string): Promise<MatchResult | null> {
    const normalized = normalizeSlug(sourceSlug);
    const dramas = await this.dramaRepo.find({
      select: { id: true, slug: true, title: true },
    });

    let best: MatchResult | null = null;

    for (const drama of dramas) {
      const dramaSlugNorm = normalizeSlug(drama.slug);

      // 1. Exact normalized slug
      if (dramaSlugNorm === normalized) {
        return { drama, confidence: 100, method: MatchMethodEnum.EXACT_SLUG };
      }

      // 2. Slug containment
      if (
        dramaSlugNorm.length >= 4 &&
        normalized.length >= 4 &&
        (dramaSlugNorm.includes(normalized) || normalized.includes(dramaSlugNorm))
      ) {
        const conf = 90;
        if (!best || conf > best.confidence) {
          best = { drama, confidence: conf, method: MatchMethodEnum.EXACT_SLUG };
        }
        continue;
      }

      // 3. Levenshtein on normalized slugs
      if (dramaSlugNorm.length >= 8 && normalized.length >= 8) {
        const dist = levenshtein(dramaSlugNorm, normalized);
        if (dist <= 2) {
          const conf = 100 - dist * 15;
          if (!best || conf > best.confidence) {
            best = { drama, confidence: conf, method: MatchMethodEnum.FUZZY_TITLE };
          }
          continue;
        }
      }

      // 4. Title token overlap (Jaccard)
      if (title && drama.title) {
        const jaccard = titleJaccard(title, drama.title);
        if (jaccard >= 0.75) {
          const conf = Math.round(60 + jaccard * 20);
          if (!best || conf > best.confidence) {
            best = { drama, confidence: conf, method: MatchMethodEnum.FUZZY_TITLE };
          }
        }
      }
    }

    if (best && best.confidence >= 85) {
      this.logger.log(
        `Matched "${sourceSlug}" -> "${best.drama.slug}" (${best.confidence}%, ${best.method})`,
      );
      return best;
    }

    if (best) {
      this.logger.debug(
        `Low-confidence match "${sourceSlug}" -> "${best.drama.slug}" (${best.confidence}%) — skipped`,
      );
    }

    return null;
  }
}

export function normalizeSlug(slug: string): string {
  let s = slug.toLowerCase();
  for (const prefix of NOISE_PREFIXES) {
    if (s.startsWith(prefix)) s = s.slice(prefix.length);
  }
  for (const suffix of NOISE_SUFFIXES) {
    if (s.endsWith(suffix)) s = s.slice(0, -suffix.length);
  }
  return s.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(TITLE_NOISE, '')
      .split(/[\s\-_]+/)
      .filter((t) => t.length >= 2),
  );
}

export function titleJaccard(a: string, b: string): number {
  const setA = titleTokens(a);
  const setB = titleTokens(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
