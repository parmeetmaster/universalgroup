import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CdGenre } from '../entities/genre.entity';
import { CdAppConfig } from '../entities/app-config.entity';
import { CdConfigController } from './config.controller';
import { CdConfigService } from './config.service';

@Module({
  imports: [TypeOrmModule.forFeature([CdGenre, CdAppConfig], 'chinese-drama')],
  controllers: [CdConfigController],
  providers: [CdConfigService],
})
export class CdConfigModule {}
