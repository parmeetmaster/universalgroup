import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminUser } from './entities/admin-user.entity';
import { AppSetting } from './entities/app-setting.entity';
import { CastMember } from './entities/cast-member.entity';
import { Drama } from './entities/drama.entity';
import { Episode } from './entities/episode.entity';
import { EpisodeVideo } from './entities/episode-video.entity';
import { Genre } from './entities/genre.entity';
import { HomeRail } from './entities/home-rail.entity';
import { HomeRailItem } from './entities/home-rail-item.entity';
import { ParseRun } from './entities/parse-run.entity';
import { ParseSource } from './entities/parse-source.entity';
import { Season } from './entities/season.entity';

import { PakDramasModule } from './dramas/dramas.module';
import { PakEpisodesModule } from './episodes/episodes.module';
import { PakGenresModule } from './genres/genres.module';
import { PakSearchModule } from './search/search.module';
import { PakHomeModule } from './home/home.module';
import { PakAuthModule } from './auth/auth.module';
import { PakAdminModule } from './admin/admin.module';
import { PakConfigModule } from './config/config.module';
import { PakParseModule } from './parse/parse.module';
import { PakHealthModule } from './health/health.module';
import { PakPagesModule } from './pages/pages.module';
import { PakNotificationsModule } from './notifications/pak-notifications.module';
import { PakSentNotification } from './notifications/sent-notification.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: 'pak',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('PAK_DB_HOST', '194.163.133.119'),
        port: parseInt(config.get('PAK_DB_PORT', '3306'), 10),
        username: config.get('PAK_DB_USER', 'pakistani_serials'),
        password: config.get('PAK_DB_PASS', ''),
        database: config.get('PAK_DB_NAME', 'pakistani_serials'),
        entities: [
          AdminUser,
          AppSetting,
          CastMember,
          Drama,
          Episode,
          EpisodeVideo,
          Genre,
          HomeRail,
          HomeRailItem,
          ParseRun,
          ParseSource,
          Season,
          PakSentNotification,
        ],
        synchronize: false,
        charset: 'utf8mb4',
        timezone: 'Z',
      }),
    }),
    PakAuthModule,
    PakDramasModule,
    PakEpisodesModule,
    PakGenresModule,
    PakSearchModule,
    PakHomeModule,
    PakAdminModule,
    PakConfigModule,
    PakParseModule,
    PakHealthModule,
    PakPagesModule,
    PakNotificationsModule,
  ],
})
export class PakModule {}
