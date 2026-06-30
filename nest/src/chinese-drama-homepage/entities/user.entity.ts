import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cd_users')
export class CdUser {
  @PrimaryColumn({ length: 128 })
  uid: string;

  @Column({ length: 255, default: '' })
  name: string;

  @Column({ length: 255, default: '' })
  email: string;

  @Column({ type: 'text', nullable: true })
  avatar: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fcmToken: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  deviceId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastLoginAt: Date;
}
