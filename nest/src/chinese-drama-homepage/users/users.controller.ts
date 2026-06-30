import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CdUsersService } from './users.service';

class UpsertUserDto {
  uid: string;
  name: string;
  email: string;
  avatar?: string | null;
  phone?: string | null;
  fcmToken?: string | null;
  country?: string | null;
  deviceId?: string | null;
}

class UpdateAgeDto {
  age: number;
}

@ApiTags('Chinese Drama - Users')
@Controller('chinese-drama/users')
export class CdUsersController {
  constructor(private readonly usersService: CdUsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update user on login' })
  @ApiBody({ type: UpsertUserDto })
  @ApiResponse({ status: 201, description: 'User upserted' })
  async upsert(@Body() body: UpsertUserDto) {
    const user = await this.usersService.upsert(body);
    return { success: true, data: user };
  }

  @Get(':uid')
  @ApiOperation({ summary: 'Get user by UID' })
  @ApiParam({ name: 'uid', description: 'Google user ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  async getUser(@Param('uid') uid: string) {
    const user = await this.usersService.findByUid(uid);
    return { success: true, data: user };
  }

  @Patch(':uid/age')
  @ApiOperation({ summary: 'Update user age' })
  @ApiParam({ name: 'uid', description: 'Google user ID' })
  @ApiBody({ type: UpdateAgeDto })
  @ApiResponse({ status: 200, description: 'Age updated' })
  async updateAge(@Param('uid') uid: string, @Body() body: UpdateAgeDto) {
    await this.usersService.updateAge(uid, body.age);
    return { success: true };
  }
}
