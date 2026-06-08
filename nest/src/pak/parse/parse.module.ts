import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParseSource } from '../entities/parse-source.entity';
import { ParseRun } from '../entities/parse-run.entity';
import { EpisodeVideo } from '../entities/episode-video.entity';
import { Episode } from '../entities/episode.entity';
import { Drama } from '../entities/drama.entity';
import { Season } from '../entities/season.entity';
import { PakParseController } from './parse.controller';
import { PakParseService } from './parse.service';
import { PakDramaximaDriver } from './drivers/dramaxima.driver';
import { PakDramaSpiceDriver } from './drivers/dramaspice.driver';
import { PakParseSchedulerService } from './scheduler/parse-scheduler.service';
import { PakParseOrchestratorService } from './scheduler/parse-orchestrator.service';
import { PakDistributedLockService } from './scheduler/distributed-lock.service';
import { PakAdminTokenGuard } from '../common/admin-token.guard';
import { PakImageModule } from '../services/pak-image.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParseSource,
      ParseRun,
      EpisodeVideo,
      Episode,
      Drama,
      Season,
    ], 'pak'),
    PakImageModule,
  ],
  controllers: [PakParseController],
  providers: [
    PakParseService,
    PakDramaximaDriver,
    PakDramaSpiceDriver,
    PakParseSchedulerService,
    PakParseOrchestratorService,
    PakDistributedLockService,
    PakAdminTokenGuard,
  ],
  exports: [PakParseService, PakDramaximaDriver, PakDramaSpiceDriver, PakParseOrchestratorService],
})
export class PakParseModule {}
