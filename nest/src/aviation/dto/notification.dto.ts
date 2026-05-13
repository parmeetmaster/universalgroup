import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationSettingDto {
  @ApiProperty({ example: 'fcm_device_token_here', description: 'Firebase device token' })
  deviceToken: string;

  @ApiProperty({ example: true, description: 'Enable or disable notifications' })
  enabled: boolean;
}

export class NotificationSettingResponseDto {
  @ApiProperty({ example: 'fcm_device_token_here', description: 'Firebase device token' })
  deviceToken: string;

  @ApiProperty({ example: true, description: 'Whether notifications are enabled for this device' })
  enabled: boolean;

  @ApiProperty({ example: 'breaking_news', description: 'Subscribed topic' })
  topic: string;

  @ApiProperty({ example: '2026-03-21T10:00:00.000Z', description: 'Last updated timestamp' })
  updatedAt: Date;
}
