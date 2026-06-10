import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProxyEntity } from './entities/proxy.entity';
import { VpnConfigEntity } from './entities/vpn-config.entity';
import { ProxyScraperService } from './proxy-scraper.service';
import { ProxyValidatorService } from './proxy-validator.service';
import { ProxyService } from './proxy.service';
import { ProxyCronService } from './proxy-cron.service';
import { ProxyController } from './proxy.controller';
import { VpnScraperService } from './vpn-scraper.service';
import { VpnValidatorService } from './vpn-validator.service';
import { VpnConfigService } from './vpn-config.service';
import { VpnCronService } from './vpn-cron.service';
import { VpnConfigController } from './vpn-config.controller';
import { XrayTesterService } from './xray-tester.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProxyEntity, VpnConfigEntity], 'anime'),
    HttpModule.register({ timeout: 20000 }),
  ],
  controllers: [ProxyController, VpnConfigController],
  providers: [
    ProxyScraperService,
    ProxyValidatorService,
    ProxyService,
    ProxyCronService,
    VpnScraperService,
    VpnValidatorService,
    VpnConfigService,
    VpnCronService,
    XrayTesterService,
  ],
  exports: [ProxyService, VpnConfigService],
})
export class ProxyModule {}
