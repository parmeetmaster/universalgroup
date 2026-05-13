import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ADMIN_TOKEN');
    if (!expected || expected.length < 12) {
      this.logger.warn('ADMIN_TOKEN not set or too short — admin routes disabled');
      throw new ServiceUnavailableException('admin api is not provisioned');
    }

    const req = context.switchToHttp().getRequest<Request>();
    const provided = (req.header('x-admin-token') ?? '').trim();

    if (!provided || !timingSafeEqual(provided, expected)) {
      throw new ForbiddenException('invalid admin token');
    }
    return true;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
