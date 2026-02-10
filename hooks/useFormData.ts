// hooks/useFormData.ts
import { useEffect, useState } from "react";

interface UseFormDataResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function useFormData<T = any>(endpoint: string, id: string | null): UseFormDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  // FIX 1: Start false. Only set true if we actually fetch.
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no ID, we aren't loading anything.
    if (!endpoint || !id) return;

    setIsLoading(true);
    setError(null);

    fetch(`/api/${endpoint}/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch data");
        return res.json();
      })
      .then((json) => {
        // FIX 2: Check if the API wrapped the result in a "data" property
        // If json.data exists, use that. Otherwise use the whole json.
        setData(json.data || json); 
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [endpoint, id]);

  return { data, isLoading, error };
}