export type HealthDatabase = {
  query: (query: string) => Promise<unknown>;
};

export type HealthResponse = {
  statusCode: 200 | 503;
  body:
    | { status: "ok"; database: "ok" }
    | { status: "error"; database: "unavailable" };
};

export async function checkHealth(database: HealthDatabase): Promise<HealthResponse> {
  try {
    await database.query("SELECT 1");
    return { statusCode: 200, body: { status: "ok", database: "ok" } };
  } catch {
    return { statusCode: 503, body: { status: "error", database: "unavailable" } };
  }
}
