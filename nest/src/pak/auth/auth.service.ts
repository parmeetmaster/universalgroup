import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { AdminUser } from '../entities/admin-user.entity';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const SEED_EMAIL = 'parmeets834@gmail.com';
const SEED_PASSWORD = 'asd1236547899';

@Injectable()
export class PakAuthService implements OnModuleInit {
  private readonly logger = new Logger(PakAuthService.name);

  constructor(
    @InjectRepository(AdminUser, 'pak')
    private readonly repo: Repository<AdminUser>,
  ) {}

  async onModuleInit(): Promise<void> {
    const existing = await this.repo.findOne({ where: { email: SEED_EMAIL } });
    if (existing) return;
    const passwordHash = await argon2.hash(SEED_PASSWORD);
    await this.repo.save(
      this.repo.create({ email: SEED_EMAIL, passwordHash }),
    );
    this.logger.log(`Seeded admin user ${SEED_EMAIL}`);
  }

  async login(email: string, password: string): Promise<{
    token: string;
    email: string;
    expiresAt: Date;
  }> {
    const user = await this.repo.findOne({ where: { email } });
    const hashToCheck =
      user?.passwordHash ??
      '$argon2id$v=19$m=65536,t=3,p=4$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    let ok = false;
    try {
      ok = await argon2.verify(hashToCheck, password);
    } catch {
      ok = false;
    }
    if (!user || !ok) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const token = randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    user.sessionToken = token;
    user.sessionExpiresAt = expiresAt;
    await this.repo.save(user);
    return { token, email: user.email, expiresAt };
  }

  async verifySession(token: string): Promise<AdminUser | null> {
    if (!token) return null;
    const user = await this.repo.findOne({ where: { sessionToken: token } });
    if (!user) return null;
    if (user.sessionExpiresAt && user.sessionExpiresAt.getTime() < Date.now()) {
      return null;
    }
    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 chars');
    }
    if (newPassword === currentPassword) {
      throw new BadRequestException('New password must differ from the current one');
    }
    const user = await this.repo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    const ok = await argon2.verify(user.passwordHash, currentPassword);
    if (!ok) throw new UnauthorizedException('Current password is wrong');
    user.passwordHash = await argon2.hash(newPassword);
    const token = randomBytes(48).toString('hex');
    user.sessionToken = token;
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    user.sessionExpiresAt = expiresAt;
    await this.repo.save(user);
    return { token, expiresAt };
  }

  async logout(token: string): Promise<void> {
    if (!token) return;
    await this.repo.update({ sessionToken: token }, {
      sessionToken: null,
      sessionExpiresAt: null,
    });
  }
}
