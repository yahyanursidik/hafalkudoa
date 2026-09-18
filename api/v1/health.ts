import type { VercelRequest, VercelResponse } from "@vercel/node";

import { checkHealth } from "../../src/api/health.js";
import { requestId } from "../../src/api/request.js";
import { catalogueGeneratedAt, listCatalogue } from "../../src/content/catalogue.js";
import { getDatabase } from "../../src/db/client.js";
import { AppError, describeError, toErrorResponse } from "../../src/lib/errors.js";
import { logger } from "../../src/lib/logger.js";

/** Absent DATABASE_URL is reported, not thrown: reads do not need a database. */
function optionalDatabase(): { query: (query: string) => Promise<unknown> } | undefined {
  try {
    const database = getDatabase();
    return { query: (query: string) => database.query(query) };
  } catch {
    return undefined;
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  const id = requestId(request);

  try {
    if (request.method !== "GET") {
      throw new AppError(405, "METHOD_NOT_ALLOWED", "Only GET is allowed.");
    }

    const result = await checkHealth({
      database: optionalDatabase(),
      items: listCatalogue().length,
      generatedAt: catalogueGeneratedAt(),
    });
    logger.info("health_check", { requestId: id, statusCode: result.statusCode, database: result.body.database });
    response.status(result.statusCode).json(result.body);
  } catch (error) {
    const formatted = toErrorResponse(error, id);
    logger.error("health_check_failed", { requestId: id, statusCode: formatted.statusCode, error: describeError(error) });
    response.status(formatted.statusCode).json(formatted.body);
  }
}
