import { Injectable } from '@nestjs/common';
import { IScraper } from '../scrapers/scraper.interface';
import { HomeResponseDto } from '../dto/home-response.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { ArticleResponseDto } from '../dto/article-response.dto';
import { SearchResponseDto } from '../dto/search-response.dto';
import { AuthorResponseDto } from '../dto/author-response.dto';
import { TagResponseDto } from '../dto/tag-response.dto';
import { LatestPostsResponseDto } from '../dto/latest-posts-response.dto';
import { AviationA2ZScraper } from './aviationa2z.scraper';
import { SimpleFlyingScraper } from './simpleflying.scraper';

@Injectable()
export class CompositeScraper implements IScraper {
  constructor(
    private readonly primary: AviationA2ZScraper,
    private readonly fallback: SimpleFlyingScraper,
  ) {}

  async scrapeHome(): Promise<HomeResponseDto> {
    return this.tryWithFallback(
      () => this.primary.scrapeHome(),
      () => this.fallback.scrapeHome(),
    );
  }

  async scrapeCategory(slug: string, page: number): Promise<CategoryResponseDto> {
    return this.tryWithFallback(
      () => this.primary.scrapeCategory(slug, page),
      () => this.fallback.scrapeCategory(slug, page),
    );
  }

  async scrapeArticle(path: string): Promise<ArticleResponseDto> {
    return this.tryWithFallback(
      () => this.primary.scrapeArticle(path),
      () => this.fallback.scrapeArticle(path),
    );
  }

  async scrapeSearch(query: string, page: number): Promise<SearchResponseDto> {
    return this.tryWithFallback(
      () => this.primary.scrapeSearch(query, page),
      () => this.fallback.scrapeSearch(query, page),
    );
  }

  async scrapeAuthor(slug: string, page: number): Promise<AuthorResponseDto> {
    return this.tryWithFallback(
      () => this.primary.scrapeAuthor(slug, page),
      () => this.fallback.scrapeAuthor(slug, page),
    );
  }

  async scrapeTag(slug: string, page: number): Promise<TagResponseDto> {
    return this.tryWithFallback(
      () => this.primary.scrapeTag(slug, page),
      () => this.fallback.scrapeTag(slug, page),
    );
  }

  async scrapeLatestPosts(page: number): Promise<LatestPostsResponseDto> {
    return this.tryWithFallback(
      () => this.primary.scrapeLatestPosts(page),
      () => this.fallback.scrapeLatestPosts(page),
    );
  }

  private async tryWithFallback<T>(
    primaryFn: () => Promise<T>,
    fallbackFn: () => Promise<T>,
  ): Promise<T> {
    try {
      return await primaryFn();
    } catch {
      return fallbackFn();
    }
  }
}
