import { useCallback } from 'react';

/**
 * Hook để quản lý navigation giữa các câu hỏi
 * @returns { goToPrevQuestion, goToNextQuestion }
 */
export const useQuestionNavigation = (
  onPrevQuestion: (index: number) => void,
  onNextQuestion: (index: number) => void
) => {
  const goToPrevQuestion = useCallback(() => {
    onPrevQuestion?.(0); // Callback xử lý logic, hook này generic
  }, [onPrevQuestion]);

  const goToNextQuestion = useCallback(() => {
    onNextQuestion?.(0);
  }, [onNextQuestion]);

  return { goToPrevQuestion, goToNextQuestion };
};
