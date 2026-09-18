import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { appRoutes, type RouteKey } from "../app/routes.js";
import { Brand } from "./brand.js";
import { LearningFocusContext } from "./learning-focus.js";

function NavigationMark({ route }: { readonly route: RouteKey }) {
  const paths: Record<RouteKey, string> = {
    home: "M4 11.5 12 5l8 6.5v7a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1v-7Z",
    memorize: "M6 4.5h12A1.5 1.5 0 0 1 19.5 6v13.5H6A1.5 1.5 0 0 0 4.5 21V6A1.5 1.5 0 0 1 6 4.5Zm0 0V19.5",
    review: "M18.5 8.5A7 7 0 1 0 19 14m-.5-5.5V4m0 4.5H14",
    dua: "M7 3.5h10A2.5 2.5 0 0 1 19.5 6v12A2.5 2.5 0 0 1 17 20.5H7A2.5 2.5 0 0 1 4.5 18V6A2.5 2.5 0 0 1 7 3.5Zm2.5 5h5m-5 3h5m-5 3H13",
    profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8.5c.8-3.3 3.3-5 7-5s6.2 1.7 7 5",
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d={paths[route]} />
    </svg>
  );
}

export function AppShell() {
  const [isFocusMode, setFocusMode] = useState(false);

  return (
    <LearningFocusContext.Provider value={{ isFocusMode, setFocusMode }}>
      <div className={`app-frame${isFocusMode ? " is-learning-focus" : ""}`}>
        <header className="app-header">
          <NavLink className="wordmark" to="/" aria-label="Hafalku Doa, kembali ke beranda">
            <Brand />
          </NavLink>
          <p className="shell-context">Hari ini</p>
        </header>

        <main className="app-main" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>

        <nav className="bottom-navigation" aria-label="Navigasi utama">
          {appRoutes.map((route) => (
            <NavLink
              className={({ isActive }) => `navigation-link${isActive ? " is-active" : ""}`}
              key={route.key}
              to={route.path}
              end={route.path === "/"}
            >
              <NavigationMark route={route.key} />
              <span>{route.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </LearningFocusContext.Provider>
  );
}
