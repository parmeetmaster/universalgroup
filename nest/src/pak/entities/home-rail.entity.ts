import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RailTypeEnum } from './enums';
import { Genre } from './genre.entity';
import { HomeRailItem } from './home-rail-item.entity';

@Entity('home_rails')
export class HomeRail {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  title!: string;

  @Column({
    name: 'rail_type',
    type: 'enum',
    enum: RailTypeEnum,
    default: RailTypeEnum.CUSTOM,
  })
  railType!: RailTypeEnum;

  @Column({ name: 'genre_id', type: 'bigint', nullable: true })
  genreId!: string | null;

  @ManyToOne(() => Genre, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'genre_id' })
  genre!: Genre | null;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => HomeRailItem, (i) => i.rail, { cascade: true })
  items!: HomeRailItem[];
}
