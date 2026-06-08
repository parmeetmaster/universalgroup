import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drama } from '../entities/drama.entity';
import { Episode } from '../entities/episode.entity';

export interface HomeRailPayload {
  id: string;
  title: string;
  railType: string;
  items: (Drama & { lastEpisodeAt?: string | null })[];
}

@Injectable()
export class PakHomeService {
  constructor(
    @InjectRepository(Drama, 'pak') private readonly dramaRepo: Repository<Drama>,
    @InjectRepository(Episode, 'pak') private readonly episodeRepo: Repository<Episode>,
  ) {}

  async getHome(): Promise<{ rails: HomeRailPayload[] }> {
    const payload: HomeRailPayload[] = [];

    // 1. Hero — series still airing this month (last episode <= 30 days), random
    const heroRail = await this.buildHeroRail();
    if (heroRail.items.length > 0) payload.push(heroRail);

    // 2. Latest Releases — series with the newest aired episode
    const latestRail = await this.buildLatestReleasesRail();
    if (latestRail.items.length > 0) payload.push(latestRail);

    // 3. New on Pakistani Serials — most recently launched series
    const newRail = await this.buildNewDramasRail();
    if (newRail.items.length > 0) payload.push(newRail);

    // 4. Top 10 in Pakistan Today — by all-time views
    const top10Rail = await this.buildTop10Rail();
    if (top10Rail.items.length > 0) payload.push(top10Rail);

    // 5. Trending This Week — by weekly views
    const trendingRail = await this.buildTrendingWeekRail();
    if (trendingRail.items.length > 0) payload.push(trendingRail);

    // 6. Series Completed — last episode aired 30+ days ago
    const completedRail = await this.buildCompletedRail();
    if (completedRail.items.length > 0) payload.push(completedRail);

    return { rails: payload };
  }

  // ── Hero: series active this month (last episode <= 30 days), random order ──

  private async buildHeroRail(): Promise<HomeRailPayload> {
    const rows: { drama_id: string; last_ep: string }[] = await this.episodeRepo.query(
      `SELECT e.drama_id, MAX(e.air_date) AS last_ep
       FROM episodes e
       JOIN dramas d ON d.id = e.drama_id AND d.is_published = 1 AND d.deleted_at IS NULL
         AND d.poster_url IS NOT NULL
       WHERE e.air_date IS NOT NULL
       GROUP BY e.drama_id
       HAVING last_ep >= NOW() - INTERVAL 30 DAY
       ORDER BY RAND()
       LIMIT 10`,
    );

    return this.hydrateRail('hero', 'Featured', 'hero', rows);
  }

  // ── Latest Releases: series whose newest episode aired most recently ──

  private async buildLatestReleasesRail(): Promise<HomeRailPayload> {
    const rows: { drama_id: string; last_ep: string }[] = await this.episodeRepo.query(
      `SELECT e.drama_id, MAX(e.air_date) AS last_ep
       FROM episodes e
       JOIN dramas d ON d.id = e.drama_id AND d.is_published = 1 AND d.deleted_at IS NULL
         AND d.poster_url IS NOT NULL
       WHERE e.air_date > NOW() - INTERVAL 24 HOUR
       GROUP BY e.drama_id
       ORDER BY last_ep DESC
       LIMIT 20`,
    );

    // Fallback: if nothing in 24h, widen to 7 days
    if (rows.length === 0) {
      const fallbackRows: { drama_id: string; last_ep: string }[] =
        await this.episodeRepo.query(
          `SELECT e.drama_id, MAX(e.air_date) AS last_ep
           FROM episodes e
           JOIN dramas d ON d.id = e.drama_id AND d.is_published = 1 AND d.deleted_at IS NULL
             AND d.poster_url IS NOT NULL
           WHERE e.air_date > NOW() - INTERVAL 7 DAY
           GROUP BY e.drama_id
           ORDER BY last_ep DESC
           LIMIT 20`,
        );
      return this.hydrateRail('latest-releases', 'Latest Releases', 'recent_release', fallbackRows);
    }

    return this.hydrateRail('latest-releases', 'Latest Releases', 'recent_release', rows);
  }

