import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'seen_episodes' })
export class SeenEpisodeEntity {
  @PrimaryColumn({ type: 'varchar', length: 512 })
  url!: string;

  @Column({ type: 'datetime', name: 'first_seen_at', default: () => 'CURRENT_TIMESTAMP' })
  firstSeenAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
