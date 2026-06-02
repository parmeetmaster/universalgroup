import { Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ProxyService } from './proxy.service';
import { ProxyValidatorService } from './proxy-validator.service';
import { ProxyProtocol } from './entities/proxy.entity';

@ApiTags('Proxy Manager')
@Controller('anime-downloader/proxies')
export class ProxyController {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly validator: ProxyValidatorService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get working proxies',
    description:
      'Returns a list of validated, active proxies sorted by speed. Supports filtering by protocol, country, and max speed.',
  })
  @ApiQuery({
    name: 'protocol',
    required: false,
    enum: ProxyProtocol,
    description: 'Filter by protocol (http, https, socks4, socks5)',
  })
  @ApiQuery({
    name: 'country',
    required: false,
    description: 'Filter by 2-letter country code (e.g. US, RU, DE)',
    example: 'US',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max number of proxies to return (default: 50)',
    example: '20',
  })
  @ApiQuery({
    name: 'maxSpeed',
    required: false,
    description: 'Max response time in ms (only return faster proxies)',
    example: '3000',
  })
  @ApiResponse({ status: 200, description: 'List of active proxies' })
  getProxies(
    @Query('protocol') protocol?: ProxyProtocol,
    @Query('country') country?: string,
    @Query('limit') limit?: string,
    @Query('maxSpeed') maxSpeed?: string,
  ) {
    return this.proxyService.getWorkingProxies({
      protocol,
      country,
      limit: limit ? parseInt(limit, 10) : undefined,
      maxSpeed: maxSpeed ? parseInt(maxSpeed, 10) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get proxy pool statistics',
    description:
      'Returns total, active, dead, unchecked counts, breakdown by protocol, and average speed.',
  })
  @ApiResponse({ status: 200, description: 'Proxy pool stats' })
  getStats() {
    return this.proxyService.getStats();
  }

  @Post('scrape')
  @ApiOperation({
    summary: 'Manually trigger proxy scraping',
    description:
      'Scrapes all configured free proxy sources and saves new proxies to the pool.',
  })
  @ApiResponse({ status: 200, description: 'Scrape results' })
  async triggerScrape() {
    const result = await this.proxyService.scrapeAndSave();
    return { success: true, ...result };
  }

  @Post('validate')
  @ApiOperation({
    summary: 'Manually trigger proxy validation',
    description:
      'Tests up to 500 proxies against test URLs and updates their status and speed.',
  })
  @ApiResponse({ status: 200, description: 'Validation results' })
  async triggerValidate() {
    const result = await this.validator.validateAll();
    return { success: true, ...result };
  }

  @Post('cleanup')
  @ApiOperation({
    summary: 'Remove dead proxies',
    description:
      'Deletes proxies that have failed validation 10+ times.',
  })
  @ApiResponse({ status: 200, description: 'Cleanup results' })
  async triggerCleanup() {
    const deleted = await this.validator.cleanup();
    return { success: true, deleted };
  }
}
