import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  defaultProgressState,
  forgetDua,
  readProgress,
  recordReview,
  updateSettings,
  writeProgress,
  type AppSettings,
  type ProgressState,
  type RecallOutcome,
} from "../content/progress.js";

type ProgressContextValue = {
  readonly state: ProgressState;
  readonly settings: AppSettings;
  /** True when the device actually keeps the record between visits. */
  readonly isSaved: boolean;
  readonly review: (duaId: string, outcome: RecallOutcome) => void;
  readonly changeSettings: (patch: Partial<AppSettings>) => void;
  readonly forget: (duaId: string) => void;
  readonly resetAll: () => void;
};

const browserStorage = (): Storage | undefined => {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
};

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

export function ProgressProvider({ children }: { readonly children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => readProgress(browserStorage()));
  const [isSaved, setSaved] = useState(true);

  const persist = useCallback((next: ProgressState) => {
    setState(next);
    setSaved(writeProgress(browserStorage(), next));
  }, []);

  const value = useMemo<ProgressContextValue>(() => {
    return {
      state,
      settings: state.settings,
      isSaved,
      review: (duaId, outcome) => persist(recordReview(state, duaId, outcome)),
      changeSettings: (patch) => persist(updateSettings(state, patch)),
      forget: (duaId) => persist(forgetDua(state, duaId)),
      resetAll: () => persist({ ...defaultProgressState(), settings: state.settings }),
    };
  }, [isSaved, persist, state]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) {
    throw new Error("useProgress must be used inside ProgressProvider.");
  }
  return value;
}
