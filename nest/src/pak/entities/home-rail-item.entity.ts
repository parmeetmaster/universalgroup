import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { HomeRail } from './home-rail.entity';
import { Drama } from './drama.entity';

@Entity('home_rail_items')
export class HomeRailItem {
  @PrimaryColumn({ name: 'rail_id', type: 'bigint' })
  railId!: string;

  @PrimaryColumn({ name: 'drama_id', type: 'bigint' })
  dramaId!: string;

  @ManyToOne(() => HomeRail, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rail_id' })
  rail!: HomeRail;

  @ManyToOne(() => Drama, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drama_id' })
  drama!: Drama;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;
}
