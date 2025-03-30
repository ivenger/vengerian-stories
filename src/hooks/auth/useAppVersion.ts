
import { useEffect } from "react";

export function useAppVersion() {
  // Use a FIXED version string instead of timestamps
  const APP_VERSION = "1.0.0";
  const LAST_VERSION_KEY = 'app_version';

  useEffect(() => {
    const storedVersion = localStorage.getItem(LAST_VERSION_KEY);
    
    if (storedVersion !== APP_VERSION) {
      console.log("App version changed - Stored:", storedVersion, "Current:", APP_VERSION);
      localStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
    }
  }, []);
}
