import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Genre } from '../entities/genre.entity';
import { PakGenresController } from './genres.controller';
import { PakGenresService } from './genres.service';

@Module({
  imports: [TypeOrmModule.forFeature([Genre], 'pak')],
  controllers: [PakGenresController],
  providers: [PakGenresService],
  exports: [PakGenresService],
})
export class PakGenresModule {}
