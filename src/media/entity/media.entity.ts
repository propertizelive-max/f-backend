import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  originalName!: string;

  @Column({ type: 'varchar' })
  mimeType!: string;

  @Column({ type: 'bigint' })
  size!: number;

  @Column({ type: 'varchar' })
  storageKey!: string;

  @Column({ type: 'varchar' })
  url!: string;

  @Column({ type: 'varchar', default: 'local' })
  storageType!: string;

  @Column({ type: 'uuid', nullable: true })
  uploadedById!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
