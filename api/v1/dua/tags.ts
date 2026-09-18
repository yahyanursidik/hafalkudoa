import type { VercelRequest, VercelResponse } from "@vercel/node";

import { listActiveTags } from "../../../src/api/dua.js";
import { requestId } from "../../../src/api/request.js";
import { getDatabase } from "../../../src/db/client.js";
import { AppError, toErrorResponse } from "../../../src/lib/errors.js";
import { logger } from "../../../src/lib/logger.js";

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  const id = requestId(request);
  try {
    if (request.method !== "GET") {
      throw new AppError(405, "METHOD_NOT_ALLOWED", "Only GET is allowed.");
    }
    response.status(200).json(await listActiveTags(getDatabase()));
  } catch (error) {
    const formatted = toErrorResponse(error, id);
    logger.error("dua_tags_failed", { requestId: id, statusCode: formatted.statusCode });
    response.status(formatted.statusCode).json(formatted.body);
  }
}
