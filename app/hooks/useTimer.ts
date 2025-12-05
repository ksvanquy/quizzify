import { useEffect, useRef, useState, useCallback } from 'react';

interface UseTimerOptions {
  onTimeUp?: () => void;
  interval?: number;
}

/**
 * Hook để quản lý timer countdown
 * @param initialSeconds - Thời gian ban đầu (giây)
 * @param options - Tùy chọn
 * @returns { timeRemaining, start, pause, resume, reset }
 */
export const useTimer = (initialSeconds: number, options?: UseTimerOptions) => {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    setIsRunning(true);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          setIsRunning(false);
          options?.onTimeUp?.();
          return 0;
        }
        
        return newTime;
      });
    }, options?.interval || 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, options?.interval, options?.onTimeUp]);

  return { timeRemaining, start, pause, resume, reset, isRunning };
};
