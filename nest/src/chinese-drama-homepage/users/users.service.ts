import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CdUser } from '../entities/user.entity';

@Injectable()
export class CdUsersService {
  constructor(
    @InjectRepository(CdUser, 'chinese-drama')
    private readonly repo: Repository<CdUser>,
  ) {}

  async upsert(data: {
    uid: string;
    name: string;
    email: string;
    avatar?: string | null;
    phone?: string | null;
    fcmToken?: string | null;
    country?: string | null;
    deviceId?: string | null;
  }): Promise<CdUser> {
    const existing = await this.repo.findOne({ where: { uid: data.uid } });

    if (existing) {
      existing.name = data.name;
      existing.email = data.email;
      if (data.avatar !== undefined) existing.avatar = data.avatar;
      if (data.phone) existing.phone = data.phone;
      if (data.fcmToken) existing.fcmToken = data.fcmToken;
      if (data.country) existing.country = data.country;
      if (data.deviceId) existing.deviceId = data.deviceId;
      existing.lastLoginAt = new Date();
      return this.repo.save(existing);
    }

    const user = this.repo.create({
      uid: data.uid,
      name: data.name,
      email: data.email,
      avatar: data.avatar ?? null,
      phone: data.phone ?? null,
      fcmToken: data.fcmToken ?? null,
      country: data.country ?? null,
      deviceId: data.deviceId ?? null,
    });
    return this.repo.save(user);
  }

  async updateAge(uid: string, age: number): Promise<void> {
    await this.repo.update({ uid }, { age });
  }

  async findByUid(uid: string): Promise<CdUser | null> {
    return this.repo.findOne({ where: { uid } });
  }
}
