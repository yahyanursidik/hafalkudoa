export type HealthDatabase = {
  query: (query: string) => Promise<unknown>;
};

export type DatabaseStatus = "ok" | "unavailable" | "not-configured";

export type HealthResponse = {
  statusCode: 200;
  body: {
    status: "ok";
    content: "ok";
    items: number;
    generatedAt: string;
    database: DatabaseStatus;
  };
};

export type HealthInput = {
  /** Absent when DATABASE_URL is not set. Reads never need it. */
  database?: HealthDatabase;
  items: number;
  generatedAt: string;
};

/**
 * Reads are served from the bundle shipped with the deployment, so the app is
 * healthy whenever that content loads. The database is reported because the
 * authoring pipeline needs it, but it cannot take the site down.
 */
export async function checkHealth(input: HealthInput): Promise<HealthResponse> {
  let database: DatabaseStatus = "not-configured";

  if (input.database) {
    try {
      await input.database.query("SELECT 1");
      database = "ok";
    } catch {
      database = "unavailable";
    }
  }

  return {
    statusCode: 200,
    body: { status: "ok", content: "ok", items: input.items, generatedAt: input.generatedAt, database },
  };
}
