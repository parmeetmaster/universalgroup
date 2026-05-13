import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('parse_sources')
@Index(['slug'], { unique: true })
@Index(['isActive'])
export class ParseSource {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 120 })
  slug!: string;

  @Column({ name: 'base_url', type: 'varchar', length: 500 })
  baseUrl!: string;

  @Column({ type: 'varchar', length: 64 })
  driver!: string;

  @Column({ type: 'json', nullable: true })
  config!: Record<string, any> | null;

  @Column({ type: 'int', default: 100 })
  priority!: number;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: number;

  @Column({ name: 'last_run_at', type: 'timestamp', nullable: true })
  lastRunAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
