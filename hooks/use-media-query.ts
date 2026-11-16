import * as React from "react";

// One subscription per query. On the server it reports false, and the client corrects it on hydration.
export function useMediaQuery(query: string): boolean {
  return React.useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

/** 1280px and up: wide enough, with the sidebar open, for full tables. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1280px)");
}
