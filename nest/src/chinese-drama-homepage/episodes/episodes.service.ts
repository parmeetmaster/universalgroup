import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CdEpisode } from '../entities/episode.entity';
import { CdDrama } from '../entities/drama.entity';
import { CreateEpisodeDto, BulkCreateEpisodesDto, UpdateEpisodeDto } from './episodes.dto';

@Injectable()
export class CdEpisodesService {
  constructor(
    @InjectRepository(CdEpisode, 'chinese-drama')
    private readonly episodeRepo: Repository<CdEpisode>,
    @InjectRepository(CdDrama, 'chinese-drama')
    private readonly dramaRepo: Repository<CdDrama>,
  ) {}

  async create(dto: CreateEpisodeDto): Promise<CdEpisode> {
    const drama = await this.dramaRepo.findOne({ where: { dramaId: dto.dramaId } });
    if (!drama) throw new NotFoundException(`Drama not found: ${dto.dramaId}`);

    const episode = this.episodeRepo.create({
      dramaSno: drama.sno,
      episodeNumber: dto.episodeNumber,
      title: dto.title ?? null,
      sourceUrl: dto.sourceUrl,
      sourceType: dto.sourceType ?? 'mp4',
      duration: dto.duration ?? null,
      thumbnailUrl: dto.thumbnailUrl ?? null,
      isVip: dto.isVip ?? false,
      isSpecial: dto.isSpecial ?? false,
    });

    const saved = await this.episodeRepo.save(episode);
    await this.updateEpisodeCount(drama.sno);
    return saved;
  }

  async bulkCreate(dto: BulkCreateEpisodesDto): Promise<{ created: number }> {
    const drama = await this.dramaRepo.findOne({ where: { dramaId: dto.dramaId } });
    if (!drama) throw new NotFoundException(`Drama not found: ${dto.dramaId}`);

    const entities = dto.episodes.map((ep) =>
      this.episodeRepo.create({
        dramaSno: drama.sno,
        episodeNumber: ep.episodeNumber,
        title: ep.title ?? null,
        sourceUrl: ep.sourceUrl,
        sourceType: ep.sourceType ?? 'mp4',
        duration: ep.duration ?? null,
        thumbnailUrl: ep.thumbnailUrl ?? null,
        isVip: ep.isVip ?? false,
        isSpecial: ep.isSpecial ?? false,
      }),
    );

    const saved = await this.episodeRepo.save(entities);
    await this.updateEpisodeCount(drama.sno);
    return { created: saved.length };
  }

  async findByDrama(dramaId: string, page = 1, limit = 50): Promise<{ data: CdEpisode[]; total: number; page: number; totalPages: number }> {
    const drama = await this.dramaRepo.findOne({ where: { dramaId } });
    if (!drama) throw new NotFoundException(`Drama not found: ${dramaId}`);

    const pageNum = Math.max(1, page);
    const take = Math.min(Math.max(1, limit), 200);
    const skip = (pageNum - 1) * take;

    const [data, total] = await this.episodeRepo.findAndCount({
      where: { dramaSno: drama.sno },
      order: { episodeNumber: 'ASC' },
      skip,
      take,
    });

    return { data, total, page: pageNum, totalPages: Math.ceil(total / take) };
  }

  async findOne(id: number): Promise<CdEpisode> {
    const episode = await this.episodeRepo.findOne({ where: { id }, relations: ['drama'] });
    if (!episode) throw new NotFoundException(`Episode not found: ${id}`);
    return episode;
  }

  async update(id: number, dto: UpdateEpisodeDto): Promise<CdEpisode> {
    const episode = await this.findOne(id);
    Object.assign(episode, dto);
    return this.episodeRepo.save(episode);
  }

  async remove(id: number): Promise<{ success: true }> {
    const episode = await this.findOne(id);
    const dramaSno = episode.dramaSno;
    await this.episodeRepo.remove(episode);
    await this.updateEpisodeCount(dramaSno);
    return { success: true };
  }

  async getStats(): Promise<{ totalEpisodes: number; dramasWithEpisodes: number }> {
    const totalEpisodes = await this.episodeRepo.count();
    const result = await this.episodeRepo
      .createQueryBuilder('e')
      .select('COUNT(DISTINCT e.drama_sno)', 'count')
      .getRawOne();
    return { totalEpisodes, dramasWithEpisodes: parseInt(result?.count ?? '0', 10) };
  }

  private async updateEpisodeCount(dramaSno: number): Promise<void> {
    const count = await this.episodeRepo.count({ where: { dramaSno } });
    await this.dramaRepo.update(dramaSno, { episodeCount: count });
  }
}
