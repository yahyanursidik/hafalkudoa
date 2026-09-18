import { lazy, Suspense } from "react";
import { Refine } from "@refinedev/core";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/app-shell.js";
import { HomePage } from "../components/home-page.js";
import { RoutePlaceholder } from "../components/route-placeholder.js";
import { appRoutes, type AppRoute } from "./routes.js";

const resources = appRoutes.map((route) => ({
  name: route.key,
  meta: { label: route.label, path: route.path },
}));

const DuaCatalogPage = lazy(async () => ({ default: (await import("../components/dua-catalog-page.js")).DuaCatalogPage }));
const DuaDetailPage = lazy(async () => ({ default: (await import("../components/dua-detail-page.js")).DuaDetailPage }));
const ChildLearningPage = lazy(async () => ({ default: (await import("../components/child-learning-page.js")).ChildLearningPage }));

const homeRoute = appRoutes.find((route) => route.key === "home");
const memorizeRoute = appRoutes.find((route) => route.key === "memorize");
const duaRoute = appRoutes.find((route) => route.key === "dua");
const secondaryRoutes = appRoutes.filter((route) => route.key !== "home" && route.key !== "memorize" && route.key !== "dua");

function isHomeRoute(route: AppRoute | undefined): route is AppRoute {
  return route?.key === "home";
}

function isDuaRoute(route: AppRoute | undefined): route is AppRoute {
  return route?.key === "dua";
}

function isMemorizeRoute(route: AppRoute | undefined): route is AppRoute {
  return route?.key === "memorize";
}

export function App() {
  return (
    <Refine resources={resources} options={{ disableTelemetry: true }}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            {isHomeRoute(homeRoute) && <Route path={homeRoute.path} element={<HomePage />} />}
            {isMemorizeRoute(memorizeRoute) && (
              <Route
                path={memorizeRoute.path}
                element={<Suspense fallback={<p className="dua-status" role="status">Menyiapkan jalur hafalan…</p>}><ChildLearningPage /></Suspense>}
              />
            )}
            {isDuaRoute(duaRoute) && (
              <Route
                path={duaRoute.path}
                element={<Suspense fallback={<p className="dua-status" role="status">Memuat daftar doa…</p>}><DuaCatalogPage /></Suspense>}
              />
            )}
            {isDuaRoute(duaRoute) && (
              <Route
                path={`${duaRoute.path}/:id`}
                element={<Suspense fallback={<p className="dua-status" role="status">Memuat doa…</p>}><DuaDetailPage /></Suspense>}
              />
            )}
            {secondaryRoutes.map((route) => (
              <Route key={route.key} path={route.path} element={<RoutePlaceholder route={route} />} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Refine>
  );
}
