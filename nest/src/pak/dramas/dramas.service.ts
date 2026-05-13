import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Drama } from '../entities/drama.entity';
import { Episode } from '../entities/episode.entity';
import { ListDramasDto } from './dto/list-dramas.dto';
import { Paginated } from '../common/pagination.dto';

@Injectable()
export class PakDramasService {
  constructor(
    @InjectRepository(Drama, 'pak') private readonly repo: Repository<Drama>,
    @InjectRepository(Episode, 'pak') private readonly episodeRepo: Repository<Episode>,
  ) {}

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
