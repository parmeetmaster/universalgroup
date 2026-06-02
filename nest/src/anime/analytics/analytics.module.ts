import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteVisitEntity } from './entities/site-visit.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsAdminController } from './analytics-admin.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SiteVisitEntity], 'anime'),
    AdminModule,
  ],
  controllers: [AnalyticsController, AnalyticsAdminController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
