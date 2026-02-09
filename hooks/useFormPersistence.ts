import { useEffect } from "react";

/**
 * Custom hook to persist form data to localStorage.
 * @param keyPrefix Prefix for localStorage keys
 * @param data Object containing form data
 */
export function useFormPersistence<T extends Record<string, any>>(keyPrefix: string, data: T) {
  useEffect(() => {
    try {
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(`${keyPrefix}_${key}`, typeof value === "object" ? JSON.stringify(value) : String(value));
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to save to localStorage", error);
    }
  }, [keyPrefix, data]);
}
