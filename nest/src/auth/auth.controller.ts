import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Get('verify')
  verify(@Headers('x-admin-token') token: string) {
    const adminToken = this.configService.get<string>('ADMIN_TOKEN');

    if (!token || !adminToken) {
      throw new UnauthorizedException('Invalid token');
    }

    const tokenBuf = Buffer.from(token);
    const adminBuf = Buffer.from(adminToken);

    if (tokenBuf.length !== adminBuf.length || !timingSafeEqual(tokenBuf, adminBuf)) {
      throw new UnauthorizedException('Invalid token');
    }

    return { valid: true, message: 'Token is valid' };
  }
}
