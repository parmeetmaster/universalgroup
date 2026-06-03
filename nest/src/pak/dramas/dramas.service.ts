import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Drama } from '../entities/drama.entity';
import { Episode } from '../entities/episode.entity';
import { HomeRail } from '../entities/home-rail.entity';
import { DramaStatusEnum } from '../entities/enums';
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

      case 'latest-releases': {
        const subQuery = this.episodeRepo
          .createQueryBuilder('e')
          .select('e.drama_id', 'drama_id')
          .addSelect('MAX(COALESCE(e.air_date, e.created_at))', 'last_ep')
          .groupBy('e.drama_id')
          .getQuery();

        qb = qb
          .innerJoin(`(${subQuery})`, 'le', 'le.drama_id = d.id')
          .orderBy('le.last_ep', 'DESC');
        break;
      }

      case 'new-dramas':
        qb = qb.orderBy('d.publishedAt', 'DESC').addOrderBy('d.createdAt', 'DESC');
        break;

      case 'monthly-popular':
        qb = qb.orderBy('d.monthlyViews', 'DESC').addOrderBy('d.totalLikes', 'DESC');
        break;

      case 'completed':
        qb = qb
          .andWhere('d.status = :status', { status: DramaStatusEnum.COMPLETED })
          .orderBy('d.updatedAt', 'DESC');
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
