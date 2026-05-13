import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Drama } from '../entities/drama.entity';
import { Season } from '../entities/season.entity';
import { Episode } from '../entities/episode.entity';
import { Genre } from '../entities/genre.entity';
import { CreateDramaDto } from './dto/create-drama.dto';
import { UpdateDramaDto } from './dto/update-drama.dto';
import { CreateSeasonDto } from './dto/create-season.dto';
import { CreateEpisodeDto } from './dto/create-episode.dto';

@Injectable()
export class PakAdminService {
  constructor(
    @InjectRepository(Drama, 'pak') private readonly dramaRepo: Repository<Drama>,
    @InjectRepository(Season, 'pak') private readonly seasonRepo: Repository<Season>,
    @InjectRepository(Episode, 'pak') private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(Genre, 'pak') private readonly genreRepo: Repository<Genre>,
  ) {}

  async listAllDramas(): Promise<Drama[]> {
    return this.dramaRepo.find({
      order: { updatedAt: 'DESC' },
      relations: ['genres'],
    });
  }

  async createDrama(dto: CreateDramaDto): Promise<Drama> {
    const genres = dto.genreSlugs?.length
      ? await this.genreRepo.find({ where: { slug: In(dto.genreSlugs) } })
      : [];
    const drama = this.dramaRepo.create({
      title: dto.title,
      slug: dto.slug,
      synopsis: dto.synopsis ?? null,
      posterUrl: dto.posterUrl ?? null,
      backdropUrl: dto.backdropUrl ?? null,
      trailerUrl: dto.trailerUrl ?? null,
      type: dto.type,
      status: dto.status,
      releaseYear: dto.releaseYear ?? null,
      language: dto.language ?? 'ur',
      isFeatured: dto.isFeatured ?? 0,
      isPublished: dto.isPublished ?? 0,
      publishedAt: dto.isPublished ? new Date() : null,
      sourceUrl: dto.sourceUrl ?? null,
      genres,
    });
    return this.dramaRepo.save(drama);
  }

  async updateDrama(id: string, dto: UpdateDramaDto): Promise<Drama> {
    const drama = await this.dramaRepo.findOne({
      where: { id },
      relations: { genres: true },
    });
    if (!drama) throw new NotFoundException('Drama not found');

    Object.assign(drama, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.synopsis !== undefined && { synopsis: dto.synopsis ?? null }),
      ...(dto.posterUrl !== undefined && { posterUrl: dto.posterUrl ?? null }),
      ...(dto.backdropUrl !== undefined && { backdropUrl: dto.backdropUrl ?? null }),
      ...(dto.trailerUrl !== undefined && { trailerUrl: dto.trailerUrl ?? null }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.releaseYear !== undefined && { releaseYear: dto.releaseYear ?? null }),
      ...(dto.language !== undefined && { language: dto.language }),
      ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
      ...(dto.sourceUrl !== undefined && { sourceUrl: dto.sourceUrl ?? null }),
      ...(dto.isPublished !== undefined && {
        isPublished: dto.isPublished,
        publishedAt: dto.isPublished && !drama.publishedAt ? new Date() : drama.publishedAt,
      }),
    });

    if (dto.genreSlugs !== undefined) {
      drama.genres = dto.genreSlugs.length
        ? await this.genreRepo.find({ where: { slug: In(dto.genreSlugs) } })
        : [];
    }
    return this.dramaRepo.save(drama);
  }

  async deleteDrama(id: string): Promise<void> {
    const res = await this.dramaRepo.softDelete(id);
    if (!res.affected) throw new NotFoundException('Drama not found');
  }

  createSeason(dto: CreateSeasonDto): Promise<Season> {
    return this.seasonRepo.save(this.seasonRepo.create(dto));
  }

  async deleteSeason(id: string): Promise<void> {
    const res = await this.seasonRepo.delete(id);
    if (!res.affected) throw new NotFoundException('Season not found');
  }

  async createEpisode(dto: CreateEpisodeDto): Promise<Episode> {
    const ep = await this.episodeRepo.save(this.episodeRepo.create(dto));
    await this.recomputeCounts(dto.dramaId);
    return ep;
  }

  async deleteEpisode(id: string): Promise<void> {
    const ep = await this.episodeRepo.findOne({ where: { id } });
    if (!ep) throw new NotFoundException('Episode not found');
    await this.episodeRepo.delete(id);
    await this.recomputeCounts(ep.dramaId);
  }

  private async recomputeCounts(dramaId: string): Promise<void> {
    const total = await this.episodeRepo.count({ where: { dramaId } });
    const seasons = await this.seasonRepo.count({ where: { dramaId } });
    await this.dramaRepo.update(dramaId, {
      totalEpisodes: total,
      totalSeasons: seasons || 1,
    });
  }
}
