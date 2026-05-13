import { Module } from '@nestjs/common';
import { LegacyController } from './legacy.controller';
import { ReportsModule } from '../reports/reports.module';
import { KvModule } from '../kv/kv.module';

@Module({
  imports: [ReportsModule, KvModule],
  controllers: [LegacyController],
})
export class LegacyModule {}
