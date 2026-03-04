import { useEffect, useState } from "react";

export function useIsMobileDevice(): boolean {
  const getValue = () => {
    if (typeof window === "undefined") return false;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 1023px)").matches;
    return coarse || narrow;
  };

  const [isMobile, setIsMobile] = useState(getValue);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const coarseQuery = window.matchMedia("(pointer: coarse)");
    const widthQuery = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(getValue());

    coarseQuery.addEventListener("change", update);
    widthQuery.addEventListener("change", update);

    return () => {
      coarseQuery.removeEventListener("change", update);
      widthQuery.removeEventListener("change", update);
    };
  }, []);

  return isMobile;
}
