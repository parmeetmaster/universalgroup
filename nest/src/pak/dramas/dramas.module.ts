import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drama } from '../entities/drama.entity';
import { Episode } from '../entities/episode.entity';
import { PakDramasController } from './dramas.controller';
import { PakDramasService } from './dramas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Drama, Episode], 'pak')],
  controllers: [PakDramasController],
  providers: [PakDramasService],
  exports: [PakDramasService],
})
export class PakDramasModule {}
