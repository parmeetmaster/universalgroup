import {
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('app_config')
export class AviationAppConfig {
  @PrimaryColumn({ name: 'key', type: 'varchar', length: 64 })
  key!: string;

  @Column({ name: 'value', type: 'json' })
  value!: unknown;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
