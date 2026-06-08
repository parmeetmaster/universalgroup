import { Body, Controller, Get, Patch, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { KvService } from './kv.service';

class TopSiteDto {
  name!: string;
  url!: string;
}

class AppConfigDto {
  app_version!: string;
  update_build_version!: number;
  force_update!: boolean;
  blocked_urls!: Array<{ url: string }>;
  force_update_after_version!: number;
  trends!: string[];
  top_sites!: TopSiteDto[];
  grace_enabled?: boolean;
  grace_max_build_version?: number;
  blocked_regions?: string[];
}

const CONFIG_KEY = 'app_config';

@ApiTags('app-config')
@Controller('anime-downloader/app-config')
export class AppConfigController {
  constructor(private readonly kvService: KvService) {}

  @Get()
  @ApiOperation({ summary: 'Get app config (parsed)' })
  @ApiResponse({ status: 200, description: 'Current app configuration' })
  async getConfig() {
    const entry = await this.kvService.get(CONFIG_KEY);
    if (!entry) return { data: null };

    try {
      const raw = typeof entry.value === 'string' ? JSON.parse(entry.value) : entry.value;
      return {
        data: {
          app_version: raw.app_version || '',
          update_build_version: Number(raw.update_build_version) || 0,
          force_update: Boolean(raw.force_update),
          blocked_urls: this.parseNested(raw.blocked_urls, []),
          force_update_after_version: Number(raw.force_update_after_version) || 0,
          trends: this.parseNested(raw.trends, []),
          top_sites: this.parseNested(raw.top_sites, []),
          grace_enabled: raw.grace_enabled ?? true,
          grace_max_build_version: Number(raw.grace_max_build_version) || 0,
          blocked_regions: this.parseNested(raw.blocked_regions, []),
        },
        updatedAt: entry.updatedAt,
      };
    } catch {
      return { data: entry.value, updatedAt: entry.updatedAt };
    }
  }

  @Put()
  @ApiOperation({ summary: 'Update app config' })
  @ApiBody({ type: AppConfigDto, description: 'Full app config object' })
  @ApiResponse({ status: 200, description: 'Config saved successfully' })
  async updateConfig(@Body() body: AppConfigDto) {
    const value = JSON.stringify({
      app_version: body.app_version,
      update_build_version: body.update_build_version,
      force_update: body.force_update,
      blocked_urls: JSON.stringify(body.blocked_urls || []),
      force_update_after_version: body.force_update_after_version,
      trends: JSON.stringify(body.trends || []),
      top_sites: JSON.stringify(body.top_sites || []),
      grace_enabled: body.grace_enabled ?? true,
      grace_max_build_version: body.grace_max_build_version ?? 0,
      blocked_regions: JSON.stringify(body.blocked_regions || []),
    });

    const entry = await this.kvService.set(CONFIG_KEY, value);
    return { success: true, updatedAt: entry.updatedAt };
  }

  @Patch()
  @ApiOperation({ summary: 'Partial update app config (merges with existing)' })
  @ApiBody({ type: AppConfigDto, description: 'Partial app config — only provided fields are updated' })
  @ApiResponse({ status: 200, description: 'Config patched successfully' })
  async patchConfig(@Body() body: Partial<AppConfigDto>) {
    // Fetch existing config
    const entry = await this.kvService.get(CONFIG_KEY);
    let existing: Record<string, unknown> = {};
    if (entry) {
      try {
        const raw = typeof entry.value === 'string' ? JSON.parse(entry.value) : entry.value;
        existing = {
          app_version: raw.app_version || '',
          update_build_version: Number(raw.update_build_version) || 0,
          force_update: Boolean(raw.force_update),
          blocked_urls: raw.blocked_urls || '[]',
          force_update_after_version: Number(raw.force_update_after_version) || 0,
          trends: raw.trends || '[]',
          top_sites: raw.top_sites || '[]',
          grace_enabled: raw.grace_enabled ?? true,
          grace_max_build_version: Number(raw.grace_max_build_version) || 0,
          blocked_regions: raw.blocked_regions || '[]',
        };
      } catch {}
    }

    // Merge: only overwrite fields that are explicitly provided
    const merged = {
      app_version: body.app_version ?? existing.app_version ?? '',
      update_build_version: body.update_build_version ?? existing.update_build_version ?? 0,
      force_update: body.force_update ?? existing.force_update ?? false,
      blocked_urls: body.blocked_urls !== undefined ? JSON.stringify(body.blocked_urls) : existing.blocked_urls,
      force_update_after_version: body.force_update_after_version ?? existing.force_update_after_version ?? 0,
      trends: body.trends !== undefined ? JSON.stringify(body.trends) : existing.trends,
      top_sites: body.top_sites !== undefined ? JSON.stringify(body.top_sites) : existing.top_sites,
      grace_enabled: body.grace_enabled ?? existing.grace_enabled ?? true,
      grace_max_build_version: body.grace_max_build_version ?? existing.grace_max_build_version ?? 0,
      blocked_regions: body.blocked_regions !== undefined ? JSON.stringify(body.blocked_regions) : existing.blocked_regions,
    };

    const value = JSON.stringify(merged);
    const updated = await this.kvService.set(CONFIG_KEY, value);
    return { success: true, updatedAt: updated.updatedAt };
  }

  private parseNested(val: unknown, fallback: unknown[]): unknown[] {
    if (!val) return fallback;
    try {
      let parsed = val;
      while (typeof parsed === 'string') {
        // Fix trailing commas before closing bracket: ,] → ]
        const cleaned = parsed.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
        parsed = JSON.parse(cleaned);
      }
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
}
