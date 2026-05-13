import { Inject, Injectable } from '@nestjs/common';
import type { IScraper } from '../scrapers/scraper.interface';
import { SCRAPER_TOKEN } from '../scrapers/scraper.interface';
import { HomeResponseDto } from '../dto/home-response.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { ArticleResponseDto } from '../dto/article-response.dto';
import { SearchResponseDto } from '../dto/search-response.dto';
import { AuthorResponseDto } from '../dto/author-response.dto';
import { TagResponseDto } from '../dto/tag-response.dto';
import { LatestPostsResponseDto } from '../dto/latest-posts-response.dto';

@Injectable()
export class AviationNewsService {
  constructor(
    @Inject(SCRAPER_TOKEN) private readonly scraper: IScraper,
  ) {}

  getHome(): Promise<HomeResponseDto> {
    return this.scraper.scrapeHome();
  }

  getCategory(slug: string, page: number): Promise<CategoryResponseDto> {
    return this.scraper.scrapeCategory(slug, page);
  }

  getArticle(path: string): Promise<ArticleResponseDto> {
    return this.scraper.scrapeArticle(path);
  }

  search(query: string, page: number): Promise<SearchResponseDto> {
    return this.scraper.scrapeSearch(query, page);
  }

  getAuthor(slug: string, page: number): Promise<AuthorResponseDto> {
    return this.scraper.scrapeAuthor(slug, page);
  }

  getTag(slug: string, page: number): Promise<TagResponseDto> {
    return this.scraper.scrapeTag(slug, page);
  }

  getLatestPosts(page: number): Promise<LatestPostsResponseDto> {
    return this.scraper.scrapeLatestPosts(page);
  }
}
