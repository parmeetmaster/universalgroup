import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AviationAppConfigService } from './config.service';
import { UpdateAppConfigDto } from './update-config.dto';
import { AviationAdminTokenGuard } from './admin-token.guard';

@ApiTags('aviation-config')
@Controller('aviation-news/config')
export class AviationAppConfigController {
  constructor(private readonly svc: AviationAppConfigService) {}

  @Get()
  @ApiOperation({ summary: 'App-wide configuration fetched on splash' })
  @ApiOkResponse({ description: 'App config (versioning, maintenance, links)' })
  get() {
    return this.svc.get();
  }

  @Patch()
  @UseGuards(AviationAdminTokenGuard)
  @ApiHeader({ name: 'X-Admin-Token', required: true })
  @ApiOperation({ summary: 'Update app config (admin only, partial)' })
  update(@Body() dto: UpdateAppConfigDto) {
    return this.svc.update(dto);
  }
}
