import { useCallback } from 'react';

/**
 * Hook để định dạng thời gian từ giây sang mm:ss
 * @returns Hàm định dạng thời gian
 */
export const useFormatTime = () => {
  return useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);
};
