import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'kv_entries' })
export class KvEntryEntity {
  @PrimaryColumn({ type: 'varchar', length: 128 })
  key!: string;

  @Column({ type: 'json' })
  value!: unknown;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
