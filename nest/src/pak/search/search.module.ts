import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drama } from '../entities/drama.entity';
import { Episode } from '../entities/episode.entity';
import { CastMember } from '../entities/cast-member.entity';
import { PakSearchController } from './search.controller';
import { PakSearchService } from './search.service';

@Module({
  imports: [TypeOrmModule.forFeature([Drama, Episode, CastMember], 'pak')],
  controllers: [PakSearchController],
  providers: [PakSearchService],
})
export class PakSearchModule {}
