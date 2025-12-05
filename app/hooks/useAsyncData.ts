import { useEffect, useState, useCallback } from 'react';

interface UseAsyncDataOptions {
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

/**
 * Hook để fetch dữ liệu từ API một cách generic
 * @param fetcher - Async function để fetch dữ liệu
 * @param dependencies - Dependencies để trigger re-fetch
 * @param options - Tùy chọn callback
 * @returns { data, loading, error }
 */
export const useAsyncData = <T,>(
  fetcher: () => Promise<T>,
  dependencies: any[] = [],
  options?: UseAsyncDataOptions
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetcher();
        
        if (mounted) {
          setData(result);
          options?.onSuccess?.(result);
        }
      } catch (err) {
        if (mounted) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMsg);
          options?.onError?.(err instanceof Error ? err : new Error(errorMsg));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  return { data, loading, error };
};
