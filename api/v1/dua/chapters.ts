import type { VercelRequest, VercelResponse } from "@vercel/node";

import { requestId } from "../../../src/api/request.js";
import { catalogueChapters } from "../../../src/content/catalogue.js";
import { AppError, describeError, toErrorResponse } from "../../../src/lib/errors.js";
import { logger } from "../../../src/lib/logger.js";

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  const id = requestId(request);
  try {
    if (request.method !== "GET") {
      throw new AppError(405, "METHOD_NOT_ALLOWED", "Only GET is allowed.");
    }
    response.status(200).json(catalogueChapters());
  } catch (error) {
    const formatted = toErrorResponse(error, id);
    logger.error("dua_chapters_failed", { requestId: id, statusCode: formatted.statusCode, error: describeError(error) });
    response.status(formatted.statusCode).json(formatted.body);
  }
}
