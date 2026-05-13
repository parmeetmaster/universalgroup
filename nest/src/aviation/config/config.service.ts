import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AviationAppConfig } from '../entities/app-config.entity';
import { UpdateAppConfigDto } from './update-config.dto';

export interface AppConfigView {
  minAppVersion: string;
  latestAppVersion: string;
  forceUpdate: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  announcement: string | null;
  playStoreUrl: string | null;
  supportEmail: string | null;
  privacyUrl: string | null;
  termsUrl: string | null;
  updatedAt: Date | null;
}

const FIELD_TO_KEY: Record<keyof Omit<AppConfigView, 'updatedAt'>, string> = {
  minAppVersion: 'min_app_version',
  latestAppVersion: 'latest_app_version',
  forceUpdate: 'force_update',
  maintenanceMode: 'maintenance_mode',
  maintenanceMessage: 'maintenance_message',
  announcement: 'announcement',
  playStoreUrl: 'play_store_url',
  supportEmail: 'support_email',
  privacyUrl: 'privacy_url',
  termsUrl: 'terms_url',
};

const DEFAULTS: AppConfigView = {
  minAppVersion: '1.0.0',
  latestAppVersion: '1.0.0',
  forceUpdate: false,
  maintenanceMode: false,
  maintenanceMessage: null,
  announcement: null,
  playStoreUrl:
    'https://play.google.com/store/apps/details?id=com.aviation.news',
  supportEmail: 'support@aviationnews.app',
  privacyUrl: null,
  termsUrl: null,
  updatedAt: null,
};

@Injectable()
export class AviationAppConfigService implements OnModuleInit {
  private readonly logger = new Logger(AviationAppConfigService.name);

  constructor(
    @InjectRepository(AviationAppConfig, 'aviation')
    private readonly repo: Repository<AviationAppConfig>,
  ) {}

  async onModuleInit(): Promise<void> {
    const keys = Object.values(FIELD_TO_KEY);
    const existing = await this.repo.find({ where: { key: In(keys) } });
    const have = new Set(existing.map((r) => r.key));
    let seeded = 0;
    for (const [field, key] of Object.entries(FIELD_TO_KEY)) {
      if (have.has(key)) continue;
      await this.repo.query(
        'INSERT INTO `app_config` (`key`, `value`) VALUES (?, ?)',
        [key, JSON.stringify(DEFAULTS[field as keyof AppConfigView])],
      );
      seeded++;
    }
    if (seeded) this.logger.log(`Seeded ${seeded} app_config key(s)`);
  }

  async get(): Promise<AppConfigView> {
    const rows = await this.repo.find();
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

  async update(dto: UpdateAppConfigDto): Promise<AppConfigView> {
    for (const [field, key] of Object.entries(FIELD_TO_KEY)) {
      const incoming = (dto as Record<string, unknown>)[field];
      if (incoming === undefined) continue;
      await this.repo.query(
        'INSERT INTO `app_config` (`key`, `value`) VALUES (?, ?) ' +
          'ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [key, JSON.stringify(incoming)],
      );
    }
    return this.get();
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
