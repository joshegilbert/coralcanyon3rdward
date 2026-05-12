"use client";

import { useEffect, useState } from "react";

const MOBILE_MAX_WIDTH = 1023;

/**
 * Returns true on viewports narrower than the `lg` Tailwind breakpoint (1024px).
 * SSR-safe: initial render returns `false`, then matches the real media query
 * after hydration. Use to swap sheet side, hide desktop-only views, etc.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile(e.matches);
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
