import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import { AppModule } from './app.module';

const swaggerOpts = { swaggerOptions: { persistAuthorization: true } };

function filterDocByPath(doc: OpenAPIObject, prefix: string): OpenAPIObject {
  const filtered = { ...doc, paths: {} as OpenAPIObject['paths'] };
  for (const [path, value] of Object.entries(doc.paths)) {
    if (path.startsWith(prefix)) {
      filtered.paths[path] = value;
    }
  }
  return filtered;
}

export async function bootstrapNest(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.enableCors();
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');

  const baseConfig = new DocumentBuilder()
    .addApiKey({ type: 'apiKey', name: 'X-Admin-Token', in: 'header' }, 'admin-token')
    .setVersion('1.0');

  // Full document with all paths
  const fullDoc = SwaggerModule.createDocument(app, baseConfig
    .setTitle('Universal Apps API')
    .setDescription('Unified API for anime-downloader, pakistani-serials, aviation-news')
    .build());

  // 1. Video Downloader — only /api/anime-downloader/* paths
  const animeDoc = { ...filterDocByPath(fullDoc, '/api/anime-downloader'), info: { title: 'Video Downloader API', description: 'Anime scraping, push notifications, KV store, error reports', version: '1.0' } };
  SwaggerModule.setup('api/anime-downloader/api-docs', app, animeDoc, swaggerOpts);

  // 2. Pakistani Serials — only /api/pakistani-serials/* paths
  const pakDoc = { ...filterDocByPath(fullDoc, '/api/pakistani-serials'), info: { title: 'Pakistani Serials API', description: 'Drama streaming, content management, parsing', version: '1.0' } };
  SwaggerModule.setup('api/pakistani-serials/api-docs', app, pakDoc, swaggerOpts);

  // 3. Aviation News — only /api/aviation-news/* paths
  const aviationDoc = { ...filterDocByPath(fullDoc, '/api/aviation-news'), info: { title: 'Aviation News API', description: 'Aviation news, AQI, flights, notifications, YouTube shorts', version: '1.0' } };
  SwaggerModule.setup('api/aviation-news/api-docs', app, aviationDoc, swaggerOpts);

  // 4. Manga App — only /api/manga/* paths
  const mangaDoc = { ...filterDocByPath(fullDoc, '/api/manga'), info: { title: 'Manga App API', description: 'Manga config + Asura new-chapter notifications', version: '1.0' } };
  SwaggerModule.setup('api/manga-app/api-docs', app, mangaDoc, swaggerOpts);

  // 5. Chinese Drama — only /api/chinese-drama/* paths
  const chineseDramaDoc = { ...filterDocByPath(fullDoc, '/api/chinese-drama'), info: { title: 'Chinese Drama API', description: 'Chinese drama explore/homepage API', version: '1.0' } };
  SwaggerModule.setup('api/chinese-drama/api-docs', app, chineseDramaDoc, swaggerOpts);

  // 6. Global — all APIs combined
  SwaggerModule.setup('api-docs', app, fullDoc, swaggerOpts);

  return app;
}

// Standalone mode (without Next.js)
if (require.main === module) {
  (async () => {
    const app = await bootstrapNest();
    const port = parseInt(process.env.PORT ?? '3070', 10);
    await app.listen(port);
    console.log(`NestJS listening on :${port}`);
  })();
}
