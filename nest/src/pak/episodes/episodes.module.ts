import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drama } from '../entities/drama.entity';
import { Season } from '../entities/season.entity';
import { Episode } from '../entities/episode.entity';
import { EpisodeVideo } from '../entities/episode-video.entity';
import { PakEpisodesController } from './episodes.controller';
import { PakEpisodesService } from './episodes.service';
import { PakParseModule } from '../parse/parse.module';
import { PakSearxModule } from '../search-engine/searx.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Drama, Season, Episode, EpisodeVideo], 'pak'),
    PakParseModule,
    PakSearxModule,
  ],
  controllers: [PakEpisodesController],
  providers: [PakEpisodesService],
  exports: [PakEpisodesService],
})
export class PakEpisodesModule {}
