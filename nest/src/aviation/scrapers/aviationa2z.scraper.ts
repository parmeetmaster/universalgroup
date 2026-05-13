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

const BASE_URL = 'https://aviationa2z.com';

@Injectable()
export class AviationA2ZScraper implements IScraper {
  private readonly logger = new Logger(AviationA2ZScraper.name);

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

  // ─── IMAGE EXTRACTION ──────────────────────────────────
  // Site uses <span data-bgsrc="..." data-bgset="..."> for lazy-loaded bg images
  // and sometimes <img src/data-src/srcset> for regular images

  private extractImage($el: cheerio.Cheerio<Element>): string {
    // 1) span with data-bgsrc (most common on this site)
    const span = $el.find('span.img[data-bgsrc]').first();
    if (span.length) {
      return this.resolveUrl(span.attr('data-bgsrc') || '');
    }

    // 2) img tag with data-src (lazy load)
    const img = $el.find('img').first();
    if (img.length) {
      return this.resolveUrl(
        img.attr('data-src') || img.attr('src') || '',
      );
    }

    // 3) a.image-link with background from span
    const bgSpan = $el.find('a.image-link span').first();
    if (bgSpan.length) {
      return this.resolveUrl(bgSpan.attr('data-bgsrc') || '');
    }

    return '';
  }

  // ─── HOME ──────────────────────────────────────────────

  async scrapeHome(): Promise<HomeResponseDto> {
    const $ = await this.fetch(BASE_URL);

    const hero = this.parseHero($);
    const sections = this.parseSections($);
    const sidebar = this.parseSidebar($, sections);
    const footer = this.parseFooter($);

    // Build image lookup from all sections that have images
    const imageMap = this.buildImageMap([
      hero,
      ...sections.trending,
      ...sections.latestNews,
      ...sections.featured,
      ...sections.aerospace,
      ...sections.airlines,
      ...sections.airport,
      ...sections.exclusiveBlogs,
      ...sections.popularBlogs,
      ...sections.latestPosts,
      ...sections.recentPosts,
    ]);

    return {
      hero,
      trendingArticles: sections.trending,
      latestNews: sections.latestNews,
      featured: sections.featured,
      editorsChoice: this.fillMissingImages(sections.editorsChoice, imageMap),
      aerospace: sections.aerospace,
      airlines: sections.airlines,
      airport: sections.airport,
      exclusiveBlogs: sections.exclusiveBlogs,
      popularBlogs: sections.popularBlogs,
      editorsPicks: this.fillMissingImages(sections.editorsPicks, imageMap),
      latestArticles: sections.latestPosts,
      recentPosts: sections.recentPosts,
      sidebar,
      footer,
    };
  }

  // Hero = first article.grid-overlay (the big overlay post)
  private parseHero($: cheerio.CheerioAPI): ArticleCard & { author: string } {
    const heroEl = $('article.grid-overlay').first();
    return {
      title: heroEl.find('.post-title a').first().text().trim(),
      url: this.resolveUrl(heroEl.find('.post-title a').first().attr('href') || ''),
      image: this.extractImage(heroEl),
      category: heroEl.find('.post-cat a').first().text().trim(),
      author: heroEl.find('a[href*="/author/"]').first().text().trim(),
      date: heroEl.find('time.post-date').first().text().trim(),
    };
  }

  // Parse all homepage sections by iterating over block-wrap elements
  private parseSections($: cheerio.CheerioAPI) {
    const result = {
      trending: [] as ArticleSummary[],
      latestNews: [] as ArticleSummary[],
      featured: [] as ArticleSummary[],
      editorsChoice: [] as ArticleSummary[],
      aerospace: [] as ArticleSummary[],
      airlines: [] as ArticleSummary[],
      airport: [] as ArticleSummary[],
      exclusiveBlogs: [] as ArticleSummary[],
      popularBlogs: [] as ArticleSummary[],
      editorsPicks: [] as ArticleSummary[],
      latestPosts: [] as ArticleSummary[],
      recentPosts: [] as ArticleSummary[],
    };

    let unnamedDarkGridIndex = 0;

    $('section.block-wrap').each((_, section) => {
      const $section = $(section);
      const cls = $section.attr('class') || '';
      // Use block-head full text for matching (more reliable than .heading span)
      const blockHeadText = $section.find('.block-head').first().text().replace(/\s+/g, ' ').trim().toLowerCase();
      const articles = this.parseSectionArticles($, $section);

      if (articles.length === 0) return;

      if (cls.includes('block-overlay')) return;

      if (cls.includes('block-posts-list')) {
        result.latestPosts = articles;
        return;
      }

      if (cls.includes('block-posts-small')) {
        result.recentPosts = articles;
        return;
      }

      // Match by block-head text
      if (blockHeadText.includes('latest') && blockHeadText.includes('news')) {
        result.latestNews = articles;
      } else if (blockHeadText.includes('featured')) {
        result.featured = articles;
      } else if (blockHeadText.includes('editor') && blockHeadText.includes('choice')) {
        result.editorsChoice = articles;
      } else if (blockHeadText.includes('aerospace')) {
        result.aerospace = articles;
      } else if (blockHeadText.includes('airline')) {
        result.airlines = articles;
      } else if (blockHeadText.includes('airport')) {
        result.airport = articles;
      } else if (blockHeadText.includes('exclusive') || (blockHeadText.includes('blog') && !blockHeadText.includes('editor'))) {
        result.exclusiveBlogs = articles;
      } else if (blockHeadText.includes('editor') && blockHeadText.includes('pick')) {
        result.editorsPicks = articles;
      } else if (blockHeadText.includes('latest') && blockHeadText.includes('post')) {
        result.latestPosts = articles;
      } else if (!blockHeadText) {
        // Unnamed dark grid sections
        if (cls.includes('block-grid') && cls.includes('s-dark')) {
          if (unnamedDarkGridIndex === 0) {
            result.trending = articles;
          } else {
            result.popularBlogs = articles;
          }
          unnamedDarkGridIndex++;
        }
      }
    });

    return result;
  }

