import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'device_tokens' })
export class DeviceTokenEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 512, name: 'fcm_token' })
  fcmToken!: string;

  @Column({ type: 'char', length: 2, nullable: true })
  country: string | null = null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'app_version' })
  appVersion: string | null = null;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'device_model' })
  deviceModel: string | null = null;

  @Column({ type: 'enum', enum: ['active', 'uninstalled'], default: 'active' })
  status!: 'active' | 'uninstalled';

  @Column({ type: 'int', name: 'ping_failures', default: 0 })
  pingFailures!: number;

  @CreateDateColumn({ name: 'registered_at' })
  registeredAt!: Date;

  @Column({ type: 'datetime', nullable: true, name: 'last_active_at' })
  lastActiveAt: Date | null = null;

  @Column({ type: 'datetime', nullable: true, name: 'uninstalled_at' })
  uninstalledAt: Date | null = null;
}
