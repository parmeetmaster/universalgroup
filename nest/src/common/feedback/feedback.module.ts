import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppFeedbackEntity } from './entities/app-feedback.entity';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [
    // Dedicated "common" connection. Defaults to the shared server DB so no new
    // provisioning is needed; override with COMMON_DB_* env vars if desired.
    TypeOrmModule.forRootAsync({
      name: 'common',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('COMMON_DB_HOST', config.get('ANIME_DB_HOST', '194.163.133.119')),
        port: parseInt(config.get('COMMON_DB_PORT', config.get('ANIME_DB_PORT', '3306')), 10),
        username: config.get('COMMON_DB_USER', config.get('ANIME_DB_USER', 'anime_downloader')),
        password: config.get('COMMON_DB_PASS', config.get('ANIME_DB_PASS', '')),
        database: config.get('COMMON_DB_NAME', config.get('ANIME_DB_NAME', 'anime_downloader')),
        entities: [AppFeedbackEntity],
        synchronize: false,
        charset: 'utf8mb4',
        timezone: 'Z',
      }),
    }),
    TypeOrmModule.forFeature([AppFeedbackEntity], 'common'),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
