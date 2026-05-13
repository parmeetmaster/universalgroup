import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Drama } from './drama.entity';
import { Season } from './season.entity';
import { EpisodeVideo } from './episode-video.entity';

@Entity('episodes')
@Index(['dramaId', 'seasonId', 'number'], { unique: true })
@Index(['airDate'])
export class Episode {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'drama_id', type: 'bigint' })
  dramaId!: string;

  @ManyToOne(() => Drama, (d) => d.episodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drama_id' })
  drama!: Drama;

  @Column({ name: 'season_id', type: 'bigint' })
  seasonId!: string;

  @ManyToOne(() => Season, (s) => s.episodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'season_id' })
  season!: Season;

  @Column({ type: 'int' })
  number!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @Column({ type: 'text', nullable: true })
  synopsis!: string | null;

  @Column({ name: 'duration_seconds', type: 'int', default: 0 })
  durationSeconds!: number;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 500, nullable: true })
  thumbnailUrl!: string | null;

  @Column({ name: 'air_date', type: 'date', nullable: true })
  airDate!: string | null;

  @Column({ name: 'source_url', type: 'varchar', length: 500, nullable: true })
  sourceUrl!: string | null;

  @Column({ name: 'is_published', type: 'tinyint', width: 1, default: 1 })
  isPublished!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => EpisodeVideo, (v) => v.episode, { cascade: true })
  videos!: EpisodeVideo[];
}
