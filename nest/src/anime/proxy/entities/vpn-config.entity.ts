import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum VpnProtocol {
  VMESS = 'vmess',
  VLESS = 'vless',
  TROJAN = 'trojan',
  SHADOWSOCKS = 'shadowsocks',
}

export enum VpnConfigStatus {
  ACTIVE = 'active',
  DEAD = 'dead',
  UNCHECKED = 'unchecked',
}

@Entity('vpn_configs')
@Index(['status'])
export class VpnConfigEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Full config URI (may contain emoji in the #remark fragment), so it is
  // utf8mb4 text. A unique index on the full URI is impractical (exceeds the
  // InnoDB key-length limit and triggers collation issues), so dedup is done
  // via uriHash below.
  @Column({ type: 'text', charset: 'utf8mb4', collation: 'utf8mb4_unicode_ci' })
  uri: string;

  // SHA-256 hex of the URI — ASCII, short, safe to index/compare.
  @Column({ type: 'varchar', length: 64, unique: true, charset: 'utf8mb4', collation: 'utf8mb4_unicode_ci' })
  uriHash: string;

  @Column({ type: 'enum', enum: VpnProtocol })
  protocol: VpnProtocol;

  @Column({ type: 'varchar', length: 255 })
  host: string;

  @Column({ type: 'int' })
  port: number;

  @Column({ type: 'varchar', length: 255, charset: 'utf8mb4', collation: 'utf8mb4_unicode_ci', nullable: true })
  remark: string | null;

  @Column({ type: 'text', comment: 'Pre-built Xray outbound JSON (no tag field)' })
  outboundJson: string;

  @Column({ type: 'enum', enum: VpnConfigStatus, default: VpnConfigStatus.UNCHECKED })
  status: VpnConfigStatus;

  @Column({ type: 'int', nullable: true, comment: 'Connect time in ms' })
  speed: number | null;

  @Column({ type: 'int', default: 0 })
  failCount: number;

  @Column({ type: 'int', default: 0 })
  successCount: number;

  @Column({ type: 'datetime', nullable: true })
  lastCheckedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
