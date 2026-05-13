import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Episode } from './episode.entity';
import { ParseSource } from './parse-source.entity';
import { VideoFormatEnum, VideoQualityEnum } from './enums';

@Entity('episode_videos')
@Index(['episodeId', 'isActive', 'priority'])
export class EpisodeVideo {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'episode_id', type: 'bigint' })
  episodeId!: string;

  @ManyToOne(() => Episode, (e) => e.videos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'episode_id' })
  episode!: Episode;

  @Column({ name: 'source_id', type: 'bigint', nullable: true })
  sourceId!: string | null;

  @ManyToOne(() => ParseSource, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'source_id' })
  source!: ParseSource | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  label!: string | null;

  @Column({ type: 'varchar', length: 1000 })
  url!: string;

  @Column({ type: 'enum', enum: VideoFormatEnum, default: VideoFormatEnum.HLS })
  format!: VideoFormatEnum;

  @Column({ type: 'enum', enum: VideoQualityEnum, default: VideoQualityEnum.AUTO })
  quality!: VideoQualityEnum;

  @Column({ type: 'varchar', length: 8, default: 'ur' })
  language!: string;

  @Column({ name: 'subtitle_url', type: 'varchar', length: 1000, nullable: true })
  subtitleUrl!: string | null;

  @Column({ type: 'json', nullable: true })
  headers!: Record<string, string> | null;

  @Column({ type: 'int', default: 100 })
  priority!: number;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: number;

  @Column({ name: 'play_count', type: 'int', default: 0 })
  playCount!: number;

  @Column({ name: 'last_verified_at', type: 'timestamp', nullable: true })
  lastVerifiedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