  // Parse articles from any section
  private parseSectionArticles($: cheerio.CheerioAPI, $section: cheerio.Cheerio<Element>): ArticleSummary[] {
    const articles: ArticleSummary[] = [];
    $section.find('article').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.post-title a').first().text().trim();
      if (!title) return;

      articles.push({
        title,
        url: this.resolveUrl($el.find('.post-title a').first().attr('href') || ''),
        image: this.extractImage($el),
        category: $el.find('.post-cat a').first().text().trim(),
        author: $el.find('a[href*="/author/"]').first().text().trim(),
        date: $el.find('time.post-date').first().text().trim(),
        excerpt: $el.find('.excerpt').first().text().trim(),
      });
    });
    return articles;
  }

  // Sidebar mirrors the main sections for quick access
  private parseSidebar($: cheerio.CheerioAPI, sections: ReturnType<AviationA2ZScraper['parseSections']>): SidebarDto {
    return {
      latestNews: [],
      featured: [],
      editorsChoice: sections.editorsChoice,
      aerospace: sections.aerospace,
      airlines: sections.airlines,
      airport: sections.airport,
      exclusiveBlogs: sections.exclusiveBlogs,
      editorsPicks: sections.editorsPicks,
    };
  }

  // Build URL -> image map from articles that have images
  private buildImageMap(articles: { url?: string; image?: string }[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const a of articles) {
      if (a.url && a.image) {
        map.set(a.url, a.image);
      }
    }
    return map;
  }

  // Fill empty images from the image map (same article appears in multiple sections)
  private fillMissingImages(articles: ArticleSummary[], imageMap: Map<string, string>): ArticleSummary[] {
    return articles.map((a) => {
      if (!a.image && imageMap.has(a.url)) {
        return { ...a, image: imageMap.get(a.url)! };
      }
      return a;
    });
  }

  // Footer = elementor footer with small-post articles and ts-el-list links
  private parseFooter($: cheerio.CheerioAPI): FooterDto {
    const footer$ = $('[data-elementor-type="ts-footer"]');

    // Latest Posts in footer
    const latestPosts: ArticleMinimal[] = [];
    footer$.find('article.small-post').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.post-title a').first().text().trim();
      if (!title) return;

      latestPosts.push({
        title,
        url: this.resolveUrl($el.find('.post-title a').first().attr('href') || ''),
        image: this.extractImage($el) || undefined,
        date: $el.find('time.post-date').first().text().trim() || undefined,
      });
    });

    // Quick Links from ts-el-list
    const quickLinks: { label: string; url: string }[] = [];
    footer$.find('.ts-el-list a').each((_, el) => {
      const $el = $(el);
      const label = $el.text().trim();
      if (label) {
        quickLinks.push({
          label,
          url: this.resolveUrl($el.attr('href') || ''),
        });
      }
    });

    // Social links from elementor social icons
    const socialLinks = {
      facebook: footer$.find('a[href*="facebook"]').attr('href') || '',
      twitter: footer$.find('a[href*="twitter"]').attr('href') || '',
      instagram: footer$.find('a[href*="instagram"]').attr('href') || '',
      linkedin: footer$.find('a[href*="linkedin"]').attr('href') || '',
    };

    return { latestPosts, quickLinks, socialLinks };
  }

  // ─── CATEGORY ──────────────────────────────────────────

  async scrapeCategory(slug: string, page: number): Promise<CategoryResponseDto> {
    const url = page > 1
      ? `${BASE_URL}/index.php/category/${slug}/page/${page}/`
      : `${BASE_URL}/index.php/category/${slug}/`;

    const $ = await this.fetch(url);

    const category = $('h1.page-title, .archive-title').first().text().trim() || slug;
    const articles = this.parseArticleList($);
    const lastPageLink = $('a.page-numbers').not('.next').last().text().trim();
    const totalPages = parseInt(lastPageLink, 10) || ($('.load-button, a.next').length > 0 ? page + 1 : page);

    return { category, pagination: buildPagination(page, totalPages), articles };
  }

  // ─── ARTICLE ───────────────────────────────────────────

  async scrapeArticle(path: string): Promise<ArticleResponseDto> {
    const $ = await this.fetch(`${BASE_URL}${path}`);

    const title = $('h1.post-title, article h1').first().text().trim();
    const categoryName = $('.post-cat a').first().text().trim();
    const categoryUrl = this.resolveUrl($('.post-cat a').first().attr('href') || '');

    const authorName = $('.post-meta a[href*="/author/"]').first().text().trim();
    const authorUrl = this.resolveUrl($('.post-meta a[href*="/author/"]').first().attr('href') || '');
    const avatar = this.resolveUrl(
      $('.author-box img').first().attr('data-src')
      || $('.author-box img').first().attr('src') || '',
    );
    const bio = $('.author-box .desc, .author-bio p').first().text().trim();

    const date = $('time.post-date').first().text().trim();
    const readTime = $('.rt-reading-time, .read-time').first().text().trim();

    // Featured image — could be span with data-bgsrc or img
    const articleWrap = $('article').first();
    const featuredImgUrl = this.extractImage(articleWrap.find('.media, .featured-img, .post-header').first())
      || this.extractImage(articleWrap);
    const caption = $('figcaption, .wp-caption-text').first().text().trim();

    const content = sanitizeContentForFlutter(
      $('.entry-content, .post-content').first().html() || '',
    );

    const tags: string[] = [];
    $('a[href*="/tag/"]').each((_, el) => {
      const tag = $(el).text().trim();
      if (tag) tags.push(tag);
    });

    const relatedPosts: ArticleSummary[] = [];
    $('.related-posts article.grid-post, .related-posts .loop-grid article').each((_, el) => {
      const $el = $(el);
      const rTitle = $el.find('.post-title a').first().text().trim();
      if (!rTitle) return;
      relatedPosts.push({
        title: rTitle,
        url: this.resolveUrl($el.find('.post-title a').first().attr('href') || ''),
        image: this.extractImage($el),
        category: $el.find('.post-cat a').first().text().trim(),
        author: $el.find('a[href*="/author/"]').first().text().trim(),
        date: $el.find('time.post-date').first().text().trim(),
        excerpt: '',
      });
    });

    return {
      title,
      url: path,
      category: { name: categoryName, url: categoryUrl },
      author: { name: authorName, url: authorUrl, avatar, bio },
      date,
      readTime,
      featuredImage: { url: featuredImgUrl, caption },
      content,
      tags,
      relatedPosts,
      source: {
        name: 'Aviation A2Z',
        url: 'https://aviationa2z.com',
        logo: 'https://cdn.aviationa2z.com/wp-content/uploads/2021/11/logo-226x100-1.png',
      },
    };
  }

  // ─── SEARCH ────────────────────────────────────────────

  async scrapeSearch(query: string, page: number): Promise<SearchResponseDto> {
    const url = page > 1
      ? `${BASE_URL}/index.php/page/${page}/?s=${encodeURIComponent(query)}`
      : `${BASE_URL}/?s=${encodeURIComponent(query)}`;

    const $ = await this.fetch(url);

    const articles = this.parseArticleList($);

    // Format: "Search Results: boeing (6742)" inside h1
    const h1Text = $('h1').first().text().trim();
    const countMatch = h1Text.match(/\((\d[\d,]*)\)/);
    const totalResults = countMatch ? parseInt(countMatch[1].replace(/,/g, ''), 10) : articles.length;

    // Last page-numbers link (not "next" arrow)
    const lastPageLink = $('a.page-numbers').not('.next').last().text().trim();
    const totalPages = parseInt(lastPageLink, 10) || 1;

    return { query, totalResults, pagination: buildPagination(page, totalPages), results: articles };
  }

  // ─── AUTHOR ────────────────────────────────────────────

  async scrapeAuthor(slug: string, page: number): Promise<AuthorResponseDto> {
    const url = page > 1
      ? `${BASE_URL}/index.php/author/${slug}/page/${page}/`
      : `${BASE_URL}/index.php/author/${slug}/`;

    const $ = await this.fetch(url);

    const name = $('h1.page-title, .archive-title').first().text().trim();
    const avatar = this.resolveUrl(
      $('.author-box img, .archive-header img').first().attr('data-src')
      || $('.author-box img, .archive-header img').first().attr('src') || '',
    );
    const website = $('.author-box a[rel="nofollow"], .author-link').first().attr('href') || '';

    const articles = this.parseArticleList($);

    const lastPageLink = $('a.page-numbers').not('.next').last().text().trim();
    const totalPages = parseInt(lastPageLink, 10) || 1;

    return { name, avatar, website, pagination: buildPagination(page, totalPages), articles };
  }

  // ─── TAG ───────────────────────────────────────────────

  async scrapeTag(slug: string, page: number): Promise<TagResponseDto> {
    const url = page > 1
      ? `${BASE_URL}/index.php/tag/${slug}/page/${page}/`
      : `${BASE_URL}/index.php/tag/${slug}/`;

    const $ = await this.fetch(url);

    const tag = $('h1.page-title, .archive-title').first().text().trim() || slug;
    const articles = this.parseArticleList($);
    const lastPageLink = $('a.page-numbers').not('.next').last().text().trim();
    const totalPages = parseInt(lastPageLink, 10) || ($('.load-button, a.next').length > 0 ? page + 1 : page);

    return { tag, pagination: buildPagination(page, totalPages), articles };
  }

  // ─── LATEST POSTS (AJAX LOAD MORE) ────────────────────

  async scrapeLatestPosts(page: number): Promise<LatestPostsResponseDto> {
    const body = new URLSearchParams({
      action: 'bunyad_block',
      'block[id]': 'posts-list',
      'block[props][cat_labels]': '',
      'block[props][cat_labels_pos]': 'top-left',
      'block[props][reviews]': 'bars',
      'block[props][post_formats_pos]': 'center',
      'block[props][load_more_style]': 'c',
      'block[props][meta_cat_style]': 'text',
      'block[props][media_style_shadow]': '1',
      'block[props][meta_sponsor]': '1',
      'block[props][meta_sponsor_logo]': '0',
      'block[props][meta_sponsor_label]': 'Sponsor: {sponsor}',
      'block[props][meta_below][]': 'author',
      'block[props][meta_sponsor_below][]': 'sponsor',
      'block[props][media_ratio]': '4-3',
      'block[props][media_ratio_custom]': '',
      'block[props][media_width]': '43',
      'block[props][read_more]': 'none',
      'block[props][posts]': '5',
      'block[props][pagination_type]': 'load-more',
      'block[props][container_width]': '66',
      'block[props][heading]': '*Latest* Posts',
      'block[props][title_lines]': '2',
      'block[props][excerpt_length]': '22',
      'block[props][content_vcenter]': '1',
      'block[props][heading_type]': 'c',
      'block[props][pagination]': '1',
      'block[props][excerpt_lines]': '3',
      'block[props][meta_sponsor_items_default]': 'true',
      'block[props][query_type]': 'custom',
      'block[props][sort_days]': '',
      'block[props][is_sc_call]': 'true',
      'block[props][meta_items_default]': 'true',
      paged: String(page),
    });

    // Need to add the second meta_below[] and meta_sponsor_below[] values
    body.append('block[props][meta_below][]', 'date');
    body.append('block[props][meta_sponsor_below][]', 'date');

    const { data } = await firstValueFrom(
      this.http.post<string>(`${BASE_URL}/wp-admin/admin-ajax.php`, body.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          Origin: BASE_URL,
          Referer: `${BASE_URL}/`,
        },
      }),
    );

    const $ = cheerio.load(data);
    const articles = this.parseArticleList($);
    const hasMore = articles.length >= 5;
    const estimatedTotalPages = hasMore ? page + 1 : page;

    return { pagination: buildPagination(page, estimatedTotalPages), articles };
  }

  // ─── SHARED HELPERS ────────────────────────────────────

  // Generic article list parser for category/search/author/tag pages
  private parseArticleList($: cheerio.CheerioAPI): ArticleSummary[] {
    const articles: ArticleSummary[] = [];
    $('article.l-post').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.post-title a').first().text().trim();
      if (!title) return;

      articles.push({
        title,
        url: this.resolveUrl($el.find('.post-title a').first().attr('href') || ''),
        image: this.extractImage($el),
        category: $el.find('.post-cat a').first().text().trim(),
        author: $el.find('a[href*="/author/"]').first().text().trim(),
        date: $el.find('time.post-date').first().text().trim(),
        excerpt: $el.find('.excerpt').first().text().trim(),
      });
    });
    return articles;
  }

  private resolveUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}
