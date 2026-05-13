import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DeviceTokenEntity } from './entities/device-token.entity';
import { FcmModule } from '../fcm/fcm.module';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceTokenEntity], 'anime'), FcmModule],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
