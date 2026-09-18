import type { AppRoute } from "../app/routes.js";
import { Brand } from "./brand.js";

export function RoutePlaceholder({ route }: { readonly route: AppRoute }) {
  return (
    <section className="route-intro" aria-labelledby={`${route.key}-title`}>
      <Brand className="route-brand" />
      <p className="route-context">Hafalku Doa</p>
      <h1 id={`${route.key}-title`}>{route.title}</h1>
      <p>{route.summary}</p>
    </section>
  );
}
