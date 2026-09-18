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
        const match = path.match(/^\/api\/v1\/dua(?:\/([^/]+))?$/);
        if (!match) {
          next();
          return;
        }

        const handlerFile = match[1] ? "api/v1/dua/[id].ts" : "api/v1/dua/index.ts";
        const handlerModule = await server.ssrLoadModule(resolve(process.cwd(), handlerFile));
        const localRequest = Object.assign(request, {
          query: {
            ...Object.fromEntries(requestUrl.searchParams),
            ...(match[1] ? { id: decodeURIComponent(match[1]) } : {}),
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
