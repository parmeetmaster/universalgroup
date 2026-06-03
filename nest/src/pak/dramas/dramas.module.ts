import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drama } from '../entities/drama.entity';
import { Episode } from '../entities/episode.entity';
import { DramaLike } from '../entities/drama-like.entity';
import { HomeRail } from '../entities/home-rail.entity';
import { PakDramasController } from './dramas.controller';
import { PakDramasService } from './dramas.service';
import { DramaEngagementService } from './drama-engagement.service';

@Module({
  imports: [TypeOrmModule.forFeature([Drama, Episode, DramaLike, HomeRail], 'pak')],
  controllers: [PakDramasController],
  providers: [PakDramasService, DramaEngagementService],
  exports: [PakDramasService, DramaEngagementService],
})
export class PakDramasModule {}
