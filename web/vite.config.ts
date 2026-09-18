import { resolve } from "node:path";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function localApiPlugin(): Plugin {
  return {
    name: "local-dua-api",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = new URL(request.url ?? "/", "http://localhost");
        const path = requestUrl.pathname;
        if (!path.startsWith("/api/")) {
          next();
          return;
        }

        const staticRoutes: Record<string, string> = {
          "/api/v1/health": "api/v1/health.ts",
          "/api/v1/dua": "api/v1/dua/index.ts",
          "/api/v1/dua/groups": "api/v1/dua/groups.ts",
          "/api/v1/dua/tags": "api/v1/dua/tags.ts",
          "/api/v1/dua/chapters": "api/v1/dua/chapters.ts",
        };
        const staticHandler = staticRoutes[path.replace(/\/$/, "")];
        const match = staticHandler ? null : path.match(/^\/api\/v1\/dua\/([^/]+)$/);
        if (!staticHandler && !match) {
          response.statusCode = 404;
          response.setHeader("Content-Type", "application/json; charset=utf-8");
          response.end(JSON.stringify({ error: { code: "NOT_FOUND", message: "Unknown API route.", requestId: "local" } }));
          return;
        }

        const handlerFile: string = staticHandler ?? "api/v1/dua/[id].ts";
        const handlerModule = await server.ssrLoadModule(resolve(process.cwd(), handlerFile));
        const localRequest = Object.assign(request, {
          query: {
            ...Object.fromEntries(requestUrl.searchParams),
            ...(match ? { id: decodeURIComponent(match[1] ?? "") } : {}),
          },
        });
        const localResponse = Object.assign(response, {
          json(body: unknown) {
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify(body));
            return localResponse;
          },
          status(statusCode: number) {
            response.statusCode = statusCode;
            return localResponse;
          },
        });

        await handlerModule.default(localRequest as VercelRequest, localResponse as VercelResponse);
      });
    },
  };
}

export default defineConfig(({ command, mode }) => {
  if (command === "serve") {
    const localEnvironment = loadEnv(mode, process.cwd(), "");
    Object.entries(localEnvironment).forEach(([key, value]) => {
      process.env[key] ??= value;
    });
  }

  return {
    root: "web",
    plugins: [react(), localApiPlugin()],
    build: {
      outDir: "../dist/web",
      emptyOutDir: true,
    },
  };
});
