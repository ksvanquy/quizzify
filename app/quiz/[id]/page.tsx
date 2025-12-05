'use client';

import { useEffect, useState, useCallback, useRef, memo, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import QuestionRenderer from '@/app/components/QuestionRenderer';

interface QuizPageProps {
  params: Promise<{ id: string }>;
}

interface QuizData {
  attemptId: string;
  quizTitle: string;
  duration: number;
  questions: Question[];
}

interface Question {
  id: string | number;
  text: string;
  type: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning';
}

const MemoizedQuestionRenderer = memo(QuestionRenderer);

export default function QuizPage({ params }: QuizPageProps) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const quizId = unwrappedParams?.id;

  const { user, isBookmarked, addBookmark, removeBookmark, isInWatchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const submitAbortRef = useRef<AbortController | null>(null);

  const getAccessToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }, []);

  const handleAnswerChange = useCallback((questionId: string | number, answer: any) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const currentQuestion = useMemo(
    () => quizData?.questions?.[currentQuestionIndex] || null,
    [currentQuestionIndex, quizData?.questions]
  );

  const handleCurrentQuestionAnswerChange = useCallback(
    (answer: any) => {
      if (currentQuestion?.id) {
        handleAnswerChange(currentQuestion.id, answer);
      }
    },
    [handleAnswerChange, currentQuestion?.id]
  );

  const goToPrevQuestionCallback = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNextQuestionCallback = useCallback((totalQuestions: number) => {
    setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1));
  }, []);

  const formatTimeCallback = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const showToastCallback = useCallback((message: string, type: Toast['type'] = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    setToast({ message, type });
    
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 3000);
  }, []);

  const handleSubmitCallback = useCallback(async () => {
    if (isSubmitting) {
      showToastCallback('Bài thi đang được nộp, vui lòng đợi...', 'warning');
      return;
    }

    const shouldSubmit = typeof window !== 'undefined' && 
      window.confirm('Bạn có chắc chắn muốn nộp bài?');
    
    if (!shouldSubmit) return;

    setIsSubmitting(true);

    try {
      if (!quizData?.attemptId) {
        throw new Error('Invalid quiz attempt');
      }

      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('Session expired. Please login again.');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      };

      const abortController = new AbortController();
      submitAbortRef.current = abortController;

      const normalizedAnswers = Object.entries(userAnswers).reduce((acc, [key, value]) => {
        acc[String(key)] = value;
        return acc;
      }, {} as Record<string, any>);

      const requestBody = {
        userAnswers: normalizedAnswers,
        timeSpentSeconds: Math.floor((new Date().getTime() - (quizStartTime?.getTime() || 0)) / 1000)
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/attempts/${quizData.attemptId}/submit`, {
        method: 'POST',
        headers,
        credentials: 'include',
        signal: abortController.signal,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to submit' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      let resultId: string | null = null;
      if (result?.data?.attempt?.id) resultId = result.data.attempt.id;
      else if (result?.data?.attempt?._id) resultId = result.data.attempt._id;
      else if (result?.data?.id) resultId = result.data.id;
      else if (result?.id) resultId = result.id;
      else if (result?.attemptId) resultId = result.attemptId;
      
      if (!resultId) {
        throw new Error('Invalid response from server - no attempt ID found');
      }

      router.push(`/result/${resultId}`);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Submit request was cancelled');
        return;
      }
      console.error('Error submitting quiz:', error);
      const errorMsg = error instanceof Error ? error.message : 'Lỗi khi nộp bài';
      showToastCallback(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
      submitAbortRef.current = null;
    }
  }, [quizData, userAnswers, getAccessToken, isSubmitting, router, quizStartTime, showToastCallback]);

  const handleBookmarkToggleCallback = useCallback(async () => {
    if (!user) {
      showToastCallback('Vui lòng đăng nhập', 'error');
      return;
    }

    try {
      const qId = quizId ? String(quizId) : null;
      if (!qId) throw new Error('Invalid quiz ID');

      if (isBookmarked(qId)) {
        await removeBookmark(qId);
        showToastCallback('Đã xóa khỏi bookmark', 'success');
      } else {
        await addBookmark(qId);
        showToastCallback('Đã thêm vào bookmark', 'success');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      showToastCallback('Có lỗi xảy ra', 'error');
    }
  }, [user, quizId, isBookmarked, removeBookmark, addBookmark, showToastCallback]);

  const handleWatchlistToggleCallback = useCallback(async () => {
    if (!user) {
      showToastCallback('Vui lòng đăng nhập', 'error');
      return;
    }

    try {
      const qId = quizId ? String(quizId) : null;
      if (!qId) throw new Error('Invalid quiz ID');

      if (isInWatchlist(qId)) {
        await removeFromWatchlist(qId);
        showToastCallback('Đã xóa khỏi watchlist', 'success');
      } else {
        await addToWatchlist(qId);
        showToastCallback('Đã thêm vào watchlist', 'success');
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      showToastCallback('Có lỗi xảy ra', 'error');
    }
  }, [user, quizId, isInWatchlist, removeFromWatchlist, addToWatchlist, showToastCallback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      if (submitAbortRef.current) {
        submitAbortRef.current.abort();
      }
    };
  }, []);

  // Validate quizId before fetch
  useEffect(() => {
    if (!quizId) {
      setError('Invalid quiz ID');
      setLoading(false);
    }
  }, [quizId]);

  // Fetch quiz data from API
  useEffect(() => {
    if (!quizId) return;

    async function fetchQuiz() {
      try {
        setLoading(true);
        setError(null);
        
        const accessToken = getAccessToken();
        if (!accessToken) {
          throw new Error('No access token found');
        }
        
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        };
        
        const response = await fetch(`/api/quizzes/${quizId}`, {
          method: 'GET',
          headers,
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          
          if (response.status === 401) {
            throw new Error('Bạn cần đăng nhập lại để tiếp tục.');
          }
          
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response from server');
        }
        
        if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
          throw new Error('No questions found in quiz. Please contact administrator.');
        }

        if (!data.attemptId) {
          throw new Error('Failed to create quiz attempt');
        }
        
        setQuizData(data);
        setQuizStartTime(new Date());
        setTimeRemaining(data.duration ? data.duration * 60 : 0);
        setLoading(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error fetching quiz:', errorMsg);
        setError(errorMsg);
        setLoading(false);
      }
    }
    
    fetchQuiz();
  }, [quizId, getAccessToken]);

  // Timer effect
  useEffect(() => {
    if (!quizData || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [!!quizData, isSubmitting]);

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700 font-semibold mb-4">Lỗi: {error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Quay về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl">Đang tải bài thi...</p>
      </div>
    );
  }

  // No questions state
  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-700 font-semibold">Không có câu hỏi trong bài thi này</p>
        </div>
      </div>
    );
  }

  const currentAnswer = currentQuestion?.id ? userAnswers[currentQuestion.id] || null : null;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="flex justify-between items-center p-3 bg-indigo-50 border-b mb-6 rounded-lg">
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-2xl font-bold">{quizData.quizTitle}</h1>
          
          {user && (
            <div className="flex gap-2">
              <button
                onClick={handleBookmarkToggleCallback}
                className="p-2 rounded-lg bg-white hover:bg-gray-50 transition border border-gray-200"
                title={isBookmarked(quizId) ? 'Xóa bookmark' : 'Thêm bookmark'}
              >
                {isBookmarked(quizId) ? (
                  <svg className="w-5 h-5 fill-yellow-500" viewBox="0 0 20 20">
                    <path d="M10 2l2.5 6.5L19 9l-5 4.5L15 20l-5-3.5L5 20l1-6.5L1 9l6.5-.5L10 2z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 stroke-gray-600 fill-none" viewBox="0 0 20 20" strokeWidth="2">
                    <path d="M10 2l2.5 6.5L19 9l-5 4.5L15 20l-5-3.5L5 20l1-6.5L1 9l6.5-.5L10 2z" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleWatchlistToggleCallback}
                className="p-2 rounded-lg bg-white hover:bg-gray-50 transition border border-gray-200"
                title={isInWatchlist(quizId) ? 'Xóa khỏi watchlist' : 'Thêm vào watchlist'}
              >
                {isInWatchlist(quizId) ? (
                  <svg className="w-5 h-5 fill-red-500" viewBox="0 0 20 20">
                    <path d="M10 18l-1.45-1.32C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0c1.74 0 3.41.81 4.5 2.09C11.09.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.18L10 18z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 stroke-gray-600 fill-none" viewBox="0 0 20 20" strokeWidth="2">
                    <path d="M10 18l-1.45-1.32C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0c1.74 0 3.41.81 4.5 2.09C11.09.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.18L10 18z" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
        
        <div className={`font-mono text-lg px-4 py-1 rounded-full shadow-lg ${timeRemaining < 300 ? 'bg-red-500' : 'bg-green-500'} text-white`}>
          ⏰ {formatTimeCallback(timeRemaining)}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-9 bg-white p-6 rounded-lg shadow">
          <MemoizedQuestionRenderer
            question={currentQuestion}
            userAnswer={currentAnswer}
            onAnswerChange={handleCurrentQuestionAnswerChange}
            showExplanation={false}
            correctAnswer={null}
          />
          
          <footer className="mt-8 flex justify-between pt-4 border-t">
            <button
              onClick={goToPrevQuestionCallback}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2 rounded ${currentQuestionIndex === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}
            >
              ← Câu Trước
            </button>
            <button
              onClick={() => goToNextQuestionCallback(quizData.questions.length)}
              disabled={currentQuestionIndex === quizData.questions.length - 1}
              className={`px-4 py-2 rounded ${currentQuestionIndex === quizData.questions.length - 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              Câu Tiếp Theo →
            </button>
          </footer>
        </div>

        <div className="col-span-3">
          <div className="bg-white p-4 rounded-lg shadow sticky top-4">
            <h4 className="font-semibold mb-3">Tình trạng bài làm</h4>
            <div className="grid grid-cols-5 gap-2">
              {quizData.questions.map((q, index) => {
                const isAnswered = userAnswers[q.id] !== undefined && 
                  (Array.isArray(userAnswers[q.id]) ? userAnswers[q.id].length > 0 : true);
                const isCurrent = index === currentQuestionIndex;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded-full text-sm ${
                      isCurrent
                        ? 'bg-indigo-700 text-white ring-2 ring-indigo-300'
                        : isAnswered
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={handleSubmitCallback}
              disabled={isSubmitting}
              className={`mt-6 w-full py-3 rounded font-bold text-white transition ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSubmitting ? '⏳ Đang nộp bài...' : 'NỘP BÀI'}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 animate-slide-up ${
          toast.type === 'success' ? 'bg-green-500' : toast.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : toast.type === 'warning' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
