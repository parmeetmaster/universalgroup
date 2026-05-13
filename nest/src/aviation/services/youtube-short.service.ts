import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { YoutubeShortEntity } from '../entities/youtube-short.entity';
import { YoutubeShortListResponseDto, YoutubeShortItemDto } from '../dto/youtube-short.dto';
import { buildPagination } from '../dto/pagination.dto';
import { getStreamingUrl } from '../utils/ytdlp.util';

function extractVideoId(url: string): string {
  const match = url.match(/(?:shorts\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || '';
}

@Injectable()
export class YoutubeShortService {
  private readonly logger = new Logger(YoutubeShortService.name);

  constructor(
    @InjectRepository(YoutubeShortEntity, 'aviation')
    private readonly repo: Repository<YoutubeShortEntity>,
  ) {}

  async addVideo(youtubeUrl: string): Promise<YoutubeShortItemDto> {
    if (!youtubeUrl || !youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
      throw new BadRequestException('Invalid YouTube URL');
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new BadRequestException('Could not extract video ID from URL');
    }

    const normalizedUrl = `https://www.youtube.com/shorts/${videoId}`;

    const existing = await this.repo.findOne({ where: { youtubeUrl: normalizedUrl } });
    if (existing) {
      throw new BadRequestException('This video is already added');
    }

    const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const short = this.repo.create({
      youtubeUrl: normalizedUrl,
      title: '',
      thumbnailUrl,
      durationSeconds: 0,
    });

    const saved = await this.repo.save(short);

    return this.toDto(saved, null);
  }

  async getVideos(page: number, limit: number): Promise<YoutubeShortListResponseDto> {
    const take = Math.min(limit, 20);
    const skip = (page - 1) * take;

    const [shorts, total] = await this.repo.findAndCount({
      where: { isActive: true },
      order: { sortOrder: 'DESC', createdAt: 'DESC' },
      take,
      skip,
    });

    const totalPages = Math.ceil(total / take) || 1;

    // Fetch streaming URLs with concurrency limit (3 at a time to avoid overwhelming yt-dlp)
    const videos: YoutubeShortItemDto[] = [];
    const CONCURRENCY = 3;
    for (let i = 0; i < shorts.length; i += CONCURRENCY) {
      const batch = shorts.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (short) => {
          const streamingUrl = await getStreamingUrl(short.youtubeUrl);
          return this.toDto(short, streamingUrl);
        }),
      );
      videos.push(...results);
    }

    return {
      pagination: buildPagination(page, totalPages),
      videos,
    };
  }

  async deleteVideo(id: number): Promise<void> {
    await this.repo.update(id, { isActive: false });
  }

  private toDto(short: YoutubeShortEntity, streamingUrl: string | null): YoutubeShortItemDto {
    return {
      id: short.id,
      videoId: extractVideoId(short.youtubeUrl),
      title: short.title,
      thumbnailUrl: short.thumbnailUrl,
      streamingUrl,
      durationSeconds: short.durationSeconds,
      youtubeUrl: short.youtubeUrl,
      createdAt: short.createdAt,
    };
  }
}
