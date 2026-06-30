import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CdGenre } from './genre.entity';

@Entity('dramas')
export class CdDrama {
  @PrimaryGeneratedColumn()
  sno!: number;

  @Column({ name: 'drama_id', type: 'varchar', length: 255 })
  dramaId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'original_name', type: 'varchar', length: 255, nullable: true })
  originalName!: string | null;

  @Column({ name: 'alternative_names', type: 'text', nullable: true })
  alternativeNames!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'short_drama' })
  type!: string;

  @Column({ type: 'varchar', length: 50, default: 'chinese' })
  origin!: string;

  @Column({ type: 'varchar', length: 50, default: 'subbed' })
  language!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  rating!: string | null;

  @Column({ name: 'episode_count', type: 'int', default: 0 })
  episodeCount!: number;

  @Column({ name: 'year_of_release', type: 'varchar', length: 10, nullable: true })
  yearOfRelease!: string | null;

  @Column({ name: 'subtitle_contains', type: 'text', nullable: true })
  subtitleContains!: string | null;

  @Column({ name: 'small_poster', type: 'varchar', length: 500, nullable: true })
  smallPoster!: string | null;

  @Column({ name: 'large_poster', type: 'varchar', length: 500, nullable: true })
  largePoster!: string | null;

  @Column({ name: 'hidden_remark', type: 'text', nullable: true })
  hiddenRemark!: string | null;

  @Column({ name: 'collection_source', type: 'varchar', length: 500, nullable: true })
  collectionSource!: string | null;

  @Column({ name: 'daily_watch_count', type: 'int', default: 0 })
  dailyWatchCount!: number;

  @Column({ name: 'weekly_watch_count', type: 'int', default: 0 })
  weeklyWatchCount!: number;

  @Column({ name: 'monthly_watch_count', type: 'int', default: 0 })
  monthlyWatchCount!: number;

  @Column({ name: 'all_time_watch_count', type: 'bigint', default: 0 })
  allTimeWatchCount!: number;

  @Column({ name: 'search_select_count', type: 'int', default: 0 })
  searchSelectCount!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToMany(() => CdGenre, (g) => g.dramas)
  @JoinTable({
    name: 'drama_genres',
    joinColumn: { name: 'drama_sno', referencedColumnName: 'sno' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
  })
  genres!: CdGenre[];
}
