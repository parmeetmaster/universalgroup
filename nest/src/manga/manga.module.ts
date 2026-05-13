import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MangaAppConfig } from './entities/app-config.entity';
import { MangaConfigModule } from './config/config.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: 'manga',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('MANGA_DB_HOST', '127.0.0.1'),
        port: parseInt(config.get('MANGA_DB_PORT', '3306'), 10),
        username: config.get('MANGA_DB_USER', 'manga_app'),
        password: config.get('MANGA_DB_PASS', ''),
        database: config.get('MANGA_DB_NAME', 'manga_app'),
        entities: [MangaAppConfig],
        synchronize: true,
        charset: 'utf8mb4',
        timezone: 'Z',
      }),
    }),
    MangaConfigModule,
  ],
})
export class MangaModule {}
