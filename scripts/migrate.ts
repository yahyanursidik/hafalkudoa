import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getDatabase } from "../src/db/client.js";
import { logger } from "../src/lib/logger.js";

const migrationsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../migrations");

function splitStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

async function main(): Promise<void> {
  const database = getDatabase();
  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  await database.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())",
  );

  for (const file of migrationFiles) {
    const alreadyApplied = await database.query("SELECT 1 FROM schema_migrations WHERE id = $1", [file]);
    if (Array.isArray(alreadyApplied) && alreadyApplied.length > 0) {
      continue;
    }

    const sql = await readFile(path.join(migrationsDirectory, file), "utf8");
    for (const statement of splitStatements(sql)) {
      await database.query(statement);
    }
    await database.query("INSERT INTO schema_migrations (id) VALUES ($1)", [file]);
    logger.info("migration_applied", { migration: file });
  }
}

main().catch((error: unknown) => {
  logger.error("migration_failed", { error: error instanceof Error ? error.message : "unknown error" });
  process.exitCode = 1;
});
