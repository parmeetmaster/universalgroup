import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { NotificationSettingEntity } from './entities/notification-setting.entity';
import { SentNotificationEntity } from './entities/sent-notification.entity';
import { YoutubeShortEntity } from './entities/youtube-short.entity';
import { AviationAppConfig } from './entities/app-config.entity';
import { AviationConfigModule } from './config/config.module';

import { SCRAPER_TOKEN } from './scrapers/scraper.interface';
import { ScraperFactory } from './scrapers/scraper.factory';
import { AviationA2ZScraper } from './scrapers/aviationa2z.scraper';
import { SimpleFlyingScraper } from './scrapers/simpleflying.scraper';
import { AqiScraper } from './scrapers/aqi.scraper';
import { FlightScraper } from './scrapers/flight.scraper';

import { AviationNewsService } from './services/aviation-news.service';
import { YoutubeShortService } from './services/youtube-short.service';

import { FirebaseService } from './notifications/firebase.service';
import { NotificationCronService } from './notifications/notification-cron.service';
import { YoutubeShortsCronService } from './cron/youtube-shorts-cron.service';

import { AviationNewsController } from './controllers/aviation-news.controller';
import { AqiController } from './controllers/aqi.controller';
import { FlightController } from './controllers/flight.controller';
import { NotificationController } from './controllers/notification.controller';
import { YoutubeShortController } from './controllers/youtube-short.controller';

@Module({
  imports: [
    HttpModule.register({ timeout: 15000, maxRedirects: 5 }),
    TypeOrmModule.forRootAsync({
      name: 'aviation',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('AVIATION_DB_HOST', '194.163.133.119'),
        port: parseInt(config.get('AVIATION_DB_PORT', '3306'), 10),
        username: config.get('AVIATION_DB_USER', 'aviation_news'),
        password: config.get('AVIATION_DB_PASS', ''),
        database: config.get('AVIATION_DB_NAME', 'aviation_news'),
        entities: [
          NotificationSettingEntity,
          SentNotificationEntity,
          YoutubeShortEntity,
          AviationAppConfig,
        ],
        synchronize: true,
        charset: 'utf8mb4',
        timezone: 'Z',
      }),
    }),
    TypeOrmModule.forFeature(
      [NotificationSettingEntity, SentNotificationEntity, YoutubeShortEntity, AviationAppConfig],
      'aviation',
    ),
    AviationConfigModule,
  ],
  controllers: [
    AviationNewsController,
    AqiController,
    FlightController,
    NotificationController,
    YoutubeShortController,
  ],
  providers: [
    AviationA2ZScraper,
    SimpleFlyingScraper,
    AqiScraper,
    FlightScraper,
    ScraperFactory,
    AviationNewsService,
    YoutubeShortService,
    FirebaseService,
    NotificationCronService,
    YoutubeShortsCronService,
    {
      provide: SCRAPER_TOKEN,
      useFactory: (factory: ScraperFactory) => factory.createScraper(),
      inject: [ScraperFactory],
    },
  ],
})
export class AviationModule {}
