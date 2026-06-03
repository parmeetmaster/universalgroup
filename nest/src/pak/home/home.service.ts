import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeRail } from '../entities/home-rail.entity';
import { Drama } from '../entities/drama.entity';
import { Episode } from '../entities/episode.entity';
import { EpisodeVideo } from '../entities/episode-video.entity';
import { RailTypeEnum, DramaStatusEnum } from '../entities/enums';

export interface HomeRailPayload {
  id: string;
  title: string;
  railType: string;
  items: (Drama & { lastEpisodeAt?: string | null })[];
}

@Injectable()
export class PakHomeService {
  constructor(
    @InjectRepository(HomeRail, 'pak') private readonly railRepo: Repository<HomeRail>,
    @InjectRepository(Drama, 'pak') private readonly dramaRepo: Repository<Drama>,
    @InjectRepository(Episode, 'pak') private readonly episodeRepo: Repository<Episode>,
  ) {}

  async getHome(): Promise<{ rails: HomeRailPayload[] }> {
    const payload: HomeRailPayload[] = [];

    // 1. Hero carousel — top 10 most popular (total_episodes as proxy)
    const heroRail = await this.buildHeroRail();
    if (heroRail.items.length > 0) payload.push(heroRail);

    // 2. Latest releases — episodes released in past 24h, episode-wise descending
    const latestRail = await this.buildLatestReleasesRail();
    if (latestRail.items.length > 0) payload.push(latestRail);

    // 3. New on Pakistani Serials — newly added dramas, drama-wise
    const newRail = await this.buildNewDramasRail();
    if (newRail.items.length > 0) payload.push(newRail);

    // 4. DB-configured rails (genre, custom, etc.)
    const dbRails = await this.buildDbRails();
    payload.push(...dbRails);

    // 5. Monthly popular — most watched this month (total_episodes + rating as proxy)
    const monthlyRail = await this.buildMonthlyPopularRail();
    if (monthlyRail.items.length > 0) payload.push(monthlyRail);

    // 6. Completed — finished serials, newest first
    const completedRail = await this.buildCompletedRail();
    if (completedRail.items.length > 0) payload.push(completedRail);

    return { rails: payload };
  }

  // ── Hero: Top 10 most popular lifetime ──

  private async buildHeroRail(): Promise<HomeRailPayload> {
    const dramas = await this.dramaRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.genres', 'g')
      .where('d.isPublished = 1')
      .andWhere('d.deletedAt IS NULL')
      .andWhere('d.posterUrl IS NOT NULL')
      .orderBy('d.totalLikes', 'DESC')
      .addOrderBy('d.totalEpisodes', 'DESC')
      .take(10)
      .getMany();

    return { id: 'hero', title: 'Featured', railType: 'hero', items: dramas };
  }

  // ── Latest Releases: episodes in past 24h, ordered by newest ──

  private async buildLatestReleasesRail(): Promise<HomeRailPayload> {
    const rows: { drama_id: string; last_ep: string }[] = await this.episodeRepo.query(
      `SELECT e.drama_id, MAX(COALESCE(e.air_date, e.created_at)) AS last_ep
       FROM episodes e
       JOIN dramas d ON d.id = e.drama_id AND d.is_published = 1 AND d.deleted_at IS NULL
         AND d.poster_url IS NOT NULL       WHERE COALESCE(e.air_date, e.created_at) > NOW() - INTERVAL 24 HOUR
       GROUP BY e.drama_id
       ORDER BY last_ep DESC
       LIMIT 20`,
    );

    // Fallback: if nothing in 24h, widen to 7 days
    if (rows.length === 0) {
      const fallbackRows: { drama_id: string; last_ep: string }[] =
        await this.episodeRepo.query(
          `SELECT e.drama_id, MAX(COALESCE(e.air_date, e.created_at)) AS last_ep
           FROM episodes e
           JOIN dramas d ON d.id = e.drama_id AND d.is_published = 1 AND d.deleted_at IS NULL
             AND d.poster_url IS NOT NULL           WHERE COALESCE(e.air_date, e.created_at) > NOW() - INTERVAL 7 DAY
           GROUP BY e.drama_id
           ORDER BY last_ep DESC
           LIMIT 20`,
        );
      return this.hydrateRail('latest-releases', 'Latest Releases', 'recent_release', fallbackRows);
    }

    return this.hydrateRail('latest-releases', 'Latest Releases', 'recent_release', rows);
  }

  // ── New on Pakistani Serials: newly published dramas ──

