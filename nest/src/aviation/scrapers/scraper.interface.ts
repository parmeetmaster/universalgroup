import { HomeResponseDto } from '../dto/home-response.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { ArticleResponseDto } from '../dto/article-response.dto';
import { SearchResponseDto } from '../dto/search-response.dto';
import { AuthorResponseDto } from '../dto/author-response.dto';
import { TagResponseDto } from '../dto/tag-response.dto';
import { LatestPostsResponseDto } from '../dto/latest-posts-response.dto';

export const SCRAPER_TOKEN = 'SCRAPER_TOKEN';

export interface IScraper {
  scrapeHome(): Promise<HomeResponseDto>;
  scrapeCategory(slug: string, page: number): Promise<CategoryResponseDto>;
  scrapeArticle(path: string): Promise<ArticleResponseDto>;
  scrapeSearch(query: string, page: number): Promise<SearchResponseDto>;
  scrapeAuthor(slug: string, page: number): Promise<AuthorResponseDto>;
  scrapeTag(slug: string, page: number): Promise<TagResponseDto>;
  scrapeLatestPosts(page: number): Promise<LatestPostsResponseDto>;
}
