import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductImagesTable1748800000000
  implements MigrationInterface
{
  name = 'CreateProductImagesTable1748800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "product_image_type_enum" AS ENUM ('GALLERY', 'DIAGRAM');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_images" (
        "id"          uuid                        NOT NULL DEFAULT gen_random_uuid(),
        "productId"   uuid                        NOT NULL,
        "imageUrl"    text                        NOT NULL,
        "imageType"   "product_image_type_enum"   NOT NULL,
        "sortOrder"   integer                     NOT NULL DEFAULT 0,
        "createdAt"   TIMESTAMP                   NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP                   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_images" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_images_product"
          FOREIGN KEY ("productId")
          REFERENCES "products"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_images_productId" ON "product_images" ("productId")`,
    );

    // Migrate existing imageUrls array → individual product_images rows (only if imageUrls column still exists)
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'imageUrls'
        ) THEN
          INSERT INTO product_images ("id", "productId", "imageUrl", "imageType", "sortOrder", "createdAt", "updatedAt")
          SELECT
            gen_random_uuid(),
            p.id,
            img.url,
            'GALLERY'::"product_image_type_enum",
            (img.ord - 1)::int,
            NOW(),
            NOW()
          FROM products p
          CROSS JOIN LATERAL unnest(p."imageUrls") WITH ORDINALITY AS img(url, ord)
          WHERE p."deletedAt" IS NULL
            AND array_length(p."imageUrls", 1) > 0;
        END IF;
      END $$
    `);

    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "imageUrls"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN "imageUrls" text[] NOT NULL DEFAULT '{}'`,
    );

    await queryRunner.query(`
      UPDATE products p
      SET "imageUrls" = sub.urls
      FROM (
        SELECT "productId", array_agg("imageUrl" ORDER BY "sortOrder") AS urls
        FROM product_images
        GROUP BY "productId"
      ) sub
      WHERE p.id = sub."productId"
    `);

    await queryRunner.query(`DROP TABLE "product_images"`);

    await queryRunner.query(`DROP TYPE "product_image_type_enum"`);
  }
}
