import { createContext, useContext } from "react";

type LearningFocusValue = {
  readonly isFocusMode: boolean;
  readonly setFocusMode: (next: boolean) => void;
};

export const LearningFocusContext = createContext<LearningFocusValue | null>(null);

export function useLearningFocus(): LearningFocusValue {
  const value = useContext(LearningFocusContext);
  if (!value) {
    throw new Error("useLearningFocus must be used inside AppShell.");
  }
  return value;
}
