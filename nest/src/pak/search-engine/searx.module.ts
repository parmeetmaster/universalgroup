import { Module } from '@nestjs/common';
import { SearxClient } from './searx.client';

@Module({
  providers: [SearxClient],
  exports: [SearxClient],
})
export class PakSearxModule {}
