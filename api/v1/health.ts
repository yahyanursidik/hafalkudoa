import type { VercelRequest, VercelResponse } from "@vercel/node";

import { checkHealth } from "../../src/api/health.js";
import { requestId } from "../../src/api/request.js";
import { getDatabase } from "../../src/db/client.js";
import { AppError, toErrorResponse } from "../../src/lib/errors.js";
import { logger } from "../../src/lib/logger.js";

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  const id = requestId(request);

  try {
    if (request.method !== "GET") {
      throw new AppError(405, "METHOD_NOT_ALLOWED", "Only GET is allowed.");
    }

    const result = await checkHealth({
      query: (query) => getDatabase().query(query),
    });
    logger.info("health_check", { requestId: id, statusCode: result.statusCode });
    response.status(result.statusCode).json(result.body);
  } catch (error) {
    const formatted = toErrorResponse(error, id);
    logger.error("health_check_failed", { requestId: id, statusCode: formatted.statusCode });
    response.status(formatted.statusCode).json(formatted.body);
  }
}
