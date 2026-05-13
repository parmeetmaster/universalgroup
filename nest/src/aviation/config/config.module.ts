import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AviationAppConfig } from '../entities/app-config.entity';
import { AviationAppConfigController } from './config.controller';
import { AviationAppConfigService } from './config.service';
import { AviationAdminTokenGuard } from './admin-token.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AviationAppConfig], 'aviation')],
  controllers: [AviationAppConfigController],
  providers: [AviationAppConfigService, AviationAdminTokenGuard],
})
export class AviationConfigModule {}
