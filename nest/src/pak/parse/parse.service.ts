import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ParseSource } from '../entities/parse-source.entity';
import { ParseRun } from '../entities/parse-run.entity';
import { EpisodeVideo } from '../entities/episode-video.entity';
import { Episode } from '../entities/episode.entity';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { UpsertVideoDto } from './dto/upsert-video.dto';
import { ParseRunStatusEnum } from '../entities/enums';

@Injectable()
export class PakParseService {
  constructor(
    @InjectRepository(ParseSource, 'pak') private readonly sourceRepo: Repository<ParseSource>,
    @InjectRepository(ParseRun, 'pak') private readonly runRepo: Repository<ParseRun>,
    @InjectRepository(EpisodeVideo, 'pak') private readonly videoRepo: Repository<EpisodeVideo>,
    @InjectRepository(Episode, 'pak') private readonly episodeRepo: Repository<Episode>,
  ) {}

  // --- parse_sources ---

  listSources(): Promise<ParseSource[]> {
    return this.sourceRepo.find({ order: { priority: 'ASC', name: 'ASC' } });
  }

  createSource(dto: CreateSourceDto): Promise<ParseSource> {
    return this.sourceRepo.save(this.sourceRepo.create({
      name: dto.name,
      slug: dto.slug,
      baseUrl: dto.baseUrl,
      driver: dto.driver,
      config: dto.config ?? null,
      priority: dto.priority ?? 100,
      isActive: dto.isActive ?? 1,
    }));
  }

  async updateSource(id: string, dto: UpdateSourceDto): Promise<ParseSource> {
    const src = await this.sourceRepo.findOne({ where: { id } });
    if (!src) throw new NotFoundException('Source not found');
    Object.assign(src, dto);
    return this.sourceRepo.save(src);
  }

  async deleteSource(id: string): Promise<void> {
    const res = await this.sourceRepo.delete(id);
    if (!res.affected) throw new NotFoundException('Source not found');
  }

  // --- episode_videos ---

  async upsertVideo(dto: UpsertVideoDto): Promise<EpisodeVideo> {
    const ep = await this.episodeRepo.findOne({ where: { id: dto.episodeId } });
    if (!ep) throw new NotFoundException('Episode not found');

    const existing = await this.videoRepo.findOne({
      where: {
        episodeId: dto.episodeId,
        sourceId: dto.sourceId ?? IsNull(),
        quality: dto.quality ?? ('auto' as any),
      },
    });

    if (existing) {
      Object.assign(existing, {
        url: dto.url,
        format: dto.format,
        label: dto.label ?? existing.label,
        language: dto.language ?? existing.language,
        subtitleUrl: dto.subtitleUrl ?? existing.subtitleUrl,
        headers: dto.headers ?? existing.headers,
        priority: dto.priority ?? existing.priority,
        isActive: dto.isActive ?? existing.isActive,
        lastVerifiedAt: new Date(),
      });
      return this.videoRepo.save(existing);
    }

    const video = this.videoRepo.create({
      episodeId: dto.episodeId,
      sourceId: dto.sourceId ?? null,
      label: dto.label ?? null,
      url: dto.url,
      format: dto.format,
      quality: (dto.quality ?? 'auto') as any,
      language: dto.language ?? 'ur',
      subtitleUrl: dto.subtitleUrl ?? null,
      headers: dto.headers ?? null,
      priority: dto.priority ?? 100,
      isActive: dto.isActive ?? 1,
      lastVerifiedAt: new Date(),
    });
    return this.videoRepo.save(video);
  }

  listVideosForEpisode(episodeId: string): Promise<EpisodeVideo[]> {
    return this.videoRepo.find({
      where: { episodeId },
      order: { priority: 'ASC', quality: 'DESC' },
      relations: { source: true },
    });
  }

  async deleteVideo(id: string): Promise<void> {
    const res = await this.videoRepo.delete(id);
    if (!res.affected) throw new NotFoundException('Video not found');
  }

  // --- parse_runs ---

  listRuns(limit = 50): Promise<ParseRun[]> {
    return this.runRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: { source: true, drama: true, episode: true },
    });
  }

  async logRun(
    data: Partial<ParseRun> & { status: ParseRunStatusEnum },
  ): Promise<ParseRun> {
    return this.runRepo.save(this.runRepo.create(data));
  }
}
