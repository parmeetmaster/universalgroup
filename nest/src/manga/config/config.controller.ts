import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MangaAppConfigService } from './config.service';
import { UpdateAppConfigDto } from './update-config.dto';
import { MangaAdminTokenGuard } from './admin-token.guard';

@ApiTags('manga-config')
@Controller('manga/config')
export class MangaAppConfigController {
  constructor(private readonly svc: MangaAppConfigService) {}

  @Get()
  @ApiOperation({ summary: 'App-wide configuration fetched on splash' })
  @ApiOkResponse({ description: 'App config (versioning, maintenance, links)' })
  get() {
    return this.svc.get();
  }

  @Patch()
  @UseGuards(MangaAdminTokenGuard)
  @ApiHeader({ name: 'X-Admin-Token', required: true })
  @ApiOperation({ summary: 'Update app config (admin only, partial)' })
  update(@Body() dto: UpdateAppConfigDto) {
    return this.svc.update(dto);
  }
}
