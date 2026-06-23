import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateForgotPasswordsTable1749200000000 implements MigrationInterface {
  name = 'CreateForgotPasswordsTable1749200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "forgot_passwords" (
        "id"          uuid        NOT NULL DEFAULT gen_random_uuid(),
        "userId"      uuid        NOT NULL,
        "tokenHash"   varchar     NOT NULL,
        "expiresAt"   TIMESTAMP   NOT NULL,
        "createdAt"   TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_forgot_passwords" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_forgot_passwords_tokenHash" UNIQUE ("tokenHash"),
        CONSTRAINT "FK_forgot_passwords_user"
          FOREIGN KEY ("userId")
          REFERENCES "users"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_forgot_passwords_tokenHash" ON "forgot_passwords" ("tokenHash")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "forgot_passwords"`);
  }
}
