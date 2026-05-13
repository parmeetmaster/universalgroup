import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisteredCountryEntity } from './entities/registered-country.entity';

@Injectable()
export class CountriesRegistry {
  private readonly logger = new Logger(CountriesRegistry.name);

  constructor(
    @InjectRepository(RegisteredCountryEntity, 'anime')
    private readonly repo: Repository<RegisteredCountryEntity>,
  ) {}

  async add(countryRaw: string | undefined): Promise<boolean> {
    if (!countryRaw) return false;
    const cc = countryRaw.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) return false;

    const result = await this.repo
      .createQueryBuilder()
      .insert()
      .into(RegisteredCountryEntity)
      .values({ code: cc })
      .orIgnore()
      .execute();

    const inserted = (result.raw?.affectedRows ?? 0) > 0;
    if (inserted) this.logger.log(`New country registered: ${cc}`);
    return inserted;
  }

  async all(): Promise<string[]> {
    const rows = await this.repo.find({ select: { code: true }, order: { code: 'ASC' } });
    return rows.map((r) => r.code);
  }
}

/** @deprecated Use CountriesRegistry instead */
export const CountriesRegistryService = CountriesRegistry;
