import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { MangaAdminTokenGuard } from '../config/admin-token.guard';
import { MangaNotificationCronService } from './manga-notification-cron.service';

@ApiTags('manga-notifications')
@Controller('manga/notifications')
export class MangaNotificationsController {
  constructor(private readonly cron: MangaNotificationCronService) {}

  @Post('trigger')
  @UseGuards(MangaAdminTokenGuard)
  @ApiHeader({ name: 'X-Admin-Token', required: true })
  @ApiOperation({
    summary: 'Manually run the Asura new-chapter scan (admin)',
    description:
      'Runs the same hourly scan path on demand. Pass ?dry=1 to preview the chapters that WOULD be notified without any DB writes or FCM sends.',
  })
  @ApiQuery({
    name: 'dry',
    required: false,
    description: 'dry=1 → preview only (no DB writes, no FCM)',
    example: '1',
  })
  @ApiOkResponse({
    description:
      'Scan result with scraped/fresh/sent counts (and a wouldSend list in dry mode)',
  })
  async trigger(@Query('dry') dry?: string) {
    const preview = dry === '1' || dry === 'true';
    return this.cron.runOnce(preview);
  }
}
