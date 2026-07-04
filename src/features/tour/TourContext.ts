import { createContext, useContext } from "react";
import type { TourId } from "./types";

export interface TourContextValue {
  startTour: (id: TourId) => void;
  isRunning: boolean;
  isMobile: boolean;
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}

export const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const context = useContext(TourContext);
  if (!context) throw new Error("useTour must be used inside TourProvider");
  return context;
}
