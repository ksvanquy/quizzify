import { useCallback } from 'react';

/**
 * Hook để lấy access token từ localStorage một cách an toàn
 * @returns Access token hoặc null nếu không tìm thấy
 */
export const useAccessToken = () => {
  return useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }, []);
};
