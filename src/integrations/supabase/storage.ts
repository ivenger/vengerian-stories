
import { StorageError } from "@supabase/storage-js";

// Custom storage implementation with logging
export const customStorage = {
  getItem: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      console.log(`Storage getItem: ${key} => ${item ? "found" : "not found"}`);
      return Promise.resolve(item);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return Promise.resolve(null);
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
      console.log(`Storage setItem: ${key} => saved`);
      return Promise.resolve();
    } catch (error) {
      console.error('Error setting localStorage:', error);
      return Promise.resolve();
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
      console.log(`Storage removeItem: ${key} => removed`);
      return Promise.resolve();
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return Promise.resolve();
    }
  },
};
