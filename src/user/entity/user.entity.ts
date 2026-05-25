import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum';

// backward-compat alias so existing imports of UserRole still compile
export { Role as UserRole };

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ nullable: true, select: false })
  password!: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role!: Role;

  @Column({ nullable: true })
  googleId!: string;

  @Column({ nullable: true })
  picture!: string;

  @Column({ default: 'local' })
  provider!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
