import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MangaAppConfig } from '../entities/app-config.entity';
import { MangaAppConfigController } from './config.controller';
import { MangaAppConfigService } from './config.service';
import { MangaAdminTokenGuard } from './admin-token.guard';

@Module({
  imports: [TypeOrmModule.forFeature([MangaAppConfig], 'manga')],
  controllers: [MangaAppConfigController],
  providers: [MangaAppConfigService, MangaAdminTokenGuard],
})
export class MangaConfigModule {}
