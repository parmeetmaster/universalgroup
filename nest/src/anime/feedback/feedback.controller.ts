import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { FeedbackService, CreateFeedbackInput } from './feedback.service';

@ApiTags('Feedback')
@Controller('anime-downloader/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Submit app feedback (no auth required)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['rating'],
      properties: {
        rating: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
        problemTypes: {
          type: 'string',
          description: 'Comma-separated list of selected problems',
          example: 'ads,crashes,slow',
        },
        description: {
          type: 'string',
          description: "User's written feedback",
          example: 'App crashes when downloading large files',
        },
        deviceModel: { type: 'string', example: 'Pixel 7' },
        appVersion: { type: 'string', example: '1.2.3' },
        androidVersion: { type: 'string', example: '14' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid rating value' })
  async submit(@Body() body: CreateFeedbackInput) {
    if (body.rating == null || body.rating < 1 || body.rating > 5) {
      throw new BadRequestException('rating must be between 1 and 5');
    }
    return this.feedbackService.create(body);
  }
}
