import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'registered_countries' })
export class RegisteredCountryEntity {
  @PrimaryColumn({ type: 'char', length: 2 })
  code!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
