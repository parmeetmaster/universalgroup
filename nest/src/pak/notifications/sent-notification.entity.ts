import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('pak_sent_notifications')
@Index(['episodeId'], { unique: true })
export class PakSentNotification {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'episode_id', type: 'bigint' })
  episodeId!: string;

  @Column({ name: 'drama_id', type: 'bigint' })
  dramaId!: string;

  @Column({ name: 'drama_title', type: 'varchar', length: 255 })
  dramaTitle!: string;

  @Column({ name: 'drama_slug', type: 'varchar', length: 255 })
  dramaSlug!: string;

  @Column({ name: 'episode_number', type: 'int' })
  episodeNumber!: number;

  @Column({ name: 'topic', type: 'varchar', length: 255 })
  topic!: string;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt!: Date;
}
