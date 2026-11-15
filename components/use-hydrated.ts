"use client";

import { useEffect, useState } from "react";

/** Keeps browser-only preferences out of the first server/client render. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Each consuming island waits for its own hydration before using browser state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  return hydrated;
}
