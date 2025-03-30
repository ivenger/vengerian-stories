
import { useEffect } from "react";

export function useAppVersion() {
  // Version hash to force logout on application rebuilds - updated with timestamp on each build
  const APP_VERSION = "1.0.0"; // Use a fixed version instead of timestamp to prevent unnecessary updates
  const LAST_VERSION_KEY = 'app_version';

  useEffect(() => {
    const storedVersion = localStorage.getItem(LAST_VERSION_KEY);
    
    if (storedVersion !== APP_VERSION) {
      console.log("App version changed - Stored:", storedVersion, "Current:", APP_VERSION);
      localStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
    }
    
    // Comment out the forced logout for now to avoid issues with OAuth
  }, []);
}
