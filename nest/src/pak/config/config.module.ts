import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppSetting } from '../entities/app-setting.entity';
import { PakAppConfigController } from './config.controller';
import { PakAppConfigService } from './config.service';
import { PakAdminTokenGuard } from '../common/admin-token.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AppSetting], 'pak')],
  controllers: [PakAppConfigController],
  providers: [PakAppConfigService, PakAdminTokenGuard],
})
export class PakConfigModule {}
