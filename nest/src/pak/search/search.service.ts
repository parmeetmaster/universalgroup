import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Drama } from '../entities/drama.entity';
import { Episode } from '../entities/episode.entity';
import { CastMember } from '../entities/cast-member.entity';

@Injectable()
export class PakSearchService {
  constructor(
    @InjectRepository(Drama, 'pak') private readonly dramaRepo: Repository<Drama>,
    @InjectRepository(Episode, 'pak') private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(CastMember, 'pak') private readonly castRepo: Repository<CastMember>,
  ) {}

  async search(q: string): Promise<{
    dramas: Drama[];
    episodes: Episode[];
    cast: CastMember[];
  }> {
    if (!q || q.trim().length < 2) return { dramas: [], episodes: [], cast: [] };
    const like = ILike(`%${q}%`);
    const [dramas, episodes, cast] = await Promise.all([
      this.dramaRepo.find({
        where: { title: like, isPublished: 1 },
        take: 20,
        relations: { genres: true },
      }),
      this.episodeRepo.find({
        where: { title: like, isPublished: 1 },
        take: 20,
        relations: { drama: true },
      }),
      this.castRepo.find({ where: { name: like }, take: 20 }),
    ]);
    return { dramas, episodes, cast };
  }
}
