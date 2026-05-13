import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong. Please try again later.';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
      error = (res as any).error || exception.name;
    } else if (exception instanceof Error) {
      if (exception.message.includes('timeout') || exception.message.includes('ETIMEDOUT')) {
        status = HttpStatus.GATEWAY_TIMEOUT;
        message = 'The upstream server took too long to respond.';
        error = 'Gateway Timeout';
      } else if (exception.message.includes('ECONNREFUSED') || exception.message.includes('ENOTFOUND')) {
        status = HttpStatus.BAD_GATEWAY;
        message = 'Unable to reach the upstream server.';
        error = 'Bad Gateway';
      } else if (exception.message.includes('status code 4')) {
        status = HttpStatus.BAD_GATEWAY;
        message = 'Upstream server returned an error.';
        error = 'Bad Gateway';
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
