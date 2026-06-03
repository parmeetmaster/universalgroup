import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drama } from '../entities/drama.entity';
import { Episode } from '../entities/episode.entity';
import { PakImageProxyController } from './pak-image-proxy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Drama, Episode], 'pak')],
  controllers: [PakImageProxyController],
})
export class PakImageProxyModule {}
