import { Controller, Get, Header, Post, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ScraperService } from './scraper/scraper.service';
import { PollerService } from './poller/poller.service';
import { AdminGuard } from './admin/admin.guard';

@ApiTags('anime-downloader')
@Controller('anime-downloader')
export class AnimeController {
  private adHostsContent: string;
  private adHostsLastRead = 0;
  private static readonly AD_HOSTS_CACHE_MS = 60_000; // re-read file every 60s

  constructor(
    private readonly scraper: ScraperService,
    private readonly poller: PollerService,
  ) {
    this.adHostsContent = '';
  }

  @Get()
  hello() {
    return { message: 'Anime Downloader API' };
  }

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('scrape')
  async scrape() {
    const items = await this.scraper.fetchHomepage();
    return { count: items.length, items };
  }

  @Post('poll')
  @UseGuards(AdminGuard)
  async forcePoll() {
    return this.poller.runOnce();
  }

  @Get('ad-hosts.txt')
  @ApiOperation({ summary: 'Get curated ad-block hosts list (plain text)' })
  @ApiResponse({ status: 200, description: 'One domain per line, comments start with #' })
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  getAdHosts(@Res() res: Response) {
    const now = Date.now();
    if (!this.adHostsContent || now - this.adHostsLastRead > AnimeController.AD_HOSTS_CACHE_MS) {
      try {
        const filePath = join(__dirname, '..', '..', 'public', 'anime-downloader', 'ad-hosts.txt');
        this.adHostsContent = readFileSync(filePath, 'utf-8');
        this.adHostsLastRead = now;
      } catch {
        res.status(404).send('# ad-hosts.txt not found');
        return;
      }
    }
    res.send(this.adHostsContent);
  }
}
