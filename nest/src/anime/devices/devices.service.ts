import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { DeviceTokenEntity } from './entities/device-token.entity';
import { FcmService } from '../fcm/fcm.service';

const UNINSTALL_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);
  private pinging = false;

  constructor(
    @InjectRepository(DeviceTokenEntity, 'anime')
    private readonly repo: Repository<DeviceTokenEntity>,
    private readonly fcm: FcmService,
  ) {}

  async upsertDevice(
    token: string,
    country?: string,
    appVersion?: string,
    deviceModel?: string,
  ): Promise<void> {
    await this.repo.manager.query(
      `INSERT INTO device_tokens
         (fcm_token, country, app_version, device_model, status, ping_failures, registered_at, last_active_at)
       VALUES (?, ?, ?, ?, 'active', 0, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         country        = COALESCE(VALUES(country),      country),
         app_version    = COALESCE(VALUES(app_version),  app_version),
         device_model   = COALESCE(VALUES(device_model), device_model),
         status         = 'active',
         ping_failures  = 0,
         uninstalled_at = NULL,
         last_active_at = NOW()`,
      [token, country || null, appVersion || null, deviceModel || null],
    );
  }

  async getStats() {
    const [total, active, uninstalled, dailyInstalls] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { status: 'active' } }),
      this.repo.count({ where: { status: 'uninstalled' } }),
      this.repo
        .createQueryBuilder('d')
        .select('DATE(d.registered_at)', 'date')
        .addSelect('COUNT(*)', 'count')
        .where('d.registered_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)')
        .groupBy('DATE(d.registered_at)')
        .orderBy('date', 'ASC')
        .getRawMany<{ date: string; count: string }>(),
    ]);
    return {
      total,
      active,
      uninstalled,
      uninstallRate: total > 0 ? Math.round((uninstalled / total) * 100) : 0,
      dailyInstalls,
    };
  }

  async getDevices(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const qb = this.repo
      .createQueryBuilder('d')
      .orderBy('d.registeredAt', 'DESC')
      .skip(skip)
      .take(limit);
    if (status === 'active' || status === 'uninstalled') {
      qb.where('d.status = :status', { status });
    }
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  @Cron('0 2 * * *')
  async pingAllActive(): Promise<{ total: number; uninstalled: number; errors: number }> {
    if ((process.env.NODE_APP_INSTANCE ?? '0') !== '0') {
      return { total: 0, uninstalled: 0, errors: 0 };
    }
    if (this.pinging) {
      this.logger.warn('Ping already running — skipping');
      return { total: 0, uninstalled: 0, errors: 0 };
    }
    if (!this.fcm.isEnabled) {
      this.logger.warn('FCM disabled — skipping ping');
      return { total: 0, uninstalled: 0, errors: 0 };
    }

    this.pinging = true;
    try {
      const tokens = await this.repo.find({
        where: { status: 'active' },
        select: ['id', 'fcmToken'],
      });

      if (tokens.length === 0) {
        this.logger.log('No active tokens to ping');
        return { total: 0, uninstalled: 0, errors: 0 };
      }

      this.logger.log(`Pinging ${tokens.length} active device(s)...`);

      let uninstalled = 0;
      let errors = 0;
      const BATCH = 500;

      for (let i = 0; i < tokens.length; i += BATCH) {
        const batch = tokens.slice(i, i + BATCH);
        const result = await this.fcm.pingTokens(batch.map((t) => t.fcmToken));

        for (let j = 0; j < result.responses.length; j++) {
          const resp = result.responses[j];
          const device = batch[j];

          if (resp.success) {
            await this.repo.update(device.id, { lastActiveAt: new Date(), pingFailures: 0 });
          } else if (resp.error && UNINSTALL_CODES.has(resp.error.code)) {
            await this.repo.update(device.id, {
              status: 'uninstalled',
              uninstalledAt: new Date(),
            });
            uninstalled++;
          } else {
            await this.repo.increment({ id: device.id }, 'pingFailures', 1);
            errors++;
          }
        }
      }

      this.logger.log(
        `Ping done: ${tokens.length} pinged, ${uninstalled} uninstalled, ${errors} errors`,
      );
      return { total: tokens.length, uninstalled, errors };
    } finally {
      this.pinging = false;
    }
  }
}
