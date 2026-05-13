import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'error_reports' })
export class ErrorReportEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'device_name' })
  deviceName: string | null = null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'app_version' })
  appVersion: string | null = null;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'error_title' })
  errorTitle: string | null = null;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string | null = null;

  @Column({ type: 'text', nullable: true, name: 'download_url' })
  downloadUrl: string | null = null;

  @Column({ type: 'text', nullable: true, name: 'additional_info' })
  additionalInfo: string | null = null;

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'open' })
  status!: string;

  @Column({ type: 'text', nullable: true, name: 'admin_notes' })
  adminNotes: string | null = null;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
