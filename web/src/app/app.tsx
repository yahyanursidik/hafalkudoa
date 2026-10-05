import { lazy, Suspense, type ReactNode } from "react";
import { Refine } from "@refinedev/core";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/app-shell.js";
import { HomePage } from "../components/home-page.js";
import { ProgressProvider } from "../components/progress-provider.js";
import { appRoutes } from "./routes.js";

const resources = appRoutes.map((route) => ({
  name: route.key,
  meta: { label: route.label, path: route.path },
}));

const DuaCatalogPage = lazy(async () => ({ default: (await import("../components/dua-catalog-page.js")).DuaCatalogPage }));
const DuaDetailPage = lazy(async () => ({ default: (await import("../components/dua-detail-page.js")).DuaDetailPage }));
const ChildLearningPage = lazy(async () => ({ default: (await import("../components/child-learning-page.js")).ChildLearningPage }));
const MemorizeSessionPage = lazy(async () => ({ default: (await import("../components/memorize-session-page.js")).MemorizeSessionPage }));
const ReviewPage = lazy(async () => ({ default: (await import("../components/review-page.js")).ReviewPage }));
const CompanionPage = lazy(async () => ({ default: (await import("../components/companion-page.js")).CompanionPage }));

function Loading({ children, label }: { readonly children: ReactNode; readonly label: string }) {
  return <Suspense fallback={<p className="dua-status" role="status">{label}</p>}>{children}</Suspense>;
}

export function App() {
  return (
    <ProgressProvider>
      <Refine resources={resources} options={{ disableTelemetry: true }}>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/hafalan" element={<Loading label="Menyiapkan jalur hafalan…"><ChildLearningPage /></Loading>} />
              <Route path="/hafalan/:id" element={<Loading label="Menyiapkan latihan…"><MemorizeSessionPage /></Loading>} />
              <Route path="/murajaah" element={<Loading label="Menyiapkan ulangan…"><ReviewPage /></Loading>} />
              <Route path="/doa" element={<Loading label="Memuat daftar doa…"><DuaCatalogPage /></Loading>} />
              <Route path="/doa/:id" element={<Loading label="Memuat doa…"><DuaDetailPage /></Loading>} />
              <Route path="/saya" element={<Loading label="Memuat ruang pendamping…"><CompanionPage /></Loading>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </Refine>
    </ProgressProvider>
  );
}
