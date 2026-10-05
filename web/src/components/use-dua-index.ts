import { useEffect, useState } from "react";
import { fetchActiveDuaList, type PublicDuaListItem } from "../content/dua-api.js";

export type DuaIndexState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly byId: ReadonlyMap<string, PublicDuaListItem>; readonly items: PublicDuaListItem[] }
  | { readonly status: "error" };

/** The catalogue is one cached file, so every page can ask for it freely. */
export function useDuaIndex(): DuaIndexState {
  const [state, setState] = useState<DuaIndexState>({ status: "loading" });

  useEffect(() => {
    let current = true;
    void fetchActiveDuaList()
      .then((items) => {
        if (current) {
          setState({ status: "ready", byId: new Map(items.map((item) => [item.id, item])), items });
        }
      })
      .catch(() => {
        if (current) {
          setState({ status: "error" });
        }
      });
    return () => {
      current = false;
    };
  }, []);

  return state;
}
