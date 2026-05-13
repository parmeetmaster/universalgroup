import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DramaStatusEnum, DramaTypeEnum } from './enums';
import { Season } from './season.entity';
import { Episode } from './episode.entity';
import { Genre } from './genre.entity';
import { CastMember } from './cast-member.entity';

@Entity('dramas')
@Index(['slug'], { unique: true })
@Index(['type'])
@Index(['isFeatured'])
@Index(['isPublished'])
@Index(['releaseYear'])
export class Drama {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  synopsis!: string | null;

  @Column({ name: 'poster_url', type: 'varchar', length: 500, nullable: true })
  posterUrl!: string | null;

  @Column({ name: 'backdrop_url', type: 'varchar', length: 500, nullable: true })
  backdropUrl!: string | null;

  @Column({ name: 'trailer_url', type: 'varchar', length: 500, nullable: true })
  trailerUrl!: string | null;

  @Column({
    type: 'enum',
    enum: DramaTypeEnum,
    default: DramaTypeEnum.DRAMA,
  })
  type!: DramaTypeEnum;

  @Column({
    type: 'enum',
    enum: DramaStatusEnum,
    default: DramaStatusEnum.ONGOING,
  })
  status!: DramaStatusEnum;

  @Column({ name: 'release_year', type: 'smallint', nullable: true })
  releaseYear!: number | null;

  @Column({ name: 'rating_avg', type: 'decimal', precision: 3, scale: 2, default: 0 })
  ratingAvg!: string;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount!: number;

  @Column({ name: 'total_seasons', type: 'int', default: 1 })
  totalSeasons!: number;

  @Column({ name: 'total_episodes', type: 'int', default: 0 })
  totalEpisodes!: number;

  @Column({ type: 'varchar', length: 8, default: 'ur' })
  language!: string;

  @Column({ name: 'is_featured', type: 'tinyint', width: 1, default: 0 })
  isFeatured!: number;

  @Column({ name: 'is_published', type: 'tinyint', width: 1, default: 0 })
  isPublished!: number;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'source_url', type: 'varchar', length: 500, nullable: true })
  sourceUrl!: string | null;

  @Column({ name: 'parse_last_modified', type: 'timestamp', nullable: true })
  parseLastModified!: Date | null;

  @Column({ name: 'parse_last_attempted_at', type: 'timestamp', nullable: true })
  parseLastAttemptedAt!: Date | null;

  @Column({ name: 'parse_last_succeeded_at', type: 'timestamp', nullable: true })
  parseLastSucceededAt!: Date | null;

  @Column({ name: 'parse_failure_count', type: 'int', default: 0 })
  parseFailureCount!: number;

  @Column({ name: 'parse_frozen_until', type: 'timestamp', nullable: true })
  parseFrozenUntil!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;

  @OneToMany(() => Season, (s) => s.drama, { cascade: true })
  seasons!: Season[];

  @OneToMany(() => Episode, (e) => e.drama)
  episodes!: Episode[];

  @ManyToMany(() => Genre, (g) => g.dramas)
  @JoinTable({
    name: 'drama_genres',
    joinColumn: { name: 'drama_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
  })
  genres!: Genre[];

  @ManyToMany(() => CastMember, (c) => c.dramas)
  @JoinTable({
    name: 'drama_cast',
    joinColumn: { name: 'drama_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'cast_member_id', referencedColumnName: 'id' },
  })
  cast!: CastMember[];
}
