import { useCallback, useRef, useState } from 'react';
import { useAccessToken } from './useAccessToken';
import { useToast } from './useToast';

interface SubmitQuizOptions {
  onSuccess?: (resultId: string) => void;
  onError?: (error: Error) => void;
  timeout?: number;
}

/**
 * Hook để submit quiz với error handling
 * @param options - Tùy chọn submit
 * @returns { submitQuiz, isSubmitting, abort }
 */
export const useSubmitQuiz = (options?: SubmitQuizOptions) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const getAccessToken = useAccessToken();
  const { showToast } = useToast();

  const submitQuiz = useCallback(
    async (attemptId: string, userAnswers: Record<string, any>, timeSpentSeconds: number) => {
      if (isSubmitting) {
        showToast('Bài thi đang được nộp, vui lòng đợi...', 'warning');
        return;
      }

      const shouldSubmit = typeof window !== 'undefined' && 
        window.confirm('Bạn có chắc chắn muốn nộp bài?');
      
      if (!shouldSubmit) return;

      setIsSubmitting(true);

      try {
        if (!attemptId) {
          throw new Error('Invalid quiz attempt');
        }

        const accessToken = getAccessToken();
        if (!accessToken) {
          throw new Error('Session expired. Please login again.');
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        if (options?.timeout) {
          setTimeout(() => abortController.abort(), options.timeout);
        }

        const normalizedAnswers = Object.entries(userAnswers).reduce((acc, [key, value]) => {
          acc[String(key)] = value;
          return acc;
        }, {} as Record<string, any>);

        const requestBody = {
          userAnswers: normalizedAnswers,
          timeSpentSeconds
        };

        console.log('🎯 [DEBUG] Submit Quiz - Request Body:', {
          attemptId,
          userAnswers: normalizedAnswers,
          timeSpentSeconds,
          requestBodySent: requestBody
        });

        // Use Next.js API route instead of direct backend call
        const response = await fetch(`/api/attempts/${attemptId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          signal: abortController.signal,
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to submit' }));
          console.error('❌ [DEBUG] Submit Error:', {
            status: response.status,
            error: errorData
          });
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        
        console.log('✅ [DEBUG] Submit Success - Response:', result);
        
        // Extract result ID from various possible response formats
        let resultId: string | null = null;
        if (result?.data?.attempt?.id) resultId = result.data.attempt.id;
        else if (result?.data?.attempt?._id) resultId = result.data.attempt._id;
        else if (result?.data?.id) resultId = result.data.id;
        else if (result?.id) resultId = result.id;
        else if (result?.attemptId) resultId = result.attemptId;
        
        if (!resultId) {
          throw new Error('Invalid response from server - no attempt ID found');
        }

        options?.onSuccess?.(resultId);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Submit request was cancelled');
          return;
        }
        console.error('Error submitting quiz:', error);
        const err = error instanceof Error ? error : new Error('Unknown error');
        showToast(err.message, 'error');
        options?.onError?.(err);
      } finally {
        setIsSubmitting(false);
        abortControllerRef.current = null;
      }
    },
    [isSubmitting, getAccessToken, showToast, options]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { submitQuiz, isSubmitting, abort };
};
