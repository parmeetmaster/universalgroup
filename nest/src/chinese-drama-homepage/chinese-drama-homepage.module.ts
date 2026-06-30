import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CdAppConfig } from './entities/app-config.entity';
import { CdDrama } from './entities/drama.entity';
import { CdEpisode } from './entities/episode.entity';
import { CdGenre } from './entities/genre.entity';
import { CdUser } from './entities/user.entity';
import { CdConfigModule } from './config/config.module';
import { CdEpisodesModule } from './episodes/episodes.module';
import { ExploreModule } from './explore/explore.module';
import { YouTubeModule } from './youtube/youtube.module';
import { CdUsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: 'chinese-drama',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('CHINESE_DRAMA_DB_HOST', '194.163.133.119'),
        port: parseInt(config.get('CHINESE_DRAMA_DB_PORT', '3306'), 10),
        username: config.get('CHINESE_DRAMA_DB_USER', 'chinese_drama'),
        password: config.get('CHINESE_DRAMA_DB_PASS', ''),
        database: config.get('CHINESE_DRAMA_DB_NAME', 'chinese_drama'),
        entities: [CdAppConfig, CdDrama, CdEpisode, CdGenre, CdUser],
        synchronize: false,
        charset: 'utf8mb4',
        timezone: 'Z',
      }),
    }),
    CdConfigModule,
    CdEpisodesModule,
    ExploreModule,
    YouTubeModule,
    CdUsersModule,
  ],
})
export class ChineseDramaHomepageModule {}
