import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CdDrama } from '../entities/drama.entity';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';

@Module({
  imports: [TypeOrmModule.forFeature([CdDrama], 'chinese-drama')],
  controllers: [ExploreController],
  providers: [ExploreService],
})
export class ExploreModule {}
