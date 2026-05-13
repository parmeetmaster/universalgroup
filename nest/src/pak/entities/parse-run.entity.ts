import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ParseSource } from './parse-source.entity';
import { Drama } from './drama.entity';
import { Episode } from './episode.entity';
import { ParseRunStatusEnum } from './enums';

@Entity('parse_runs')
@Index(['sourceId', 'createdAt'])
@Index(['status'])
export class ParseRun {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'source_id', type: 'bigint', nullable: true })
  sourceId!: string | null;

  @ManyToOne(() => ParseSource, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'source_id' })
  source!: ParseSource | null;

  @Column({ name: 'drama_id', type: 'bigint', nullable: true })
  dramaId!: string | null;

  @ManyToOne(() => Drama, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'drama_id' })
  drama!: Drama | null;

  @Column({ name: 'episode_id', type: 'bigint', nullable: true })
  episodeId!: string | null;

  @ManyToOne(() => Episode, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'episode_id' })
  episode!: Episode | null;

  @Column({ name: 'target_url', type: 'varchar', length: 1000, nullable: true })
  targetUrl!: string | null;

  @Column({ type: 'enum', enum: ParseRunStatusEnum, default: ParseRunStatusEnum.QUEUED })
  status!: ParseRunStatusEnum;

  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @Column({ type: 'json', nullable: true })
  stats!: Record<string, any> | null;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'finished_at', type: 'timestamp', nullable: true })
  finishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
