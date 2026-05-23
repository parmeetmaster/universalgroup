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
  @ApiOperation({
    summary: 'Register device FCM token and check ad grace period',
  })
  @ApiBody({
    schema: {
      properties: {
        token: { type: 'string', description: 'FCM registration token' },
        country: {
          type: 'string',
          description: 'ISO 3166-1 alpha-2 country code',
        },
        appVersion: { type: 'string', description: 'App version string' },
        deviceModel: { type: 'string', description: 'Device model name' },
        deviceId: {
          type: 'string',
          description:
            'Android device ID (Settings.Secure.ANDROID_ID) for ad grace tracking',
        },
      },
      required: ['token'],
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Device registered, subscribed to FCM topics, ad grace period checked',
    schema: {
      properties: {
        ok: { type: 'boolean' },
        topics: { type: 'array', items: { type: 'string' } },
        blocked: { type: 'boolean' },
        fcmEnabled: { type: 'boolean' },
        grace: {
          type: 'object',
          nullable: true,
          properties: {
            graceActive: { type: 'boolean' },
            graceExpiresAt: { type: 'string', format: 'date-time' },
            graceRemainingMs: { type: 'number' },
          },
        },
      },
    },
  })
  async register(
    @Body()
    body: {
      token: string;
      country?: string;
      appVersion?: string;
      deviceModel?: string;
      deviceId?: string;
    },
  ) {
    const token = body?.token?.trim();
    if (!token) throw new BadRequestException('token is required');

    const country = body?.country?.trim();
    const deviceId = body?.deviceId?.trim();

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

    let grace: { graceActive: boolean; graceExpiresAt: string; graceRemainingMs: number } | null = null;
    if (deviceId) {
      grace = await this.devices.checkOrCreateGrace(
        deviceId,
        country,
        body?.appVersion?.trim(),
        body?.deviceModel?.trim(),
      );
    }

    return { ok: true, topics, blocked, fcmEnabled: this.fcm.isEnabled, grace };
  }
}
