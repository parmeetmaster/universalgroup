import { Module } from '@nestjs/common';
import { PakDramasModule } from '../dramas/dramas.module';
import { PakEpisodesModule } from '../episodes/episodes.module';
import { PakHomeModule } from '../home/home.module';
import { PakV2Controller } from './pak-v2.controller';

@Module({
  imports: [PakDramasModule, PakEpisodesModule, PakHomeModule],
  controllers: [PakV2Controller],
})
export class PakV2Module {}
