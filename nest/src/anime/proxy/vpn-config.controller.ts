import { Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { VpnConfigService } from './vpn-config.service';
import { VpnValidatorService } from './vpn-validator.service';
import { VpnProtocol } from './entities/vpn-config.entity';

@ApiTags('VPN Configs')
@Controller('anime-downloader/vpn-configs')
export class VpnConfigController {
  constructor(
    private readonly vpnService: VpnConfigService,
    private readonly validator: VpnValidatorService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get working VPN configs',
    description:
      'Returns VPN configs confirmed reachable within the last 6 hours, ordered by most-recently-validated first then by connect speed. Each item includes a ready-to-use Xray outbound JSON object (without a "tag" field — the app adds the tag). Falls back to all active configs by recency if none were validated recently.',
  })
  @ApiQuery({
    name: 'protocol',
    required: false,
    enum: VpnProtocol,
    description: 'Filter by protocol (vmess, vless, trojan, shadowsocks)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max number of configs to return (default: 20)',
    example: '20',
  })
  @ApiResponse({
    status: 200,
    description: 'List of working VPN configs with prebuilt Xray outbounds',
  })
  getConfigs(
    @Query('protocol') protocol?: VpnProtocol,
    @Query('limit') limit?: string,
  ) {
    return this.vpnService.getWorkingConfigs({
      protocol,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get VPN config pool statistics',
    description:
      'Returns total, active, dead, unchecked counts, breakdown by protocol, and average connect speed.',
  })
  @ApiResponse({ status: 200, description: 'VPN config pool stats' })
  getStats() {
    return this.vpnService.getStats();
  }

  @Post('scrape')
  @ApiOperation({
    summary: 'Manually trigger VPN config scraping',
    description:
      'Scrapes all configured free V2Ray/VLESS/VMess/Trojan/Shadowsocks subscription sources, parses them, builds Xray outbounds, and saves new configs to the pool.',
  })
  @ApiResponse({ status: 200, description: 'Scrape results' })
  async triggerScrape() {
    const result = await this.vpnService.scrapeAndSave();
    return { success: true, ...result };
  }

  @Post('validate')
  @ApiOperation({
    summary: 'Manually trigger VPN config validation',
    description:
      'TCP-reachability tests up to 800 configs (oldest-checked first) in parallel batches and updates their status and connect speed.',
  })
  @ApiResponse({ status: 200, description: 'Validation results' })
  async triggerValidate() {
    const result = await this.validator.validateAll();
    return { success: true, ...result };
  }

  @Post('revalidate-active')
  @ApiOperation({
    summary: 'Re-validate the active hot pool',
    description:
      'Re-tests all configs currently marked active and drops any that have become unreachable. Runs automatically every 5 minutes; this endpoint triggers it on demand.',
  })
  @ApiResponse({ status: 200, description: 'Hot-pool revalidation results' })
  async triggerRevalidateActive() {
    const result = await this.validator.revalidateActive();
    return { success: true, ...result };
  }
}
