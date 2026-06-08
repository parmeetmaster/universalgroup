import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drama } from '../entities/drama.entity';
import { PakImageProxyController } from './pak-image-proxy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Drama], 'pak')],
  controllers: [PakImageProxyController],
})
export class PakImageProxyModule {}
