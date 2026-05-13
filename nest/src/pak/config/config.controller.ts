import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PakAppConfigService } from './config.service';
import { UpdateAppConfigDto } from './update-config.dto';
import { PakAdminTokenGuard } from '../common/admin-token.guard';

@ApiTags('pak-config')
@Controller('pakistani-serials/config')
export class PakAppConfigController {
  constructor(private readonly svc: PakAppConfigService) {}

  @Get()
  @ApiOperation({ summary: 'App-wide configuration fetched on splash' })
  @ApiOkResponse({ description: 'App config (versioning, maintenance, links)' })
  get() {
    return this.svc.get();
  }

  @Patch()
  @UseGuards(PakAdminTokenGuard)
  @ApiHeader({ name: 'X-Admin-Token', required: true })
  @ApiOperation({ summary: 'Update app config (admin only, partial)' })
  update(@Body() dto: UpdateAppConfigDto) {
    return this.svc.update(dto);
  }
}
