import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'device_grace' })
export class DeviceGraceEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, name: 'device_id' })
  deviceId!: string;

  @Column({ type: 'datetime', name: 'first_seen_at' })
  firstSeenAt!: Date;

  @Column({ type: 'char', length: 2, nullable: true })
  country: string | null = null;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'device_model' })
  deviceModel: string | null = null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'app_version' })
  appVersion: string | null = null;
}
