import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('site_visits')
@Index('uq_domain_date', ['domain', 'visitDate'], { unique: true })
export class SiteVisitEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  @Index()
  domain: string;

  @Column({ name: 'visit_count', default: 0 })
  visitCount: number;

  @Column({ name: 'unique_devices', default: 0 })
  uniqueDevices: number;

  @Column({ type: 'date', name: 'visit_date' })
  @Index()
  visitDate: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
