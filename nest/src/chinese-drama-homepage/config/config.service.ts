import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CdGenre } from '../entities/genre.entity';
import { CdAppConfig } from '../entities/app-config.entity';
import { CdUpdateConfigDto } from './update-config.dto';
import { DramaLanguage, DramaOrigin, DramaSortBy, DramaType } from '../explore/explore.dto';

export interface CdAppConfigView {
  minBuildVersion: string;
  latestBuildVersion: string;
  forceUpdate: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  announcement: string | null;
  playStoreUrl: string | null;
  supportEmail: string | null;
  privacyUrl: string | null;
  termsUrl: string | null;
  updateViaLink: boolean;
  appUpdateLink: string | null;
  updatedAt: Date | null;
}

const FIELD_TO_KEY: Record<keyof Omit<CdAppConfigView, 'updatedAt'>, string> = {
  minBuildVersion: 'min_build_version',
  latestBuildVersion: 'latest_build_version',
  forceUpdate: 'force_update',
  maintenanceMode: 'maintenance_mode',
  maintenanceMessage: 'maintenance_message',
  announcement: 'announcement',
  playStoreUrl: 'play_store_url',
  supportEmail: 'support_email',
  privacyUrl: 'privacy_url',
  termsUrl: 'terms_url',
  updateViaLink: 'update_via_link',
  appUpdateLink: 'app_update_link',
};

const DEFAULTS: CdAppConfigView = {
  minBuildVersion: '1',
  latestBuildVersion: '1',
  forceUpdate: false,
  maintenanceMode: false,
  maintenanceMessage: null,
  announcement: null,
  playStoreUrl: null,
  supportEmail: null,
  privacyUrl: null,
  termsUrl: null,
  updateViaLink: true,
  appUpdateLink: null,
  updatedAt: null,
};

@Injectable()
export class CdConfigService implements OnModuleInit {
  private readonly logger = new Logger(CdConfigService.name);

  constructor(
    @InjectRepository(CdGenre, 'chinese-drama')
    private readonly genreRepo: Repository<CdGenre>,
    @InjectRepository(CdAppConfig, 'chinese-drama')
    private readonly configRepo: Repository<CdAppConfig>,
  ) {}

  async onModuleInit(): Promise<void> {
    const keys = Object.values(FIELD_TO_KEY);
    const existing = await this.configRepo.find({ where: { key: In(keys) } });
    const have = new Set(existing.map((r) => r.key));
    let seeded = 0;
    for (const [field, key] of Object.entries(FIELD_TO_KEY)) {
      if (have.has(key)) continue;
      await this.configRepo.query(
        'INSERT INTO `app_config` (`key`, `value`) VALUES (?, ?)',
        [key, JSON.stringify(DEFAULTS[field as keyof CdAppConfigView])],
      );
      seeded++;
    }
    if (seeded) this.logger.log(`Seeded ${seeded} app_config key(s)`);
  }

  async getAppConfig() {
    const [genres, configView] = await Promise.all([
      this.genreRepo.find({ select: ['id', 'name', 'slug'], order: { name: 'ASC' } }),
      this.getConfigView(),
    ]);

    const categories = {
      type: Object.values(DramaType),
      origin: Object.values(DramaOrigin),
      language: Object.values(DramaLanguage),
      sortBy: Object.values(DramaSortBy),
    };

    return { ...configView, genres, categories };
  }

  async updateConfig(dto: CdUpdateConfigDto) {
    for (const [field, key] of Object.entries(FIELD_TO_KEY)) {
      const incoming = (dto as Record<string, unknown>)[field];
      if (incoming === undefined) continue;
      await this.configRepo.query(
        'INSERT INTO `app_config` (`key`, `value`) VALUES (?, ?) ' +
          'ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [key, JSON.stringify(incoming)],
      );
    }
    return this.getAppConfig();
  }

  private async getConfigView(): Promise<CdAppConfigView> {
    const rows = await this.configRepo.find();
    const byKey = new Map(rows.map((r) => [r.key, r]));
    const latestUpdate = rows.reduce<Date | null>(
      (acc, r) => (!acc || r.updatedAt > acc ? r.updatedAt : acc),
      null,
    );
    const out = { ...DEFAULTS };
    for (const [field, key] of Object.entries(FIELD_TO_KEY)) {
      const row = byKey.get(key);
      if (row !== undefined) {
        (out as Record<string, unknown>)[field] = parseJsonValue(row.value);
      }
    }
    out.updatedAt = latestUpdate;
    return out;
  }
}

function parseJsonValue(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}
