import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'blocked_countries' })
export class BlockedCountryEntity {
  @PrimaryColumn({ type: 'char', length: 2 })
  code!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
