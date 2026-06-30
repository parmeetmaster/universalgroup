import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CdConfigService } from './config.service';
import { CdUpdateConfigDto } from './update-config.dto';

@ApiTags('Chinese Drama - Config')
@Controller('chinese-drama/app-config')
export class CdConfigController {
  constructor(private readonly configService: CdConfigService) {}

  @Get()
  @ApiOperation({ summary: 'App config with genres list, fetched on splash' })
  @ApiOkResponse({ description: 'App config including versioning, maintenance, and genres' })
  getAppConfig() {
    return this.configService.getAppConfig();
  }

  @Patch()
  @ApiOperation({ summary: 'Partial update app config' })
  @ApiBody({ type: CdUpdateConfigDto })
  @ApiOkResponse({ description: 'Updated app config' })
  updateAppConfig(@Body() dto: CdUpdateConfigDto) {
    return this.configService.updateConfig(dto);
  }
}
