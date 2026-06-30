import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'app_feedback' })
export class AppFeedbackEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'text', nullable: true, name: 'problem_types' })
  problemTypes: string | null = null;

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'device_model' })
  deviceModel: string | null = null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'app_version' })
  appVersion: string | null = null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'android_version' })
  androidVersion: string | null = null;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
