import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ScraperService } from './scraper/scraper.service';
import { PollerService } from './poller/poller.service';
import { AdminGuard } from './admin/admin.guard';

@Controller('anime-downloader')
export class AnimeController {
  constructor(
    private readonly scraper: ScraperService,
    private readonly poller: PollerService,
  ) {}

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
}
