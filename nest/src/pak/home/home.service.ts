import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeRail } from '../entities/home-rail.entity';
import { Drama } from '../entities/drama.entity';
import { Episode } from '../entities/episode.entity';
import { RailTypeEnum } from '../entities/enums';

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
    const rails = await this.railRepo.find({
      where: { isActive: 1 },
      relations: {
        items: { drama: { genres: true } },
        genre: true,
      },
      order: { displayOrder: 'ASC' },
    });

    const payload: HomeRailPayload[] = [];

    // Build "Recent Releases" rail — dramas with most recent episodes
    const recentRail = await this.buildRecentReleasesRail();
    if (recentRail.items.length > 0) {
      payload.push(recentRail);
    }

    for (const rail of rails) {
      let items: Drama[];
      if (rail.railType === RailTypeEnum.GENRE && rail.genreId) {
        items = await this.dramaRepo
          .createQueryBuilder('d')
          .innerJoin('d.genres', 'g', 'g.id = :gid', { gid: rail.genreId })
          .leftJoinAndSelect('d.genres', 'gs')
          .where('d.isPublished = 1')
          .orderBy('d.publishedAt', 'DESC')
          .take(20)
          .getMany();
      } else if (
        (rail.railType === RailTypeEnum.NEW || rail.railType === RailTypeEnum.TRENDING) &&
        rail.items.length === 0
      ) {
        items = await this.dramaRepo.find({
          where: { isPublished: 1 },
          order: { publishedAt: 'DESC' },
          take: 20,
          relations: { genres: true },
        });
      } else {
        items = rail.items
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((i) => i.drama);
      }

      payload.push({
        id: rail.id,
        title: rail.title,
        railType: rail.railType,
        items,
      });
    }
    return { rails: payload };
  }

  private async buildRecentReleasesRail(): Promise<HomeRailPayload> {
    // Get dramas that have the most recent episodes, ordered by latest episode air_date
    const rows: { drama_id: string; last_ep: string }[] = await this.episodeRepo.query(
      `SELECT e.drama_id, MAX(e.created_at) AS last_ep
       FROM episodes e
       JOIN dramas d ON d.id = e.drama_id AND d.is_published = 1 AND d.deleted_at IS NULL
         AND d.poster_url IS NOT NULL AND d.poster_url NOT LIKE '%dramaxima.png'
       GROUP BY e.drama_id
       ORDER BY last_ep DESC
       LIMIT 20`,
    );

    if (rows.length === 0) {
      return { id: 'recent-releases', title: 'Recent Releases', railType: 'recent_release', items: [] };
    }

    const dramaIds = rows.map((r) => r.drama_id);
    const dramas = await this.dramaRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.genres', 'g')
      .whereInIds(dramaIds)
      .getMany();

    const lastEpMap = new Map(rows.map((r) => [r.drama_id, r.last_ep]));
    const dramaMap = new Map(dramas.map((d) => [d.id, d]));

    // Preserve order from query (most recent first) and attach lastEpisodeAt
    const items = dramaIds
      .map((id) => {
        const drama = dramaMap.get(id);
        if (!drama) return null;
        return { ...drama, lastEpisodeAt: lastEpMap.get(id) ?? null };
      })
      .filter(Boolean) as (Drama & { lastEpisodeAt?: string | null })[];

    return {
      id: 'recent-releases',
      title: 'Recent Releases',
      railType: 'recent_release',
      items,
    };
  }
}
