import { AdminCacheData } from '@/types/auth';

const ADMIN_CACHE_KEY = 'admin-status-cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getAdminCache(): AdminCacheData | null {
  try {
    const cached = localStorage.getItem(ADMIN_CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached) as AdminCacheData;
      if (Date.now() - data.timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Error reading admin cache:', e);
  }
  return null;
}

export function setAdminCache(userId: string, isAdmin: boolean) {
  try {
    const cacheData: AdminCacheData = {
      isAdmin,
      timestamp: Date.now(),
      userId
    };
    localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('Error setting admin cache:', e);
  }
}

export function clearAdminCache() {
  try {
    localStorage.removeItem(ADMIN_CACHE_KEY);
  } catch (e) {
    console.warn('Error clearing admin cache:', e);
  }
}
