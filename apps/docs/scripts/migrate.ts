import { resolve } from "node:path";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { config } from "dotenv";
import type { MigrationResultSet } from "kysely";
import { Migrator, FileMigrationProvider } from "kysely";
import { z } from "zod";

config({ path: resolve(".env.local") });

const targetSchema = z.string().default("latest");

export async function migrate(): Promise<void> {
  const { db } = await import("../utils/database");

  /* {@link https://github.com/vercel/storage/issues/325} */
  Object.defineProperty(
    db.getExecutor().adapter,
    "supportsTransactionalDdl",
    () => false
  );

  const target = targetSchema.parse(process.argv.slice(2)[0]);
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      // This needs to be an absolute path.
      migrationFolder: path.resolve("migrations"),
    }),
  });

  console.log(`Migrating to ${target}`);

  let result: MigrationResultSet;

  switch (target) {
    case "latest":
      result = await migrator.migrateToLatest();
      break;
    case "up":
      result = await migrator.migrateUp();
      break;
    case "down":
      result = await migrator.migrateDown();
      break;
    default:
      result = await migrator.migrateTo(target);
      break;
  }

  const { error, results } = result;

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
