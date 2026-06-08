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
      let sentCount = 0;

      for (const article of toSend) {
        // INSERT FIRST — the UNIQUE constraint on articleUrl acts as a
        // distributed lock across PM2 cluster instances. Only the instance
        // that successfully inserts gets to send the FCM notification.
        const inserted = await this.claimArticle(article);
        if (!inserted) {
          this.logger.log(`Skipped (claimed by another instance): ${article.title}`);
          continue;
        }

        const sent = await this.firebase.sendToTopic(
          TOPIC,
          article.title,
          article.excerpt || 'New aviation news',
          article.image || undefined,
          { url: article.url },
        );

        if (!sent) {
          // FCM failed — remove the claim so next scan can retry
          await this.sentRepo.delete({ articleUrl: article.url }).catch(() => {});
        } else {
          sentCount++;
        }
      }

      this.logger.log(`Scan complete. Sent ${sentCount} notifications.`);
    } catch (err) {
      this.logger.error(`Scan failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  /**
   * Try to insert article into sent_notifications. Returns true if this
   * instance claimed it (new row), false if another instance already did.
   */
  private async claimArticle(article: ScrapedArticle): Promise<boolean> {
    try {
      const result = await this.sentRepo
        .createQueryBuilder()
        .insert()
        .into(SentNotificationEntity)
        .values({
          articleUrl: article.url,
          title: article.title,
          image: article.image,
        })
        .orIgnore() // INSERT IGNORE — silently skips on duplicate key
        .execute();

      // affectedRows === 0 means duplicate was ignored
      return (result.raw?.affectedRows ?? 0) > 0;
    } catch (err) {
      // Fallback: if INSERT IGNORE isn't supported, catch duplicate key
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Duplicate') || message.includes('UNIQUE')) {
        return false;
      }
      this.logger.warn(`Claim failed: ${message}`);
      return false;
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
