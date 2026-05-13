import { Module } from '@nestjs/common';
import { PollerService } from './poller.service';
import { ScraperModule } from '../scraper/scraper.module';
import { DiffModule } from '../diff/diff.module';
import { FcmModule } from '../fcm/fcm.module';

@Module({
  imports: [ScraperModule, DiffModule, FcmModule],
  providers: [PollerService],
  exports: [PollerService],
})
export class PollerModule {}
