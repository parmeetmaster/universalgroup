import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import * as cheerio from 'cheerio';
import { firstValueFrom } from 'rxjs';
import { SentNotificationEntity } from '../entities/sent-notification.entity';
import { FirebaseService } from './firebase.service';

const BASE_URL = 'https://aviationa2z.com';
const TOPIC = 'breaking_news';

interface ScrapedArticle {
  title: string;
  url: string;
  image: string;
  excerpt: string;
}

@Injectable()
export class NotificationCronService {
  private readonly logger = new Logger(NotificationCronService.name);

  constructor(
    @InjectRepository(SentNotificationEntity, 'aviation')
    private readonly sentRepo: Repository<SentNotificationEntity>,
    private readonly firebase: FirebaseService,
    private readonly http: HttpService,
  ) {}

  // Run every 6 hours
  @Cron('0 */6 * * *')
  async scanAndNotify() {
    this.logger.log('Starting 6-hourly scan for new articles...');

    try {
      const articles = await this.scrapeLatestArticles();
      this.logger.log(`Scraped ${articles.length} articles from homepage`);

      if (articles.length === 0) return;

      // Get URLs already sent
      const urls = articles.map((a) => a.url);
      const alreadySent = await this.sentRepo
        .createQueryBuilder('n')
        .where('n.articleUrl IN (:...urls)', { urls })
        .getMany();

      const sentUrls = new Set(alreadySent.map((n) => n.articleUrl));

      // Filter new articles
      const newArticles = articles.filter((a) => !sentUrls.has(a.url));
      this.logger.log(`Found ${newArticles.length} new articles to notify`);

      // Send notifications for new articles (max 5 per scan to avoid spam)
      const toSend = newArticles.slice(0, 5);

      for (const article of toSend) {
        const sent = await this.firebase.sendToTopic(
          TOPIC,
          article.title,
          article.excerpt || 'New aviation news',
          article.image || undefined,
          { url: article.url },
        );

        if (sent) {
          // Save to DB to prevent duplicate
          const notification = this.sentRepo.create({
            articleUrl: article.url,
            title: article.title,
            image: article.image,
          });

          await this.sentRepo.save(notification).catch((err) => {
            // Duplicate key — already saved by another instance
            this.logger.warn(`Duplicate save skipped: ${err.message}`);
          });
        }
      }

      this.logger.log(`Scan complete. Sent ${toSend.length} notifications.`);
    } catch (err) {
      this.logger.error(`Scan failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  private async scrapeLatestArticles(): Promise<ScrapedArticle[]> {
    const { data: html } = await firstValueFrom(
      this.http.get<string>(BASE_URL, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
        },
        timeout: 12000,
      }),
    );

    const $ = cheerio.load(html);
    const articles: ScrapedArticle[] = [];
    const seenUrls = new Set<string>();

    // Scrape from Latest Posts list (most recent articles with excerpts)
    $('section.block-posts-list article.list-post').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.post-title a').first().text().trim();
      const rawUrl = $el.find('.post-title a').first().attr('href') || '';
      const url = this.resolveUrl(rawUrl);
      if (!title || !url || seenUrls.has(url)) return;
      seenUrls.add(url);

      articles.push({
        title,
        url,
        image: this.extractImage($el, $),
        excerpt: $el.find('.excerpt').first().text().trim(),
      });
    });

    // Also scrape from Latest News grid
    $('section.block-wrap').each((_, section) => {
      const $section = $(section);
      const heading = $section.find('.block-head').first().text().replace(/\s+/g, ' ').trim().toLowerCase();
      if (!heading.includes('latest') || heading.includes('post')) return;

      $section.find('article').each((_, el) => {
        const $el = $(el);
        const title = $el.find('.post-title a').first().text().trim();
        const rawUrl = $el.find('.post-title a').first().attr('href') || '';
        const url = this.resolveUrl(rawUrl);
        if (!title || !url || seenUrls.has(url)) return;
        seenUrls.add(url);

        articles.push({
          title,
          url,
          image: this.extractImage($el, $),
          excerpt: '',
        });
      });
    });

    return articles;
  }

  private extractImage($el: cheerio.Cheerio<any>, $?: cheerio.CheerioAPI): string {
    const span = $el.find('span.img[data-bgsrc]').first();
    if (span.length) return span.attr('data-bgsrc') || '';

    const img = $el.find('img').first();
    if (img.length) return img.attr('data-src') || img.attr('src') || '';

    return '';
  }

  private resolveUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}
