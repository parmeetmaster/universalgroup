import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BlockedCountriesService } from '../fcm/blocked-countries.service';
import { CountriesRegistry } from '../fcm/countries-registry.service';
import { FcmService } from '../fcm/fcm.service';
import { ScraperService } from '../scraper/scraper.service';
import { KvService } from '../kv/kv.service';
import { DevicesService } from '../devices/devices.service';
import { AdminGuard } from './admin.guard';

@ApiTags('anime-downloader-admin')
@Controller('anime-downloader/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly blocked: BlockedCountriesService,
    private readonly registry: CountriesRegistry,
    private readonly kv: KvService,
    private readonly scraper: ScraperService,
    private readonly fcm: FcmService,
    private readonly devices: DevicesService,
  ) {}

  // --- Force notify top N episodes ---

  @Post('notify/top')
  async notifyTop(@Body() body: { count?: number }) {
    const n = Math.min(Math.max(1, body?.count ?? 5), 20);
    const items = await this.scraper.fetchHomepage();
    if (items.length === 0) throw new BadRequestException('Scraper returned 0 items');
    const targets = items.slice(0, n);
    const results = await Promise.allSettled(
      targets.map((item, i) => this.fcm.publishEpisodeFanout(item, i > 0)),
    );
    return {
      sent: n,
      results: targets.map((item, i) => ({
        title: item.title,
        url: item.url,
        status: results[i].status,
        ...(results[i].status === 'rejected'
          ? { error: (results[i] as PromiseRejectedResult).reason?.message }
          : {}),
      })),
    };
  }

  // --- Blocked countries ---

  @Get('blocked-countries')
  async list() {
    return {
      blocked: this.blocked.all(),
      registered: await this.registry.all(),
    };
  }

  @Post('blocked-countries')
  async add(@Body() body: { country: string }) {
    const country = body?.country?.trim();
    if (!country) throw new BadRequestException('country is required');
    try {
      const added = await this.blocked.add(country);
      return { ok: true, country: country.toUpperCase(), added };
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }

  @Delete('blocked-countries/:cc')
  async remove(@Param('cc') cc: string) {
    try {
      const removed = await this.blocked.remove(cc);
      if (!removed) throw new NotFoundException(`${cc.toUpperCase()} is not blocked`);
      return { ok: true, country: cc.toUpperCase(), removed: true };
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException((e as Error).message);
    }
  }

  // --- Generic JSON KV store ---

  @Get('kv')
  async kvList() {
    return this.kv.all();
  }

  @Get('kv/:key')
  async kvGet(@Param('key') key: string) {
    const entry = await this.kv.get(key);
    if (!entry) throw new NotFoundException(`${key} not found`);
    return entry;
  }

  @Put('kv/:key')
  async kvSet(@Param('key') key: string, @Body() body: unknown) {
    return this.kv.set(key, body);
  }

  @Delete('kv/:key')
  async kvDelete(@Param('key') key: string) {
    const removed = await this.kv.delete(key);
    if (!removed) throw new NotFoundException(`${key} not found`);
    return { ok: true, key, removed: true };
  }

  // --- Device token tracking (uninstall detection) ---

  @Get('devices/stats')
  @ApiOperation({ summary: 'Get device registration stats and daily install counts' })
  @ApiResponse({ status: 200, description: 'Device stats' })
  async deviceStats() {
    return this.devices.getStats();
  }

  @Get('devices')
  @ApiOperation({ summary: 'List registered device tokens (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'uninstalled'] })
  @ApiResponse({ status: 200, description: 'Paginated device list' })
  async deviceList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.devices.getDevices(
      page ? parseInt(page, 10) : 1,
      limit ? Math.min(parseInt(limit, 10), 100) : 20,
      status,
    );
  }

  @Post('devices/ping')
  @ApiOperation({ summary: 'Ping all active devices to detect uninstalls' })
  @ApiResponse({ status: 201, description: 'Ping results: total, uninstalled, errors' })
  async devicePing() {
    return this.devices.pingAllActive();
  }
}
