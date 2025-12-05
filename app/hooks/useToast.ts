import { useCallback, useRef, useState } from 'react';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning';
}

/**
 * Hook để quản lý toast notifications với auto-dismiss
 * @param duration - Thời gian hiển thị toast (ms), mặc định 3000ms
 * @returns { toast, showToast, removeToast }
 */
export const useToast = (duration: number = 3000) => {
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const removeToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ message, type });

    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, duration);
  }, [duration]);

  return { toast, showToast, removeToast };
};
