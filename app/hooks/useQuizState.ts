import { useCallback, useState } from 'react';

/**
 * Hook để quản lý trạng thái và logic câu hỏi
 * @returns { currentQuestionIndex, userAnswers, handleAnswerChange, goToPrev, goToNext }
 */
export const useQuizState = (totalQuestions: number = 0) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});

  const handleAnswerChange = useCallback((questionId: string | number, answer: any) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const goToPrevQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1));
  }, [totalQuestions]);

  const resetAnswers = useCallback(() => {
    setUserAnswers({});
    setCurrentQuestionIndex(0);
  }, []);

  return {
    currentQuestionIndex,
    userAnswers,
    handleAnswerChange,
    goToPrevQuestion,
    goToNextQuestion,
    resetAnswers,
    setCurrentQuestionIndex
  };
};
