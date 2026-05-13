import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FcmService } from '../fcm/fcm.service';
import { DevicesService } from './devices.service';

@ApiTags('anime-downloader')
@Controller('anime-downloader/devices')
export class DevicesController {
  constructor(
    private readonly fcm: FcmService,
    private readonly devices: DevicesService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register device FCM token for push notifications' })
  @ApiBody({
    schema: {
      properties: {
        token: { type: 'string', description: 'FCM registration token' },
        country: { type: 'string', description: 'ISO 3166-1 alpha-2 country code' },
        appVersion: { type: 'string', description: 'App version string' },
        deviceModel: { type: 'string', description: 'Device model name' },
      },
      required: ['token'],
    },
  })
  @ApiResponse({ status: 201, description: 'Device registered and subscribed to FCM topics' })
  async register(
    @Body() body: { token: string; country?: string; appVersion?: string; deviceModel?: string },
  ) {
    const token = body?.token?.trim();
    if (!token) throw new BadRequestException('token is required');

    const country = body?.country?.trim();
    const [topics] = await Promise.all([
      this.fcm.subscribeToCountry(token, country),
      this.devices.upsertDevice(
        token,
        country,
        body?.appVersion?.trim(),
        body?.deviceModel?.trim(),
      ),
    ]);
    const blocked = topics.length === 0;
    return { ok: true, topics, blocked, fcmEnabled: this.fcm.isEnabled };
  }
}
