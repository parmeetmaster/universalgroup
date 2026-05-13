import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UserCredentialsEntity } from './user-credentials.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserCredentialsEntity, 'auth')
    private readonly userRepo: Repository<UserCredentialsEntity>,
    private readonly configService: ConfigService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ token: string; name: string; email: string }> {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .where('LOWER(u.email) = LOWER(:email)', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.password !== password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.role !== 'admin') {
      throw new UnauthorizedException('Access denied: admin role required');
    }

    if (user.isBanned === 1) {
      throw new UnauthorizedException('Account is banned');
    }

    const token = this.configService.get<string>('ADMIN_TOKEN', '');

    return { token, name: user.name, email: user.email };
  }
}
