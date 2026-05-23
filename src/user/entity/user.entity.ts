import {
              Entity,
              PrimaryGeneratedColumn,
              Column,
              CreateDateColumn,
} from 'typeorm';

export enum UserRole {
              USER = 'user',
              ADMIN = 'admin',
}

@Entity('users')
export class User {

              @PrimaryGeneratedColumn('uuid')
              id!: string;

              @Column({
                            type: 'varchar',
                            length: 100,
              })
              name!: string;

              @Column({
                            type: 'varchar',
                            unique: true,
              })
              email!: string;

              @Column({
                            select: false,
              })
              password!: string;

              @Column({
                            type: 'enum',
                            enum: UserRole,
                            default: UserRole.USER,
              })
              role!: UserRole;

              @CreateDateColumn()
              createdAt!: Date;
}