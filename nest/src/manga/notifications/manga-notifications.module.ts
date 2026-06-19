import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeenChapterEntity } from './entities/seen-chapter.entity';
import { AsuraScraperService } from './asura-scraper.service';
import { MangaFcmService } from './manga-fcm.service';
import { MangaNotificationCronService } from './manga-notification-cron.service';
import { MangaNotificationsController } from './manga-notifications.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    TypeOrmModule.forFeature([SeenChapterEntity], 'manga'),
  ],
  providers: [AsuraScraperService, MangaFcmService, MangaNotificationCronService],
  controllers: [MangaNotificationsController],
})
export class MangaNotificationsModule {}
