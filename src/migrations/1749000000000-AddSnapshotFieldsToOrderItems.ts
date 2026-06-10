import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSnapshotFieldsToOrderItems1749000000000
  implements MigrationInterface
{
  name = 'AddSnapshotFieldsToOrderItems1749000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "productTitle" varchar(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "productImage" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "productSku" varchar(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "productColor" varchar(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "productCategoryName" varchar(150)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN IF EXISTS "productCategoryName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN IF EXISTS "productColor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN IF EXISTS "productSku"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN IF EXISTS "productImage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN IF EXISTS "productTitle"`,
    );
  }
}
