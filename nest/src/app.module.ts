import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AnimeModule } from './anime/anime.module';
import { AviationModule } from './aviation/aviation.module';
import { PakModule } from './pak/pak.module';
import { AuthModule } from './auth/auth.module';
import { MangaModule } from './manga/manga.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    ScheduleModule.forRoot(),
    AnimeModule,
    AviationModule,
    PakModule,
    MangaModule,
    AuthModule,
  ],
})
export class AppModule {}
