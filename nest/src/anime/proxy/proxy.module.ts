import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProxyEntity } from './entities/proxy.entity';
import { ProxyScraperService } from './proxy-scraper.service';
import { ProxyValidatorService } from './proxy-validator.service';
import { ProxyService } from './proxy.service';
import { ProxyCronService } from './proxy-cron.service';
import { ProxyController } from './proxy.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProxyEntity], 'anime'),
    HttpModule.register({ timeout: 15000 }),
  ],
  controllers: [ProxyController],
  providers: [
    ProxyScraperService,
    ProxyValidatorService,
    ProxyService,
    ProxyCronService,
  ],
  exports: [ProxyService],
})
export class ProxyModule {}
