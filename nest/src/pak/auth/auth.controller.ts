import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PakAuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PakAdminTokenGuard } from '../common/admin-token.guard';

type AuthedRequest = Request & { adminUser?: { id: string; email: string } };

@ApiTags('pak-auth')
@Controller('pakistani-serials/auth')
export class PakAuthController {
  constructor(private readonly svc: PakAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Email + password -> issues session token' })
  login(@Body() dto: LoginDto) {
    return this.svc.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(PakAdminTokenGuard)
  @ApiHeader({ name: 'X-Admin-Token', required: true })
  @ApiOperation({ summary: 'Current session info' })
  me(@Req() req: AuthedRequest) {
    return { email: req.adminUser?.email ?? null };
  }

  @Post('change-password')
  @UseGuards(PakAdminTokenGuard)
  @ApiHeader({ name: 'X-Admin-Token', required: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password, rotates session token' })
  async change(@Req() req: AuthedRequest, @Body() dto: ChangePasswordDto) {
    const uid = req.adminUser!.id;
    return this.svc.changePassword(uid, dto.currentPassword, dto.newPassword);
  }

  @Post('logout')
  @UseGuards(PakAdminTokenGuard)
  @ApiHeader({ name: 'X-Admin-Token', required: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Invalidate current session token' })
  async logout(@Req() req: Request) {
    const token = req.header('x-admin-token') ?? '';
    await this.svc.logout(token);
  }
}
