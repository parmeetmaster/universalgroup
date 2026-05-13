import { Module } from '@nestjs/common';
import { PakPagesController } from './pages.controller';

@Module({
  controllers: [PakPagesController],
})
export class PakPagesModule {}
