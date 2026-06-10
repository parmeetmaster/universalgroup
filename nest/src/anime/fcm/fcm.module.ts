import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedCountryEntity } from './entities/blocked-country.entity';
import { RegisteredCountryEntity } from './entities/registered-country.entity';
import { FcmService } from './fcm.service';
import { BlockedCountriesService } from './blocked-countries.service';
import { CountriesRegistry } from './countries-registry.service';
import { NotificationWindowService } from './notification-window.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlockedCountryEntity, RegisteredCountryEntity], 'anime'),
  ],
  providers: [FcmService, BlockedCountriesService, CountriesRegistry, NotificationWindowService],
  exports: [FcmService, BlockedCountriesService, CountriesRegistry, NotificationWindowService],
})
export class FcmModule {}
