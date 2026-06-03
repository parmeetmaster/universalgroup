import {
  Controller,
  Get,
  Logger,
  Param,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiProduces, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { Drama } from '../entities/drama.entity';
import { Episode } from '../entities/episode.entity';

@ApiTags('pak-images')
@Controller('pakistani-serials/img')
export class PakImageProxyController {
  private readonly logger = new Logger(PakImageProxyController.name);
  private readonly urlCache = new Map<string, string>();
  private readonly CACHE_MAX = 2000;

  constructor(
    @InjectRepository(Drama, 'pak') private readonly dramaRepo: Repository<Drama>,
    @InjectRepository(Episode, 'pak') private readonly episodeRepo: Repository<Episode>,
  ) {}

  @Get(':imageId')
  @ApiOperation({ summary: 'Proxy an image from ImageBan by ID' })
  @ApiParam({ name: 'imageId', description: 'ImageBan image ID' })
  @ApiProduces('image/jpeg', 'image/png', 'image/webp', 'image/gif')
  async proxyImage(
    @Param('imageId') imageId: string,
    @Res() res: Response,
  ): Promise<void> {
    const imageUrl = await this.resolveImageUrl(imageId);
    if (!imageUrl) {
      res.status(404).end();
      return;
    }

    try {
      const upstream = await fetch(imageUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PakOTT/1.0)' },
      });

      if (!upstream.ok) {
        this.logger.warn(`ImageBan returned ${upstream.status} for ${imageId}`);
        res.status(upstream.status >= 500 ? 502 : 404).end();
        return;
      }

      const contentType = upstream.headers.get('content-type') || 'image/jpeg';
      const contentLength = upstream.headers.get('content-length');

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      if (contentLength) res.setHeader('Content-Length', contentLength);

      if (upstream.body) {
        const reader = upstream.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } else {
        const buffer = Buffer.from(await upstream.arrayBuffer());
        res.send(buffer);
      }
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('timeout')) {
        res.status(504).end();
      } else {
        this.logger.error(`Proxy error for ${imageId}: ${msg}`);
        res.status(502).end();
      }
    }
  }

  private async resolveImageUrl(imageId: string): Promise<string | null> {
    const cached = this.urlCache.get(imageId);
    if (cached) return cached;

    const drama = await this.dramaRepo
      .createQueryBuilder('d')
      .select(['d.posterUrl', 'd.backdropUrl', 'd.posterImagebanId', 'd.backdropImagebanId'])
      .where('d.posterImagebanId = :id OR d.backdropImagebanId = :id', { id: imageId })
      .getOne();

    if (drama) {
      const url = drama.posterImagebanId === imageId ? drama.posterUrl : drama.backdropUrl;
      if (url) { this.cacheUrl(imageId, url); return url; }
    }

    const episode = await this.episodeRepo
      .createQueryBuilder('e')
      .select(['e.thumbnailUrl', 'e.thumbnailImagebanId'])
      .where('e.thumbnailImagebanId = :id', { id: imageId })
      .getOne();

    if (episode?.thumbnailUrl) {
      this.cacheUrl(imageId, episode.thumbnailUrl);
      return episode.thumbnailUrl;
    }

    return null;
  }

  private cacheUrl(id: string, url: string): void {
    if (this.urlCache.size >= this.CACHE_MAX) {
      const first = this.urlCache.keys().next().value;
      if (first) this.urlCache.delete(first);
    }
    this.urlCache.set(id, url);
  }
}
