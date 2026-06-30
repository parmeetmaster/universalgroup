import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { MatchMethodEnum, SourceLinkStatusEnum } from './enums';
import { Drama } from './drama.entity';
import { ParseSource } from './parse-source.entity';

@Entity('drama_source_links')
@Unique(['dramaId', 'sourceId'])
@Index(['sourceId', 'status'])
@Index(['dramaId', 'priority'])
export class DramaSourceLink {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'drama_id', type: 'bigint' })
  dramaId!: string;

  @Column({ name: 'source_id', type: 'bigint' })
  sourceId!: string;

  @Column({ name: 'source_url', type: 'varchar', length: 500 })
  sourceUrl!: string;

  @Column({ name: 'source_slug', type: 'varchar', length: 255 })
  sourceSlug!: string;

  @Column({
    name: 'match_method',
    type: 'enum',
    enum: MatchMethodEnum,
    default: MatchMethodEnum.EXACT_SLUG,
  })
  matchMethod!: MatchMethodEnum;

  @Column({ name: 'match_confidence', type: 'tinyint', unsigned: true, default: 100 })
  matchConfidence!: number;

  @Column({ name: 'is_primary', type: 'tinyint', width: 1, default: 0 })
  isPrimary!: number;

  @Column({ type: 'int', default: 100 })
  priority!: number;

  @Column({
    type: 'enum',
    enum: SourceLinkStatusEnum,
    default: SourceLinkStatusEnum.ACTIVE,
  })
  status!: SourceLinkStatusEnum;

  @Column({ name: 'last_scraped_at', type: 'timestamp', nullable: true })
  lastScrapedAt!: Date | null;

  @Column({ name: 'last_failed_at', type: 'timestamp', nullable: true })
  lastFailedAt!: Date | null;

  @Column({ name: 'failure_count', type: 'int', default: 0 })
  failureCount!: number;

  @Column({ name: 'frozen_until', type: 'timestamp', nullable: true })
  frozenUntil!: Date | null;

  @Column({ name: 'parse_last_modified', type: 'timestamp', nullable: true })
  parseLastModified!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Drama, (d) => d.sourceLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drama_id' })
  drama!: Drama;

  @ManyToOne(() => ParseSource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_id' })
  source!: ParseSource;
}
