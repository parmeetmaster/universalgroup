import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('pak-health')
@Controller('pakistani-serials/health')
export class PakHealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  get() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
