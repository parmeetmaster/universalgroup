import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KvEntryEntity } from './entities/kv-entry.entity';

const KEY_PATTERN = /^[a-zA-Z0-9._-]{1,128}$/;

@Injectable()
export class KvService {
  constructor(
    @InjectRepository(KvEntryEntity, 'anime')
    private readonly repo: Repository<KvEntryEntity>,
  ) {}

  private assertValidKey(key: string) {
    if (!KEY_PATTERN.test(key)) {
      throw new BadRequestException(
        'key must match /^[a-zA-Z0-9._-]{1,128}$/',
      );
    }
  }

  async get(key: string): Promise<KvEntryEntity | null> {
    this.assertValidKey(key);
    return this.repo.findOne({ where: { key } });
  }

  async all(): Promise<KvEntryEntity[]> {
    return this.repo.find({ order: { key: 'ASC' } });
  }

  async set(key: string, value: unknown): Promise<KvEntryEntity> {
    this.assertValidKey(key);
    if (value === undefined) {
      throw new BadRequestException('value is required');
    }
    await this.repo.save(this.repo.create({ key, value }));
    return (await this.repo.findOne({ where: { key } }))!;
  }

  async delete(key: string): Promise<boolean> {
    this.assertValidKey(key);
    const result = await this.repo.delete({ key });
    return (result.affected ?? 0) > 0;
  }
}
