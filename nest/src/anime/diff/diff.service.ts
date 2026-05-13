import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EpisodeItem } from '../scraper/types';
import { SeenEpisodeEntity } from './entities/seen-episode.entity';

@Injectable()
export class DiffService implements OnModuleInit {
  private readonly logger = new Logger(DiffService.name);
  private primed = false;

  constructor(
    @InjectRepository(SeenEpisodeEntity, 'anime')
    private readonly repo: Repository<SeenEpisodeEntity>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    this.primed = count > 0;
    this.logger.log(
      this.primed
        ? `Seen-episodes table has ${count} rows — diff will notify on new entries`
        : 'Seen-episodes table is empty — first poll tick will prime without notifying',
    );
  }

  async diff(items: EpisodeItem[]): Promise<EpisodeItem[]> {
    if (items.length === 0) return [];

    const urls = items.map((i) => i.url);
    const existing = await this.repo.find({
      where: { url: In(urls) },
      select: { url: true },
    });
    const existingSet = new Set(existing.map((e) => e.url));
    const fresh = items.filter((i) => !existingSet.has(i.url));

    if (fresh.length === 0) return [];

    await this.repo
      .createQueryBuilder()
      .insert()
      .into(SeenEpisodeEntity)
      .values(fresh.map((i) => ({ url: i.url })))
      .orIgnore()
      .execute();

    if (!this.primed) {
      this.primed = true;
      this.logger.log(
        `Primed seen_episodes with ${fresh.length} rows — suppressing first-run notifications`,
      );
      return [];
    }
    return fresh;
  }
}
