import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageUrlsToProducts1748304000000 implements MigrationInterface {
  name = 'AddImageUrlsToProducts1748304000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "imageUrls" text[] NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "imageUrls"`);
  }
}
