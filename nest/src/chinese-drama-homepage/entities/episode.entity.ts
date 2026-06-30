import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { CdDrama } from './drama.entity';

@Entity('cd_episodes')
@Unique(['dramaSno', 'episodeNumber'])
export class CdEpisode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'drama_sno', type: 'bigint' })
  dramaSno!: number;

  @Column({ name: 'episode_number', type: 'int' })
  episodeNumber!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @Column({ name: 'source_url', type: 'text' })
  sourceUrl!: string;

  @Column({ name: 'source_type', type: 'varchar', length: 20, default: 'mp4' })
  sourceType!: string;

  @Column({ type: 'int', nullable: true })
  duration!: number | null;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl!: string | null;

  @Column({ name: 'is_vip', type: 'boolean', default: false })
  isVip!: boolean;

  @Column({ name: 'is_special', type: 'boolean', default: false })
  isSpecial!: boolean;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => CdDrama, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drama_sno', referencedColumnName: 'sno' })
  drama!: CdDrama;
}
