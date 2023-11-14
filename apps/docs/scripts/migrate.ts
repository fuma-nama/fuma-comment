import { resolve } from "node:path";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { config } from "dotenv";
import { Migrator, FileMigrationProvider } from "kysely";

config({ path: resolve(".env.local") });

export async function migrate(): Promise<void> {
  const { db } = await import("../utils/database");

  /* {@link https://github.com/vercel/storage/issues/325} */
  Object.defineProperty(
    db.getExecutor().adapter,
    "supportsTransactionalDdl",
    () => false
  );

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      // This needs to be an absolute path.
      migrationFolder: path.resolve("migrations"),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("failed to migrate");
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

void migrate();
