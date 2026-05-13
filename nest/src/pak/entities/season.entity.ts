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
import { Episode } from './episode.entity';

@Entity('seasons')
@Index(['dramaId', 'number'], { unique: true })
export class Season {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'drama_id', type: 'bigint' })
  dramaId!: string;

  @ManyToOne(() => Drama, (d) => d.seasons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drama_id' })
  drama!: Drama;

  @Column({ type: 'int' })
  number!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @Column({ type: 'text', nullable: true })
  synopsis!: string | null;

  @Column({ name: 'poster_url', type: 'varchar', length: 500, nullable: true })
  posterUrl!: string | null;

  @Column({ name: 'total_episodes', type: 'int', default: 0 })
  totalEpisodes!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Episode, (e) => e.season)
  episodes!: Episode[];
}
