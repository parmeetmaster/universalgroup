import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drama } from '../entities/drama.entity';
import { Season } from '../entities/season.entity';
import { Episode } from '../entities/episode.entity';
import { Genre } from '../entities/genre.entity';
import { PakAdminController } from './admin.controller';
import { PakAdminService } from './admin.service';
import { PakAdminTokenGuard } from '../common/admin-token.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Drama, Season, Episode, Genre], 'pak')],
  controllers: [PakAdminController],
  providers: [PakAdminService, PakAdminTokenGuard],
})
export class PakAdminModule {}