  private async buildNewDramasRail(): Promise<HomeRailPayload> {
    const dramas = await this.dramaRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.genres', 'g')
      .where('d.isPublished = 1')
      .andWhere('d.deletedAt IS NULL')
      .andWhere('d.posterUrl IS NOT NULL')
      .orderBy('d.publishedAt', 'DESC')
      .take(20)
      .getMany();

    return {
      id: 'new-dramas',
      title: 'New on Pakistani Serials',
      railType: 'new',
      items: dramas,
    };
  }

  // ── DB-configured rails (genre-based, custom, top10, trending) ──

  private async buildDbRails(): Promise<HomeRailPayload[]> {
    const rails = await this.railRepo.find({
      where: { isActive: 1 },
      relations: { items: { drama: { genres: true } }, genre: true },
      order: { displayOrder: 'ASC' },
    });

    const result: HomeRailPayload[] = [];

    for (const rail of rails) {
      // Skip hero/recent_release/new — we build those ourselves
      if (['hero', 'recent_release', 'new'].includes(rail.railType)) continue;

      let items: Drama[];
      if (rail.railType === RailTypeEnum.GENRE && rail.genreId) {
        items = await this.dramaRepo
          .createQueryBuilder('d')
          .innerJoin('d.genres', 'g', 'g.id = :gid', { gid: rail.genreId })
          .leftJoinAndSelect('d.genres', 'gs')
          .where('d.isPublished = 1')
          .orderBy('d.totalEpisodes', 'DESC')
          .take(20)
          .getMany();
      } else if (rail.railType === RailTypeEnum.TRENDING) {
        items = await this.dramaRepo.find({
          where: { isPublished: 1 },
          order: { totalEpisodes: 'DESC' },
          take: 15,
          relations: { genres: true },
        });
      } else if (rail.railType === RailTypeEnum.TOP10) {
        items = await this.dramaRepo.find({
          where: { isPublished: 1 },
          order: { totalEpisodes: 'DESC', ratingCount: 'DESC' },
          take: 10,
          relations: { genres: true },
        });
      } else {
        items = rail.items
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((i) => i.drama);
      }

      if (items.length > 0) {
        result.push({
          id: rail.id,
          title: rail.title,
          railType: rail.railType,
          items,
        });
      }
    }

    return result;
  }

  // ── Monthly Popular: most active dramas this month ──

  private async buildMonthlyPopularRail(): Promise<HomeRailPayload> {
    const dramas = await this.dramaRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.genres', 'g')
      .where('d.isPublished = 1')
      .andWhere('d.deletedAt IS NULL')
      .andWhere('d.posterUrl IS NOT NULL')
      .andWhere('d.monthlyViews > 0')
      .orderBy('d.monthlyViews', 'DESC')
      .take(15)
      .getMany();

    // Fallback: if no monthly views yet, use total_likes
    const items = dramas.length > 0
      ? dramas
      : await this.dramaRepo
          .createQueryBuilder('d')
          .leftJoinAndSelect('d.genres', 'g')
          .where('d.isPublished = 1')
          .andWhere('d.deletedAt IS NULL')
          .andWhere('d.posterUrl IS NOT NULL')
              .orderBy('d.totalLikes', 'DESC')
          .addOrderBy('d.totalEpisodes', 'DESC')
          .take(15)
          .getMany();

    return {
      id: 'monthly-popular',
      title: 'Popular This Month',
      railType: 'trending',
      items,
    };
  }

  // ── Completed: finished serials, newest first ──

  private async buildCompletedRail(): Promise<HomeRailPayload> {
    const dramas = await this.dramaRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.genres', 'g')
      .where('d.isPublished = 1')
      .andWhere('d.deletedAt IS NULL')
      .andWhere('d.status = :status', { status: DramaStatusEnum.COMPLETED })
      .andWhere('d.posterUrl IS NOT NULL')
      .orderBy('d.updatedAt', 'DESC')
      .take(20)
      .getMany();

    return {
      id: 'completed',
      title: 'Completed Series',
      railType: 'custom',
      items: dramas,
    };
  }

  // ── Helper: hydrate drama rows from episode query ──

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
      .map((id) => {
        const drama = dramaMap.get(id);
        if (!drama) return null;
        return { ...drama, lastEpisodeAt: lastEpMap.get(id) ?? null };
      })
      .filter(Boolean) as (Drama & { lastEpisodeAt?: string | null })[];

    return { id, title, railType, items };
  }
}
