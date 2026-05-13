import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockedCountryEntity } from './entities/blocked-country.entity';

@Injectable()
export class BlockedCountriesService implements OnModuleInit {
  private readonly logger = new Logger(BlockedCountriesService.name);
  private cache = new Set<string>();

  constructor(
    @InjectRepository(BlockedCountryEntity, 'anime')
    private readonly repo: Repository<BlockedCountryEntity>,
  ) {}

  async onModuleInit() {
    await this.refreshCache();
    this.logger.log(`Loaded ${this.cache.size} blocked countries from MySQL`);
  }

  private async refreshCache() {
    const rows = await this.repo.find({ select: { code: true } });
    this.cache = new Set(rows.map((r) => r.code.toUpperCase()));
  }

  isBlocked(countryRaw?: string): boolean {
    if (!countryRaw) return false;
    return this.cache.has(countryRaw.trim().toUpperCase());
  }

  all(): string[] {
    return Array.from(this.cache).sort();
  }

  async add(countryRaw: string): Promise<boolean> {
    const cc = this.normalize(countryRaw);
    const result = await this.repo
      .createQueryBuilder()
      .insert()
      .into(BlockedCountryEntity)
      .values({ code: cc })
      .orIgnore()
      .execute();
    const inserted = (result.raw?.affectedRows ?? 0) > 0;
    if (inserted) {
      this.cache.add(cc);
      this.logger.log(`Country blocked: ${cc}`);
    }
    return inserted;
  }

  async remove(countryRaw: string): Promise<boolean> {
    const cc = this.normalize(countryRaw);
    const result = await this.repo.delete({ code: cc });
    const removed = (result.affected ?? 0) > 0;
    if (removed) {
      this.cache.delete(cc);
      this.logger.log(`Country unblocked: ${cc}`);
    }
    return removed;
  }

  private normalize(countryRaw: string): string {
    const cc = countryRaw?.trim().toUpperCase() ?? '';
    if (!/^[A-Z]{2}$/.test(cc)) {
      throw new Error(`invalid country code: "${countryRaw}" (expect ISO-3166 alpha-2)`);
    }
    return cc;
  }
}
