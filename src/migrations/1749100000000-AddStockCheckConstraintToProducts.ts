import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStockCheckConstraintToProducts1749100000000 implements MigrationInterface {
  name = 'AddStockCheckConstraintToProducts1749100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "CHK_products_stock_non_negative" CHECK ("stock" >= 0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "CHK_products_stock_non_negative"`,
    );
  }
}
