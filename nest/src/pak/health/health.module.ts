import { Module } from '@nestjs/common';
import { PakHealthController } from './health.controller';

@Module({ controllers: [PakHealthController] })
export class PakHealthModule {}
