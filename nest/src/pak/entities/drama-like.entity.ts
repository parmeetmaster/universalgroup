import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Drama } from './drama.entity';

@Entity('drama_likes')
@Index(['dramaId', 'deviceId'], { unique: true })
export class DramaLike {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'drama_id', type: 'bigint' })
  dramaId!: string;

  @ManyToOne(() => Drama, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drama_id' })
  drama!: Drama;

  @Column({ name: 'device_id', type: 'varchar', length: 64 })
  deviceId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
