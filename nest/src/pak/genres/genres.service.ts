import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from '../entities/genre.entity';

@Injectable()
export class PakGenresService {
  constructor(
    @InjectRepository(Genre, 'pak') private readonly repo: Repository<Genre>,
  ) {}

  list(): Promise<Genre[]> {
    return this.repo.find({ order: { displayOrder: 'ASC', name: 'ASC' } });
  }

  async findBySlug(slug: string): Promise<Genre> {
    const genre = await this.repo.findOne({ where: { slug } });
    if (!genre) throw new NotFoundException('Genre not found');
    return genre;
  }
}
