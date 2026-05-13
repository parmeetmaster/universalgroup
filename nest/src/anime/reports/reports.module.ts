import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorReportEntity } from './entities/error-report.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportsAdminController } from './reports-admin.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ErrorReportEntity], 'anime'),
    AdminModule,
  ],
  controllers: [ReportsController, ReportsAdminController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
