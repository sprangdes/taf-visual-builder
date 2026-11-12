import { createContext, useContext } from "react";
export const TourContext = createContext(null);
export function useTour() {
    const context = useContext(TourContext);
    if (!context)
        throw new Error("useTour must be used inside TourProvider");
    return context;
}
