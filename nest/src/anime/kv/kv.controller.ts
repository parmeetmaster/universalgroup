import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { KvService } from './kv.service';

@ApiTags('kv-store')
@Controller('anime-downloader/kv')
export class KvController {
  constructor(private readonly kvService: KvService) {}

  @Get(':key')
  @ApiOperation({ summary: 'Get KV entry by key' })
  @ApiParam({ name: 'key', description: 'KV entry key (alphanumeric, dots, dashes, underscores)' })
  @ApiResponse({ status: 200, description: 'KV entry value' })
  @ApiResponse({ status: 400, description: 'Invalid key format' })
  async getByKey(@Param('key') key: string) {
    return this.kvService.get(key);
  }
}
