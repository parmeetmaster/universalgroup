import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class AviationAdminTokenGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const token = req.header('x-admin-token') ?? '';
    const expected = process.env.ADMIN_TOKEN ?? '';

    if (!token || !expected) {
      throw new UnauthorizedException('Missing admin token');
    }

    const tokenBuf = Buffer.from(token);
    const expectedBuf = Buffer.from(expected);

    if (
      tokenBuf.length !== expectedBuf.length ||
      !timingSafeEqual(tokenBuf, expectedBuf)
    ) {
      throw new UnauthorizedException('Invalid admin token');
    }

    return true;
  }
}
