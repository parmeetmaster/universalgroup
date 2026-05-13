import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Episode } from '../entities/episode.entity';
import { Drama } from '../entities/drama.entity';
import { PakSentNotification } from './sent-notification.entity';
import { PakFcmService } from './pak-fcm.service';
import { PakNotificationCronService } from './pak-notification-cron.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Episode, Drama, PakSentNotification], 'pak'),
  ],
  providers: [PakFcmService, PakNotificationCronService],
  exports: [PakFcmService],
})
export class PakNotificationsModule {}
