
import { useEffect, useRef } from "react";

export function useSessionTimeout(loading: boolean, onTimeout: () => void) {
  useEffect(() => {
    let isMounted = true;
    
    // Set a timeout to force-end loading state if it gets stuck
    const loadingTimeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("Auth loading state timed out, forcing completion");
        onTimeout();
      }
    }, 8000);

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeoutId);
    };
  }, [loading, onTimeout]);
}
