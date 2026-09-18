import type { VercelRequest } from "@vercel/node";

export function requestId(request: VercelRequest): string {
  const header = request.headers["x-request-id"];
  return typeof header === "string" && header.length > 0 ? header : crypto.randomUUID();
}
