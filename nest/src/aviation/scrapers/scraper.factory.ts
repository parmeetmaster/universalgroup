import { Injectable } from '@nestjs/common';
import { IScraper } from '../scrapers/scraper.interface';
import { AviationA2ZScraper } from './aviationa2z.scraper';
import { SimpleFlyingScraper } from './simpleflying.scraper';
import { CompositeScraper } from './composite.scraper';

export interface IScraperFactory {
  createScraper(): IScraper;
}

@Injectable()
export class ScraperFactory implements IScraperFactory {
  constructor(
    private readonly aviationA2Z: AviationA2ZScraper,
    private readonly simpleFlying: SimpleFlyingScraper,
  ) {}

  createScraper(): IScraper {
    return new CompositeScraper(this.aviationA2Z, this.simpleFlying);
  }
}
