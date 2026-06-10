import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeenEpisodeEntity } from './diff/entities/seen-episode.entity';
import { RegisteredCountryEntity } from './fcm/entities/registered-country.entity';
import { BlockedCountryEntity } from './fcm/entities/blocked-country.entity';
import { KvEntryEntity } from './kv/entities/kv-entry.entity';
import { UserEntity } from './auth/user.entity';
import { ErrorReportEntity } from './reports/entities/error-report.entity';
import { DeviceTokenEntity } from './devices/entities/device-token.entity';
import { DeviceGraceEntity } from './devices/entities/device-grace.entity';
import { ProxyEntity } from './proxy/entities/proxy.entity';
import { VpnConfigEntity } from './proxy/entities/vpn-config.entity';
import { SiteVisitEntity } from './analytics/entities/site-visit.entity';
import { ScraperModule } from './scraper/scraper.module';
import { DiffModule } from './diff/diff.module';
import { FcmModule } from './fcm/fcm.module';
import { KvModule } from './kv/kv.module';
import { ReportsModule } from './reports/reports.module';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { AdminModule } from './admin/admin.module';
import { PollerModule } from './poller/poller.module';
import { LegacyModule } from './legacy/legacy.module';
import { ProxyModule } from './proxy/proxy.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AnimeController } from './anime.controller';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: 'anime',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('ANIME_DB_HOST', '194.163.133.119'),
        port: parseInt(config.get('ANIME_DB_PORT', '3306'), 10),
        username: config.get('ANIME_DB_USER', 'anime_downloader'),
        password: config.get('ANIME_DB_PASS', ''),
        database: config.get('ANIME_DB_NAME', 'anime_downloader'),
        entities: [
          SeenEpisodeEntity,
          RegisteredCountryEntity,
          BlockedCountryEntity,
          KvEntryEntity,
          UserEntity,
          ErrorReportEntity,
          DeviceTokenEntity,
          DeviceGraceEntity,
          ProxyEntity,
          VpnConfigEntity,
          SiteVisitEntity,
        ],
        synchronize: true,
        charset: 'utf8mb4',
        timezone: 'Z',
      }),
    }),
    ScraperModule,
    DiffModule,
    FcmModule,
    KvModule,
    ReportsModule,
    AuthModule,
    DevicesModule,
    AdminModule,
    PollerModule,
    LegacyModule,
    ProxyModule,
    AnalyticsModule,
  ],
  controllers: [AnimeController],
})
export class AnimeModule {}
