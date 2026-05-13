import { Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminController } from './admin.controller';
import { FcmModule } from '../fcm/fcm.module';
import { KvModule } from '../kv/kv.module';
import { ScraperModule } from '../scraper/scraper.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [FcmModule, KvModule, ScraperModule, DevicesModule],
  controllers: [AdminController],
  providers: [AdminGuard],
  exports: [AdminGuard],
})
export class AdminModule {}
