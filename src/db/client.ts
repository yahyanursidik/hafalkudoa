import { neon } from "@neondatabase/serverless";

import { getEnvironment } from "../config/env.js";

export type DatabaseClient = ReturnType<typeof neon>;

let databaseClient: DatabaseClient | undefined;

export function getDatabase(): DatabaseClient {
  if (!databaseClient) {
    databaseClient = neon(getEnvironment().DATABASE_URL);
  }

  return databaseClient;
}

export function resetDatabaseForTests(): void {
  databaseClient = undefined;
}
