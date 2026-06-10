import { Injectable, Logger } from '@nestjs/common';

export interface ImageBanUploadResult {
  imagebanUrl: string;
  imagebanId: string;
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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

    // ImageBan's URL field is unreliable; download the image and upload the
    // raw bytes as a base64 `image` field (same approach as the anime backend).
    const base64 = await this.downloadAsBase64(sourceUrl);
    if (!base64) {
      this.logger.warn(`Could not download image: ${sourceUrl}`);
      return null;
    }

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const formData = new FormData();
        formData.append('image', base64);
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
          data?: { id: string; link: string };
        };

        if (!json.success || !json.data?.id || !json.data?.link) {
          this.logger.error(`ImageBan response invalid: ${JSON.stringify(json)}`);
          return null;
        }

        const { id, link } = json.data;
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

  private async downloadAsBase64(url: string): Promise<string | null> {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1000) return null;
      return buf.toString('base64');
    } catch {
      return null;
    }
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
