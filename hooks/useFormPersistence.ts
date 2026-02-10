import { useEffect, useRef } from "react";

/**
 * Custom hook to persist form data to localStorage.
 * @param keyPrefix Prefix for localStorage keys
 * @param data Object containing form data
 */
export function useFormPersistence<T>(keyPrefix: string, data: T) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Prevent saving empty initial state on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (data && Object.keys(data).length > 0) {
      localStorage.setItem(keyPrefix, JSON.stringify(data));
    }
  }, [keyPrefix, data]);
}
