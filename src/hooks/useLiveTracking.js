import { useEffect } from "react";

// Tracking disabled — no-op hook
export function useLiveTracking() {
  useEffect(() => {
    // intentionally left blank
    return () => {};
  }, []);
}