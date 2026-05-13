import { Controller, Get, Post, Put, Query, Param, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBody, ApiParam, ApiProperty } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SentNotificationEntity } from '../entities/sent-notification.entity';
import { NotificationSettingEntity } from '../entities/notification-setting.entity';
import { UpdateNotificationSettingDto, NotificationSettingResponseDto } from '../dto/notification.dto';
import { NotificationCronService } from '../notifications/notification-cron.service';
import { FirebaseService } from '../notifications/firebase.service';

@ApiTags('Notifications')
@Controller('aviation-news/notifications')
export class NotificationController {
  constructor(
    @InjectRepository(SentNotificationEntity, 'aviation')
    private readonly sentRepo: Repository<SentNotificationEntity>,
    @InjectRepository(NotificationSettingEntity, 'aviation')
    private readonly settingRepo: Repository<NotificationSettingEntity>,
    private readonly cronService: NotificationCronService,
    private readonly firebase: FirebaseService,
  ) {}

  @Post('scan')
  @ApiOperation({ summary: 'Manually trigger article scan and send notifications' })
  @ApiResponse({ status: 200, description: 'Scan triggered' })
  async triggerScan() {
    await this.cronService.scanAndNotify();
    return { success: true, message: 'Scan completed' };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get notification history', description: 'Returns list of sent notifications' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records (default: 20)', example: '20' })
  @ApiResponse({ status: 200, description: 'Notification history retrieved' })
  async getHistory(@Query('limit') limit: string = '20') {
    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const notifications = await this.sentRepo.find({
      order: { sentAt: 'DESC' },
      take,
    });
    return {
      count: notifications.length,
      notifications,
    };
  }

  @Post('ad')
  @ApiOperation({
    summary: 'Send ad/promo notification',
    description: 'Sends a promotional notification. On tap opens Play Store or any URL.',
  })
  @ApiResponse({ status: 200, description: 'Ad notification sent' })
  async sendAdNotification(
    @Body() body: {
      title: string;
      body: string;
      imageUrl?: string;
      storeUrl: string;
    },
  ) {
    if (!body.title || !body.storeUrl) {
      throw new BadRequestException('title and storeUrl are required');
    }

    const sent = await this.firebase.sendToTopic(
      'breaking_news',
      body.title,
      body.body || '',
      body.imageUrl || undefined,
      {
        type: 'ad',
        storeUrl: body.storeUrl,
      },
    );

    return { success: sent, message: sent ? 'Ad notification sent' : 'Failed to send' };
  }

  @Get('status')
  @ApiOperation({ summary: 'Check notification service status' })
  @ApiResponse({ status: 200, description: 'Notification service status' })
  async getStatus() {
    return {
      firebase: this.firebase.isReady(),
      database: true,
      cronSchedule: 'Every hour at minute 0',
    };
  }

  @Put('settings')
  @ApiOperation({
    summary: 'Enable or disable notifications for a device',
    description: 'Subscribes or unsubscribes a device from the breaking_news topic based on the enabled flag.',
  })
  @ApiBody({ type: UpdateNotificationSettingDto })
  @ApiResponse({ status: 200, description: 'Notification setting updated', type: NotificationSettingResponseDto })
  async updateSetting(@Body() body: UpdateNotificationSettingDto) {
    if (!body.deviceToken) {
      throw new BadRequestException('deviceToken is required');
    }

    const topic = 'breaking_news';

    // Subscribe or unsubscribe from Firebase topic
    if (body.enabled) {
      await this.firebase.subscribeToTopic(body.deviceToken, topic);
    } else {
      await this.firebase.unsubscribeFromTopic(body.deviceToken, topic);
    }

    // Save setting to DB
    let setting = await this.settingRepo.findOne({ where: { deviceToken: body.deviceToken } });

    if (setting) {
      setting.enabled = body.enabled;
    } else {
      setting = this.settingRepo.create({
        deviceToken: body.deviceToken,
        enabled: body.enabled,
        topic,
      });
    }

    await this.settingRepo.save(setting);

    return {
      deviceToken: setting.deviceToken,
      enabled: setting.enabled,
      topic: setting.topic,
      updatedAt: setting.updatedAt,
    };
  }

  @Get('settings/:deviceToken')
  @ApiOperation({
    summary: 'Get notification setting for a device',
    description: 'Returns whether notifications are enabled or disabled for the given device token.',
  })
  @ApiParam({ name: 'deviceToken', description: 'Firebase device token', example: 'fcm_device_token_here' })
  @ApiResponse({ status: 200, description: 'Notification setting retrieved', type: NotificationSettingResponseDto })
  async getSetting(@Param('deviceToken') deviceToken: string) {
    const setting = await this.settingRepo.findOne({ where: { deviceToken } });

    if (!setting) {
      return {
        deviceToken,
        enabled: true,
        topic: 'breaking_news',
        updatedAt: null,
      };
    }

    return {
      deviceToken: setting.deviceToken,
      enabled: setting.enabled,
      topic: setting.topic,
      updatedAt: setting.updatedAt,
    };
  }
}