  // ── New on Pakistani Serials: most recently launched series ──

  private async buildNewDramasRail(): Promise<HomeRailPayload> {
    // "New" = series that launched recently, ranked by when the series first
    // aired (MIN air_date) — NOT by scrape/publish time, so freshly-imported
    // old serials don't show up as new.
    const rows: { drama_id: string; last_ep: string }[] = await this.episodeRepo.query(
      `SELECT e.drama_id, MIN(e.air_date) AS last_ep
       FROM episodes e
       JOIN dramas d ON d.id = e.drama_id AND d.is_published = 1 AND d.deleted_at IS NULL
         AND d.poster_url IS NOT NULL
       WHERE e.air_date IS NOT NULL
       GROUP BY e.drama_id
       ORDER BY last_ep DESC
       LIMIT 20`,
    );

    return this.hydrateRail('new-dramas', 'New on Pakistani Serials', 'new', rows);
  }

  // ── Top 10 in Pakistan Today: ranked by all-time views ──

  private async buildTop10Rail(): Promise<HomeRailPayload> {
    const dramas = await this.dramaRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.genres', 'g')
      .where('d.isPublished = 1')
      .andWhere('d.deletedAt IS NULL')
      .andWhere('d.posterUrl IS NOT NULL')
      .orderBy('d.allTimeViews', 'DESC')
      .addOrderBy('d.totalLikes', 'DESC')
      .take(10)
      .getMany();

    return { id: 'top10', title: 'Top 10 in Pakistan Today', railType: 'top10', items: dramas };
  }

  // ── Trending This Week: ranked by weekly views ──

  private async buildTrendingWeekRail(): Promise<HomeRailPayload> {
    const dramas = await this.dramaRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.genres', 'g')
      .where('d.isPublished = 1')
      .andWhere('d.deletedAt IS NULL')
      .andWhere('d.posterUrl IS NOT NULL')
      .orderBy('d.weekViews', 'DESC')
      .addOrderBy('d.totalLikes', 'DESC')
      .take(15)
      .getMany();

    return { id: 'trending', title: 'Trending This Week', railType: 'trending', items: dramas };
  }

  // ── Series Completed: last episode aired 30+ days ago ──

  private async buildCompletedRail(): Promise<HomeRailPayload> {
    const rows: { drama_id: string; last_ep: string }[] = await this.episodeRepo.query(
      `SELECT e.drama_id, MAX(e.air_date) AS last_ep
       FROM episodes e
       JOIN dramas d ON d.id = e.drama_id AND d.is_published = 1 AND d.deleted_at IS NULL
         AND d.poster_url IS NOT NULL
       GROUP BY e.drama_id
       HAVING last_ep IS NOT NULL AND last_ep < NOW() - INTERVAL 30 DAY
       ORDER BY last_ep DESC
       LIMIT 20`,
    );

    return this.hydrateRail('completed', 'Series Completed', 'custom', rows);
  }

  // ── Helper: hydrate drama rows from an episode query, preserving row order ──

  private async hydrateRail(
    id: string,
    title: string,
    railType: string,
    rows: { drama_id: string; last_ep: string }[],
  ): Promise<HomeRailPayload> {
    if (rows.length === 0) {
      return { id, title, railType, items: [] };
    }

    const dramaIds = rows.map((r) => r.drama_id);
    const dramas = await this.dramaRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.genres', 'g')
      .whereInIds(dramaIds)
      .getMany();

    const lastEpMap = new Map(rows.map((r) => [r.drama_id, r.last_ep]));
    const dramaMap = new Map(dramas.map((d) => [d.id, d]));

    const items = dramaIds
      .map((rowId) => {
        const drama = dramaMap.get(rowId);
        if (!drama) return null;
        return { ...drama, lastEpisodeAt: lastEpMap.get(rowId) ?? null };
      })
      .filter(Boolean) as (Drama & { lastEpisodeAt?: string | null })[];

    return { id, title, railType, items };
  }
}
