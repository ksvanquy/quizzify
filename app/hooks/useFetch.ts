import { useCallback, useRef } from 'react';
import { useAccessToken } from './useAccessToken';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface UseFetchOptions {
  timeout?: number;
}

/**
 * Hook để fetch dữ liệu với Bearer token authentication
 * @param options - Tùy chọn fetch
 * @returns { fetch: hàm fetch với token, abort: hàm cancel request }
 */
export const useFetch = (options?: UseFetchOptions) => {
  const getAccessToken = useAccessToken();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchWithToken = useCallback(
    async (url: string, fetchOptions?: FetchOptions) => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      if (options?.timeout) {
        setTimeout(() => abortController.abort(), options.timeout);
      }

      const headers = {
        'Content-Type': 'application/json',
        ...fetchOptions?.headers,
        'Authorization': `Bearer ${accessToken}`
      };

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include',
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return response.json();
    },
    [getAccessToken, options?.timeout]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { fetch: fetchWithToken, abort };
};
