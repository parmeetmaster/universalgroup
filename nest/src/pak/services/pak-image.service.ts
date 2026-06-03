import { Injectable, Logger } from '@nestjs/common';

export interface ImageBanUploadResult {
  imagebanUrl: string;
  imagebanId: string;
}

@Injectable()
export class PakImageService {
  private readonly logger = new Logger(PakImageService.name);
  private readonly apiUrl = 'https://api.imageban.ru/v1';
  private readonly secretKey = process.env.IMAGEBAN_SECRET_KEY || '';
  private readonly albumId = process.env.IMAGEBAN_ALBUM_ID || '';

  async uploadByUrl(sourceUrl: string): Promise<ImageBanUploadResult | null> {
    if (!this.secretKey) {
      this.logger.warn('IMAGEBAN_SECRET_KEY not set — skipping upload');
      return null;
    }
    if (this.isImageBanUrl(sourceUrl)) return null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const formData = new FormData();
        formData.append('url', sourceUrl);
        if (this.albumId) formData.append('album', this.albumId);

        const res = await fetch(this.apiUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.secretKey}` },
          body: formData,
          signal: AbortSignal.timeout(30000),
        });

        if (res.status === 429) {
          this.logger.warn(`ImageBan rate limited on attempt ${attempt}`);
          if (attempt < 2) {
            await this.delay(5000);
            continue;
          }
          return null;
        }

        if (!res.ok) {
          this.logger.error(`ImageBan upload failed: HTTP ${res.status}`);
          return null;
        }

        const json = (await res.json()) as {
          success: boolean;
          data?: Array<{ id: string; link: string }>;
        };

        if (!json.success || !json.data?.length) {
          this.logger.error(`ImageBan response invalid: ${JSON.stringify(json)}`);
          return null;
        }

        const { id, link } = json.data[0];
        this.logger.log(`Uploaded to ImageBan: ${id} -> ${link}`);

        const verified = await this.verifyUrl(link);
        if (!verified) {
          this.logger.warn(`ImageBan URL not accessible: ${link}`);
          return null;
        }

        return { imagebanUrl: link, imagebanId: id };
      } catch (e) {
        const msg = (e as Error).message;
        this.logger.error(`ImageBan attempt ${attempt} failed: ${msg}`);
        if (attempt < 2 && (msg.includes('timeout') || msg.includes('ECONNREFUSED'))) {
          await this.delay(3000);
          continue;
        }
        return null;
      }
    }
    return null;
  }

  async verifyUrl(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  isImageBanUrl(url: string): boolean {
    return url.includes('imageban.ru');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
