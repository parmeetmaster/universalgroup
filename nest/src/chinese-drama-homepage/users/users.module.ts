import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CdUser } from '../entities/user.entity';
import { CdUsersService } from './users.service';
import { CdUsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CdUser], 'chinese-drama')],
  controllers: [CdUsersController],
  providers: [CdUsersService],
  exports: [CdUsersService],
})
export class CdUsersModule {}
