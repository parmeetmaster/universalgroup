import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('UserLoginCredentials')
export class UserCredentialsEntity {
  @PrimaryGeneratedColumn()
  sno: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 100, nullable: true })
  password: string;

  @Column({ type: 'text' })
  password_salt: string;

  @Column({ length: 100 })
  role: string;

  @Column({ name: 'is_banned', type: 'tinyint', default: 0 })
  isBanned: number;
}
