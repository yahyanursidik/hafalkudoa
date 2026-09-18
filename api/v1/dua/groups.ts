import type { VercelRequest, VercelResponse } from "@vercel/node";

import { listActiveGroups } from "../../../src/api/dua.js";
import { requestId } from "../../../src/api/request.js";
import { getDatabase } from "../../../src/db/client.js";
import { AppError, describeError, toErrorResponse } from "../../../src/lib/errors.js";
import { logger } from "../../../src/lib/logger.js";

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  const id = requestId(request);
  try {
    if (request.method !== "GET") {
      throw new AppError(405, "METHOD_NOT_ALLOWED", "Only GET is allowed.");
    }
    response.status(200).json(await listActiveGroups(getDatabase()));
  } catch (error) {
    const formatted = toErrorResponse(error, id);
    logger.error("dua_groups_failed", { requestId: id, statusCode: formatted.statusCode, error: describeError(error) });
    response.status(formatted.statusCode).json(formatted.body);
  }
}
