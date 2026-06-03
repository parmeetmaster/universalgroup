import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeRail } from '../entities/home-rail.entity';
import { Drama } from '../entities/drama.entity';
import { Episode } from '../entities/episode.entity';
import { PakHomeController } from './home.controller';
import { PakHomeService } from './home.service';

@Module({
  imports: [TypeOrmModule.forFeature([HomeRail, Drama, Episode], 'pak')],
  controllers: [PakHomeController],
  providers: [PakHomeService],
  exports: [PakHomeService],
})
export class PakHomeModule {}
