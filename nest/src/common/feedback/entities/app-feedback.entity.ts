import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Cross-app feedback / issue report. Shared by every app in the suite — the
 * originating app is identified by the X-App-Name request header. Any field an
 * app sends that is not a known column is preserved in the flexible `extra` JSON
 * column, so different apps can submit different shapes without breaking the API.
 */
@Entity('app_feedback')
export class AppFeedbackEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ length: 100, default: 'unknown' })
  appName: string;

  @Column({ length: 50, default: 'issue' })
  type: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  appVersion: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  platform: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceInfo: string | null;

  // Anything the app sends beyond the known columns lands here — keeps the schema
  // flexible across apps so a missing/extra field never crashes the endpoint.
  @Column({ type: 'json', nullable: true })
  extra: Record<string, unknown> | null;

  @Index()
  @Column({ length: 20, default: 'open' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
