import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getActiveDua } from "../../../src/api/dua.js";
import { requestId } from "../../../src/api/request.js";
import { getDatabase } from "../../../src/db/client.js";
import { AppError, describeError, toErrorResponse } from "../../../src/lib/errors.js";
import { logger } from "../../../src/lib/logger.js";

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  const requestIdentifier = requestId(request);
  try {
    if (request.method !== "GET") {
      throw new AppError(405, "METHOD_NOT_ALLOWED", "Only GET is allowed.");
    }
    const param = request.query.id;
    if (typeof param !== "string" || param.length === 0) {
      throw new AppError(400, "BAD_REQUEST", "A doa id is required.");
    }
    response.status(200).json(await getActiveDua(getDatabase(), param));
  } catch (error) {
    const formatted = toErrorResponse(error, requestIdentifier);
    logger.error("dua_detail_failed", { requestId: requestIdentifier, statusCode: formatted.statusCode, error: describeError(error) });
    response.status(formatted.statusCode).json(formatted.body);
  }
}
