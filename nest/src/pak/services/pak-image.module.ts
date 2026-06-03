import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drama } from '../entities/drama.entity';
import { Episode } from '../entities/episode.entity';
import { PakImageService } from './pak-image.service';

@Module({
  imports: [TypeOrmModule.forFeature([Drama, Episode], 'pak')],
  providers: [PakImageService],
  exports: [PakImageService],
})
export class PakImageModule {}
