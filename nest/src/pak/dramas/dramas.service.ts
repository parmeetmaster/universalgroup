import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Drama } from '../entities/drama.entity';
import { Episode } from '../entities/episode.entity';
import { HomeRail } from '../entities/home-rail.entity';
import { ListDramasDto } from './dto/list-dramas.dto';
import { Paginated } from '../common/pagination.dto';

@Injectable()
export class PakDramasService {
  constructor(
    @InjectRepository(Drama, 'pak') private readonly repo: Repository<Drama>,
    @InjectRepository(Episode, 'pak') private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(HomeRail, 'pak') private readonly railRepo: Repository<HomeRail>,
  ) {}

  // ── Rail dramas cache (5 min TTL) ──

  private railCache = new Map<string, { data: any; expires: number }>();

  private getCached(key: string): any | null {
    const entry = this.railCache.get(key);
    if (!entry || Date.now() > entry.expires) {
      this.railCache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache(key: string, data: any): void {
    this.railCache.set(key, { data, expires: Date.now() + 5 * 60 * 1000 });
  }

  async railDramas(
    railId: string,
    genre: string | undefined,
    page: number,
    limit: number,
  ): Promise<Paginated<Drama>> {
    const cacheKey = `rail:${railId}:g=${genre ?? ''}:p=${page}:l=${limit}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    // Date-based rails: paginate over drama IDs by episode air-date aggregate.
    // (TypeORM can't combine take/skip + leftJoinAndSelect + orderBy on a joined
    // subquery column, so we page the IDs in raw SQL, then hydrate with genres.)
    if (railId === 'latest-releases' || railId === 'new-dramas' || railId === 'completed') {
      const opts =
        railId === 'new-dramas'
          ? { agg: 'MIN' as const, order: 'DESC' as const }
          : railId === 'completed'
            ? {
                agg: 'MAX' as const,
                order: 'DESC' as const,
                having: 'MAX(e.air_date) < (NOW() - INTERVAL 30 DAY)',
              }
            : { agg: 'MAX' as const, order: 'DESC' as const };
      const result = await this.paginateByEpisodeAggregate(opts, genre, page, limit);
      this.setCache(cacheKey, result);
      return result;
    }

    let qb = this.repo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.genres', 'g')
      .where('d.isPublished = 1')
      .andWhere('d.deletedAt IS NULL')
      .andWhere('d.posterUrl IS NOT NULL');

    if (genre) {
      qb = qb.innerJoin('d.genres', 'gf', 'gf.slug = :gs', { gs: genre });
    }

    switch (railId) {
      case 'hero':
        qb = qb.orderBy('d.totalLikes', 'DESC').addOrderBy('d.totalEpisodes', 'DESC');
        break;

      case 'top10':
        qb = qb.orderBy('d.allTimeViews', 'DESC').addOrderBy('d.totalLikes', 'DESC');
        break;

      case 'trending':
        qb = qb.orderBy('d.weekViews', 'DESC').addOrderBy('d.totalLikes', 'DESC');
        break;

      default: {
        // DB-configured rail: look up by ID and use genre if present
        const rail = await this.railRepo.findOne({ where: { id: railId }, relations: { genre: true } });
        if (rail?.genreId) {
          qb = qb.innerJoin('d.genres', 'rg', 'rg.id = :rgid', { rgid: rail.genreId });
        }
        qb = qb.orderBy('d.totalEpisodes', 'DESC').addOrderBy('d.publishedAt', 'DESC');
        break;
      }
    }

    const offset = (page - 1) * limit;
    qb = qb.skip(offset).take(limit);

    const [data, total] = await qb.getManyAndCount();
    const result: Paginated<Drama> = { data, meta: { page, limit, total } };

    this.setCache(cacheKey, result);
    return result;
  }

  // Pages drama IDs by an episode air-date aggregate (MIN/MAX), then hydrates
  // the page with genres in row order. Used by date-based rails so pagination
  // + ordering stay correct without TypeORM's join/DISTINCT limitations.
  private async paginateByEpisodeAggregate(
    opts: { agg: 'MIN' | 'MAX'; order: 'ASC' | 'DESC'; having?: string },
    genre: string | undefined,
    page: number,
    limit: number,
  ): Promise<Paginated<Drama>> {
    const offset = (page - 1) * limit;
    const genreJoin = genre
      ? 'JOIN drama_genres dg ON dg.drama_id = d.id JOIN genres gf ON gf.id = dg.genre_id AND gf.slug = ?'
      : '';
    const params: (string | number)[] = genre ? [genre] : [];
    const having = opts.having ? `HAVING ${opts.having}` : '';

    const grouped = `
      FROM episodes e
      JOIN dramas d ON d.id = e.drama_id AND d.is_published = 1 AND d.deleted_at IS NULL
        AND d.poster_url IS NOT NULL
      ${genreJoin}
      WHERE e.air_date IS NOT NULL
      GROUP BY e.drama_id
      ${having}`;

    const rows: { drama_id: string }[] = await this.episodeRepo.query(
      `SELECT e.drama_id, ${opts.agg}(e.air_date) AS last_ep ${grouped}
       ORDER BY last_ep ${opts.order}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const countRows: { cnt: number }[] = await this.episodeRepo.query(
      `SELECT COUNT(*) AS cnt FROM (SELECT e.drama_id ${grouped}) t`,
      params,
    );
    const total = Number(countRows[0]?.cnt ?? 0);

    const ids = rows.map((r) => r.drama_id);
    if (ids.length === 0) return { data: [], meta: { page, limit, total } };

    const dramas = await this.repo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.genres', 'g')
      .whereInIds(ids)
      .getMany();
    const dramaMap = new Map(dramas.map((d) => [d.id, d]));
    const data = ids
      .map((id) => dramaMap.get(id))
      .filter(Boolean) as Drama[];

    return { data, meta: { page, limit, total } };
  }

  async list(dto: ListDramasDto): Promise<Paginated<Drama>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const qb = this.repo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.genres', 'g')
      .where('d.isPublished = :pub', { pub: 1 });

    this.applyFilters(qb, dto);
    this.applySort(qb, dto.sort);

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total } };
  }

  async findBySlug(slug: string): Promise<Drama & { lastEpisodeAt: string | null }> {
    const drama = await this.repo.findOne({
      where: { slug, isPublished: 1 },
      relations: { genres: true, cast: true, seasons: true },
    });
    if (!drama) throw new NotFoundException('Drama not found');

    const row: { last_ep: string | null }[] = await this.episodeRepo.query(
      `SELECT MAX(COALESCE(air_date, created_at)) AS last_ep FROM episodes WHERE drama_id = ?`,
      [drama.id],
    );
    return { ...drama, lastEpisodeAt: row[0]?.last_ep ?? null };
  }

  async related(slug: string, limit = 12): Promise<Drama[]> {
    const primary = await this.findBySlug(slug);
    const genreIds = primary.genres.map((g) => g.id);
    if (genreIds.length === 0) return [];

    return this.repo
      .createQueryBuilder('d')
      .innerJoin('d.genres', 'g')
      .leftJoinAndSelect('d.genres', 'gs')
      .where('g.id IN (:...ids)', { ids: genreIds })
      .andWhere('d.id != :self', { self: primary.id })
      .andWhere('d.isPublished = 1')
      .orderBy('d.ratingAvg', 'DESC')
      .take(limit)
      .getMany();
  }

  private applyFilters(qb: SelectQueryBuilder<Drama>, dto: ListDramasDto): void {
    if (dto.type) qb.andWhere('d.type = :t', { t: dto.type });
    if (dto.status) qb.andWhere('d.status = :st', { st: dto.status });
    if (dto.year) qb.andWhere('d.releaseYear = :yr', { yr: dto.year });
    if (dto.genre_slug) {
      qb.innerJoin('d.genres', 'gf', 'gf.slug = :gs', { gs: dto.genre_slug });
    }
    if (dto.q) {
      qb.andWhere('d.title LIKE :q', { q: `%${dto.q}%` });
    }
  }

  private applySort(qb: SelectQueryBuilder<Drama>, sort?: string): void {
    switch (sort) {
      case 'popular':
        qb.orderBy('d.ratingCount', 'DESC').addOrderBy('d.ratingAvg', 'DESC');
        break;
      case 'rating':
        qb.orderBy('d.ratingAvg', 'DESC').addOrderBy('d.ratingCount', 'DESC');
        break;
      case 'newest':
      default:
        qb.orderBy('d.publishedAt', 'DESC').addOrderBy('d.createdAt', 'DESC');
    }
  }
}
