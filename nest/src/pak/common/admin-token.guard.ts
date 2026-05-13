import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PakAuthService } from '../auth/auth.service';

@Injectable()
export class PakAdminTokenGuard implements CanActivate {
  constructor(private readonly auth: PakAuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { adminUser?: { id: string; email: string } }>();
    const token = req.header('x-admin-token') ?? '';
    if (!token) throw new UnauthorizedException('Missing admin token');
    const user = await this.auth.verifySession(token);
    if (!user) throw new UnauthorizedException('Invalid or expired session');
    req.adminUser = { id: user.id, email: user.email };
    return true;
  }
}
