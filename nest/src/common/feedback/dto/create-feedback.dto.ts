import { ApiProperty } from '@nestjs/swagger';

/**
 * Documented shape of a feedback submission. All fields except `message` are
 * optional. Unknown fields are accepted too — they are stored in the entity's
 * `extra` JSON column rather than rejected, so the endpoint stays flexible across
 * apps. No global ValidationPipe strips them, so extra keys survive at runtime.
 */
export class CreateFeedbackDto {
  @ApiProperty({ description: 'The issue / feedback text', example: 'Video does not play on site X' })
  message: string;

  @ApiProperty({ required: false, description: 'Category of the report', example: 'issue' })
  type?: string;

  @ApiProperty({ required: false, description: 'Optional contact so we can reply (email / telegram / anything)', example: 'user@example.com' })
  contact?: string;

  @ApiProperty({ required: false, description: 'App version name/code', example: '1.0.5 (245)' })
  appVersion?: string;

  @ApiProperty({ required: false, description: 'Platform', example: 'android' })
  platform?: string;

  @ApiProperty({ required: false, description: 'Device info (model, OS version)', example: 'vivo I2407 / Android 16' })
  deviceInfo?: string;

  // Any additional app-specific fields are accepted and stored as-is in the
  // flexible `extra` column. Decorators are not valid on an index signature,
  // so this stays undocumented in Swagger (Swagger can't model open key sets).
  [key: string]: unknown;
}
