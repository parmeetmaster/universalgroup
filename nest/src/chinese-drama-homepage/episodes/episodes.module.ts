import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CdEpisode } from '../entities/episode.entity';
import { CdDrama } from '../entities/drama.entity';
import { CdEpisodesController } from './episodes.controller';
import { CdEpisodesService } from './episodes.service';

@Module({
  imports: [TypeOrmModule.forFeature([CdEpisode, CdDrama], 'chinese-drama')],
  controllers: [CdEpisodesController],
  providers: [CdEpisodesService],
  exports: [CdEpisodesService],
})
export class CdEpisodesModule {}
