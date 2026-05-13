import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { firstValueFrom } from 'rxjs';
import { IScraper } from '../scrapers/scraper.interface';
import { HomeResponseDto, SidebarDto, FooterDto } from '../dto/home-response.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { ArticleResponseDto } from '../dto/article-response.dto';
import { SearchResponseDto } from '../dto/search-response.dto';
import { AuthorResponseDto } from '../dto/author-response.dto';
import { TagResponseDto } from '../dto/tag-response.dto';
import { LatestPostsResponseDto } from '../dto/latest-posts-response.dto';
import {
  ArticleMinimal,
  ArticleCard,
  ArticleSummary,
} from '../dto/article.model';
import { sanitizeContentForFlutter } from '../utils/content-sanitizer';
import { buildPagination } from '../dto/pagination.dto';

const BASE_URL = 'https://simpleflying.com';

@Injectable()
export class SimpleFlyingScraper implements IScraper {
  private readonly logger = new Logger(SimpleFlyingScraper.name);

  constructor(private readonly http: HttpService) {}

  private async fetch(url: string, retries = 2): Promise<cheerio.CheerioAPI> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { data } = await firstValueFrom(
          this.http.get<string>(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
              Accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
            timeout: 12000,
          }),
        );
        return cheerio.load(data);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`fetch ${url} attempt ${attempt + 1} failed: ${lastError.message}`);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }

  private decodeDate(b64: string | undefined): string {
    if (!b64) return '';
    try {
      return Buffer.from(b64, 'base64').toString('utf8');
    } catch {
      return '';
    }
  }

  private extractImage($el: cheerio.Cheerio<Element>): string {
    const img = $el.find('img').first();
    if (img.length) {
      return img.attr('data-img-url') || img.attr('src') || '';
    }
    return '';
  }

  private resolveUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  // ─── HOME ──────────────────────────────────────────────

  async scrapeHome(): Promise<HomeResponseDto> {
    const $ = await this.fetch(BASE_URL);

    const hero = this.parseHero($);
    const featuredCards = this.parseFeaturedCards($);
    const latestArticles = this.parseLatestArticles($);
    const sidebar = this.parseSidebar($);
    const footer = this.parseFooter($);

    return {
      hero,
      trendingArticles: [],
      latestNews: [],
      featured: featuredCards.map(c => ({ ...c, author: '', excerpt: '' })),
      editorsChoice: [],
      aerospace: [],
      airlines: [],
      airport: [],
      exclusiveBlogs: [],
      popularBlogs: [],
      editorsPicks: [],
      latestArticles,
      recentPosts: [],
      sidebar,
      footer,
    };
  }

  private parseHero($: cheerio.CheerioAPI): ArticleCard & { author: string } {
    const heroEl = $('.display-card.full-cover-image.large.primary').first();
    return {
      title: heroEl.find('.display-card-title a').first().text().trim(),
      url: this.resolveUrl(heroEl.find('.display-card-title a').first().attr('href') || ''),
      image: this.extractImage(heroEl),
      category: heroEl.find('.dc-tag-label a').first().text().trim(),
      author: heroEl.find('.article-author').first().text().trim(),
      date: this.decodeDate(heroEl.find('[data-b64-ts]').first().attr('data-b64-ts')),
    };
  }

  private parseFeaturedCards($: cheerio.CheerioAPI): ArticleCard[] {
    const cards: ArticleCard[] = [];
    $('.display-card.full-cover-image').each((i, el) => {
      if (i === 0) return; // skip hero (primary)
      if (cards.length >= 5) return;
      const $el = $(el);
      const title = $el.find('.display-card-title a').first().text().trim();
      if (!title) return;

      cards.push({
        title,
        url: this.resolveUrl($el.find('.display-card-title a').first().attr('href') || ''),
        image: this.extractImage($el),
        category: $el.find('.dc-tag-label a').first().text().trim(),
        date: this.decodeDate($el.find('[data-b64-ts]').first().attr('data-b64-ts')),
      });
    });
    return cards;
  }

  private parseLatestArticles($: cheerio.CheerioAPI): ArticleSummary[] {
    const articles: ArticleSummary[] = [];

    // home-latest cards
    $('.display-card.home-latest').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.display-card-title a').first().text().trim();
      if (!title) return;

      articles.push({
        title,
        url: this.resolveUrl($el.find('.display-card-title a').first().attr('href') || $el.find('.dc-img-link').attr('href') || ''),
        image: this.extractImage($el),
        category: $el.find('.dc-tag-label a').first().text().trim(),
        author: $el.find('.article-author').first().text().trim(),
        date: this.decodeDate($el.find('[data-b64-ts]').first().attr('data-b64-ts')),
        excerpt: $el.find('.display-card-excerpt').first().text().trim(),
      });
    });

    // remaining full-cover cards with author (they have more data)
    $('.display-card.full-cover-image').each((i, el) => {
      if (i < 4) return; // skip hero + first featured
      const $el = $(el);
      const title = $el.find('.display-card-title a').first().text().trim();
      if (!title) return;

      const author = $el.find('.article-author').first().text().trim();
      if (!author) return;

      articles.push({
        title,
        url: this.resolveUrl($el.find('.display-card-title a').first().attr('href') || ''),
        image: this.extractImage($el),
        category: $el.find('.dc-tag-label a').first().text().trim(),
        author,
        date: this.decodeDate($el.find('[data-b64-ts]').first().attr('data-b64-ts')),
        excerpt: '',
      });
    });

    return articles;
  }

  private parseSidebar($: cheerio.CheerioAPI): SidebarDto {
    return {
      latestNews: [],
      featured: [],
      editorsChoice: [],
      aerospace: [],
      airlines: [],
      airport: [],
      exclusiveBlogs: [],
      editorsPicks: [],
    };
  }

  private parseFooter($: cheerio.CheerioAPI): FooterDto {
    const footer$ = $('footer');

    const latestPosts: ArticleMinimal[] = [];
    const quickLinks: { label: string; url: string }[] = [];

    footer$.find('a').each((_, el) => {
      const $el = $(el);
      const label = $el.text().trim();
      const href = $el.attr('href') || '';
      if (!label || !href) return;

      // Skip social links
      if (href.includes('facebook') || href.includes('twitter') || href.includes('instagram') ||
          href.includes('linkedin') || href.includes('youtube') || href.includes('google.com')) return;

      quickLinks.push({ label, url: this.resolveUrl(href) });
    });

    const socialLinks = {
      facebook: footer$.find('a[href*="facebook"]').attr('href') || '',
      twitter: footer$.find('a[href*="twitter"], a[href*="x.com"]').attr('href') || '',
      instagram: footer$.find('a[href*="instagram"]').attr('href') || '',
      linkedin: footer$.find('a[href*="linkedin"]').attr('href') || '',
    };

    return { latestPosts, quickLinks, socialLinks };
  }

  // ─── CATEGORY ──────────────────────────────────────────

  async scrapeCategory(slug: string, page: number): Promise<CategoryResponseDto> {
    const url = page > 1
      ? `${BASE_URL}/category/${slug}/${page}/`
      : `${BASE_URL}/category/${slug}/`;

    const $ = await this.fetch(url);

    const category = $('h1').first().text().trim() || slug;
    const articles = this.parseDisplayCards($);
    const totalPages = articles.length >= 20 ? page + 1 : page;

    return { category, pagination: buildPagination(page, totalPages), articles };
  }

  // ─── ARTICLE ───────────────────────────────────────────

  async scrapeArticle(path: string): Promise<ArticleResponseDto> {
    const $ = await this.fetch(`${BASE_URL}${path}`);

    const title = $('h1').first().text().trim();

    // Category from article tags at bottom
    const categoryEl = $('.article-tags a[href*="/category/"]').first();
    const categoryName = categoryEl.text().trim();
    const categoryUrl = this.resolveUrl(categoryEl.attr('href') || '');

    // Author
    const authorName = $('.article-author').first().text().trim();
    const authorUrl = this.resolveUrl($('.article-author').first().attr('href') || '');
    const avatar = $('.article-header-author-img img').first().attr('src') || '';
    const bio = '';

    const date = this.decodeDate($('[data-b64-ts]').first().attr('data-b64-ts'));

    // Featured image
    const mainImg = $('article img, .article-body img').first();
    const featuredImgUrl = mainImg.attr('data-img-url') || mainImg.attr('src') || '';
    const caption = $('figcaption').first().text().trim();

    const content = sanitizeContentForFlutter(
      $('.article-body').first().html() || '',
    );

    const tags: string[] = [];
    $('.article-tags a').each((_, el) => {
      const tag = $(el).text().trim();
      if (tag) tags.push(tag);
    });

    const relatedPosts: ArticleSummary[] = [];
    $('.display-card.article.article-card').each((_, el) => {
      const $el = $(el);
      const rTitle = $el.find('.display-card-title a').first().text().trim();
      if (!rTitle) return;
      relatedPosts.push({
        title: rTitle,
        url: this.resolveUrl($el.find('.display-card-title a').first().attr('href') || ''),
        image: this.extractImage($el),
        category: $el.find('.dc-tag-label a').first().text().trim(),
        author: $el.find('.dc-author-name a, .author-name').first().text().trim(),
        date: this.decodeDate($el.find('[data-b64-ts]').first().attr('data-b64-ts')),
        excerpt: '',
      });
    });

    return {
      title,
      url: path,
      category: { name: categoryName, url: categoryUrl },
      author: { name: authorName, url: authorUrl, avatar, bio },
      date,
      readTime: '',
      featuredImage: { url: featuredImgUrl, caption },
      content,
      tags,
      relatedPosts,
      source: {
        name: 'Simple Flying',
        url: 'https://simpleflying.com',
        logo: 'https://simpleflying.com/images/sf-logo.svg',
      },
    };
  }

  // ─── SEARCH ────────────────────────────────────────────

  async scrapeSearch(query: string, page: number): Promise<SearchResponseDto> {
    const url = page > 1
      ? `${BASE_URL}/search/?q=${encodeURIComponent(query)}&page=${page}`
      : `${BASE_URL}/search/?q=${encodeURIComponent(query)}`;

    const $ = await this.fetch(url);

    const articles = this.parseDisplayCards($);

    const totalPages = articles.length >= 20 ? page + 1 : page;
    return {
      query,
      totalResults: 0,
      pagination: buildPagination(page, totalPages),
      results: articles,
    };
  }

  // ─── AUTHOR ────────────────────────────────────────────

  async scrapeAuthor(slug: string, page: number): Promise<AuthorResponseDto> {
    const url = page > 1
      ? `${BASE_URL}/author/${slug}/${page}/`
      : `${BASE_URL}/author/${slug}/`;

    const $ = await this.fetch(url);

    const name = $('h1').first().text().trim() || slug;
    const avatar = $('.author-avatar img, .author-img img').first().attr('src') || '';
    const website = '';
    const articles = this.parseDisplayCards($);
    const totalPages = articles.length >= 20 ? page + 1 : page;

    return { name, avatar, website, pagination: buildPagination(page, totalPages), articles };
  }

  // ─── TAG ───────────────────────────────────────────────

  async scrapeTag(slug: string, page: number): Promise<TagResponseDto> {
    const url = page > 1
      ? `${BASE_URL}/tag/${slug}/${page}/`
      : `${BASE_URL}/tag/${slug}/`;

    const $ = await this.fetch(url);

    const tag = $('h1').first().text().trim() || slug;
    const articles = this.parseDisplayCards($);
    const totalPages = articles.length >= 20 ? page + 1 : page;

    return { tag, pagination: buildPagination(page, totalPages), articles };
  }

  // ─── SHARED HELPERS ────────────────────────────────────

  private parseDisplayCards($: cheerio.CheerioAPI): ArticleSummary[] {
    const articles: ArticleSummary[] = [];

    $('.display-card').each((_, el) => {
      const $el = $(el);
      const classes = $el.attr('class') || '';

      // Skip video cards and thread cards
      if (classes.includes('video') || classes.includes('thread')) return;

      const title = $el.find('.display-card-title a').first().text().trim();
      if (!title) return;

      articles.push({
        title,
        url: this.resolveUrl(
          $el.find('.display-card-title a').first().attr('href') ||
          $el.find('.dc-img-link').attr('href') || '',
        ),
        image: this.extractImage($el),
        category: $el.find('.dc-tag-label a').first().text().trim(),
        author: $el.find('.article-author').first().text().trim(),
        date: this.decodeDate($el.find('[data-b64-ts]').first().attr('data-b64-ts')),
        excerpt: $el.find('.display-card-excerpt').first().text().trim(),
      });
    });

    return articles;
  }

  async scrapeLatestPosts(page: number): Promise<LatestPostsResponseDto> {
    const url = page > 1
      ? `${BASE_URL}/page/${page}/`
      : `${BASE_URL}/`;

    const $ = await this.fetch(url);
    const articles = this.parseDisplayCards($);
    const totalPages = articles.length >= 5 ? page + 1 : page;

    return { pagination: buildPagination(page, totalPages), articles };
  }
}
