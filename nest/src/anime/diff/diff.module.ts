import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeenEpisodeEntity } from './entities/seen-episode.entity';
import { DiffService } from './diff.service';

@Module({
  imports: [TypeOrmModule.forFeature([SeenEpisodeEntity], 'anime')],
  providers: [DiffService],
  exports: [DiffService],
})
export class DiffModule {}
