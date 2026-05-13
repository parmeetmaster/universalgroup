import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity, 'anime')
    private readonly users: Repository<UserEntity>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = this.config.get<string>('SEED_LOGIN_EMAIL')?.trim().toLowerCase();
    const password = this.config.get<string>('SEED_LOGIN_PASSWORD');
    if (!email || !password) {
      const count = await this.users.count();
      if (count === 0) {
        this.logger.warn('SEED_LOGIN_EMAIL / SEED_LOGIN_PASSWORD unset AND no users in DB — dashboard login will refuse every request');
      }
      return;
    }

    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      const matches = await bcrypt.compare(password, existing.passwordHash);
      if (!matches) {
        existing.passwordHash = await bcrypt.hash(password, 10);
        await this.users.save(existing);
        this.logger.log(`Reset password for seeded user ${email}`);
      }
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    await this.users.save(this.users.create({ email, passwordHash: hash }));
    this.logger.log(`Seeded dashboard operator account ${email}`);
  }

  async login(email: string, password: string): Promise<{ token: string; email: string }> {
    const normalized = (email || '').trim().toLowerCase();
    const user = await this.users.findOne({ where: { email: normalized } });
    const hash = user?.passwordHash ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
    const ok = await bcrypt.compare(password ?? '', hash);
    if (!user || !ok) {
      throw new UnauthorizedException('invalid email or password');
    }
    const adminToken = this.config.get<string>('ADMIN_TOKEN');
    if (!adminToken || adminToken.length < 12) {
      this.logger.error('ADMIN_TOKEN is unset — login cannot issue a dashboard session');
      throw new UnauthorizedException('server not provisioned');
    }
    return { token: adminToken, email: normalized };
  }
}
