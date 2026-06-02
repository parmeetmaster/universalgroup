import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum ProxyProtocol {
  HTTP = 'http',
  HTTPS = 'https',
  SOCKS4 = 'socks4',
  SOCKS5 = 'socks5',
}

export enum ProxyStatus {
  ACTIVE = 'active',
  DEAD = 'dead',
  UNCHECKED = 'unchecked',
}

export enum ProxyAnonymity {
  TRANSPARENT = 'transparent',
  ANONYMOUS = 'anonymous',
  ELITE = 'elite',
}

@Entity('proxies')
@Unique(['ip', 'port'])
@Index(['status'])
@Index(['protocol'])
@Index(['speed'])
@Index(['failCount'])
export class ProxyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 45 })
  ip: string;

  @Column({ type: 'int' })
  port: number;

  @Column({ type: 'enum', enum: ProxyProtocol, default: ProxyProtocol.HTTP })
  protocol: ProxyProtocol;

  @Column({ type: 'varchar', length: 2, nullable: true })
  country: string | null;

  @Column({ type: 'int', nullable: true, comment: 'Response time in ms' })
  speed: number | null;

  @Column({ type: 'enum', enum: ProxyAnonymity, default: ProxyAnonymity.ANONYMOUS })
  anonymity: ProxyAnonymity;

  @Column({ type: 'enum', enum: ProxyStatus, default: ProxyStatus.UNCHECKED })
  status: ProxyStatus;

  @Column({ type: 'int', default: 0 })
  failCount: number;

  @Column({ type: 'int', default: 0 })
  successCount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string | null;

  @Column({ type: 'datetime', nullable: true })
  lastCheckedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
