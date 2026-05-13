import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KvEntryEntity } from './entities/kv-entry.entity';
import { KvService } from './kv.service';
import { KvController } from './kv.controller';
import { AppConfigController } from './app-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([KvEntryEntity], 'anime')],
  controllers: [KvController, AppConfigController],
  providers: [KvService],
  exports: [KvService],
})
export class KvModule {}
