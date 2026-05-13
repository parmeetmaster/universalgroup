import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { YoutubeShortEntity } from '../entities/youtube-short.entity';
import { getStreamingUrl } from '../utils/ytdlp.util';

const API_KEY = 'AIzaSyAg0Dt75dWVvZG03zc2uTf-buCB19Fr1h4';
const MAX_VIDEOS = 2000;
const FETCH_PER_RUN = 50;

const SEARCH_QUERIES = [
  'aviation airline news shorts',
  'airplane landing takeoff shorts',
  'airport plane spotting',
  'boeing airbus aviation',
  'emirates lufthansa airline',
  'flight cockpit pilot aviation',
  'air india indigo airline news',
  'aircraft engine aviation',
  'airline business class first class',
  'aviation accident investigation',
];

@Injectable()
export class YoutubeShortsCronService {
  private readonly logger = new Logger(YoutubeShortsCronService.name);
  private queryIndex = 0;

  constructor(
    @InjectRepository(YoutubeShortEntity, 'aviation')
    private readonly repo: Repository<YoutubeShortEntity>,
    private readonly http: HttpService,
  ) {}

  // Run daily at 3:00 AM
  @Cron('0 3 * * *')
  async fetchAndSaveShorts() {
    this.logger.log('Starting daily YouTube Shorts fetch...');

    try {
      // Pick 2 queries per run (rotating through all queries)
      const q1 = SEARCH_QUERIES[this.queryIndex % SEARCH_QUERIES.length];
      const q2 = SEARCH_QUERIES[(this.queryIndex + 1) % SEARCH_QUERIES.length];
      this.queryIndex += 2;

      const videos1 = await this.searchYouTube(q1, 25);
      const videos2 = await this.searchYouTube(q2, 25);

      const allVideos = [...videos1, ...videos2];
      this.logger.log(`Fetched ${allVideos.length} videos from YouTube API`);

      // Bulk insert, skip duplicates
      let inserted = 0;
      for (const video of allVideos) {
        try {
          await this.repo
            .createQueryBuilder()
            .insert()
            .into(YoutubeShortEntity)
            .values({
              youtubeUrl: video.url,
              title: video.title,
              thumbnailUrl: video.thumbnail,
              durationSeconds: 0,
              isActive: true,
              sortOrder: 0,
            })
            .orIgnore()
            .execute();
          inserted++;
        } catch {
          // Duplicate or other error, skip
        }
      }

      this.logger.log(`Inserted ${inserted} new shorts (duplicates skipped)`);

      // Enforce max 2000 videos - delete oldest beyond limit
      await this.enforceMaxLimit();

      this.logger.log('Daily YouTube Shorts fetch complete');
    } catch (err) {
      this.logger.error(`YouTube Shorts cron failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  // Pre-warm streaming URL cache every 45 minutes for top shorts
  @Cron('*/45 * * * *')
  async warmStreamingCache() {
    this.logger.log('Starting streaming URL cache warm-up...');

    try {
      // Fetch top 60 active shorts (covers first 3 pages of 20)
      const shorts = await this.repo.find({
        where: { isActive: true },
        order: { sortOrder: 'DESC', createdAt: 'DESC' },
        take: 60,
      });

      let success = 0;
      let failed = 0;
      const CONCURRENCY = 3;

      for (let i = 0; i < shorts.length; i += CONCURRENCY) {
        const batch = shorts.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          batch.map(async (short) => {
            try {
              const url = await getStreamingUrl(short.youtubeUrl);
              return url ? true : false;
            } catch {
              return false;
            }
          }),
        );
        success += results.filter(Boolean).length;
        failed += results.filter((r) => !r).length;
      }

      this.logger.log(`Cache warm-up done: ${success} cached, ${failed} failed out of ${shorts.length}`);
    } catch (err) {
      this.logger.error(`Cache warm-up failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  private async searchYouTube(query: string, maxResults: number): Promise<{ url: string; title: string; thumbnail: string }[]> {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoDuration=short&maxResults=${maxResults}&key=${API_KEY}`;

    const { data } = await firstValueFrom(
      this.http.get(url, { timeout: 15000 }),
    );

    const videos: { url: string; title: string; thumbnail: string }[] = [];
    for (const item of data.items || []) {
      const videoId = item.id?.videoId;
      if (!videoId) continue;

      videos.push({
        url: `https://www.youtube.com/shorts/${videoId}`,
        title: item.snippet?.title || '',
        thumbnail: item.snippet?.thumbnails?.high?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });
    }

    return videos;
  }

  private async enforceMaxLimit() {
    const total = await this.repo.count({ where: { isActive: true } });

    if (total > MAX_VIDEOS) {
      const excess = total - MAX_VIDEOS;
      this.logger.log(`Removing ${excess} oldest videos (total: ${total}, max: ${MAX_VIDEOS})`);

      // Find oldest IDs to delete
      const oldest = await this.repo.find({
        where: { isActive: true },
        order: { createdAt: 'ASC' },
        take: excess,
        select: ['id'],
      });

      if (oldest.length > 0) {
        const ids = oldest.map((v) => v.id);
        await this.repo.delete(ids);
        this.logger.log(`Deleted ${ids.length} oldest videos`);
      }
    }
  }
}
