'use client';

// app/quiz/[id]/page.js (Component chính)

import { useEffect, useState, useCallback, useRef, memo, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import QuestionRenderer from '@/app/components/QuestionRenderer';

export default function QuizPage({ params }) {
  const router = useRouter();
  // ✅ FIX #1: In Next.js 15+, params is a Promise - must unwrap with use()
  const unwrappedParams = use(params);
  const quizId = unwrappedParams?.id;
  

  
  const { user, isBookmarked, addBookmark, removeBookmark, isInWatchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const toastTimeoutRef = useRef(null);
  const submitAbortRef = useRef(null);

  // ✅ FIX #7: Extract token fetch logic to separate effect
  const getAccessToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }, []);

  // ✅ FIX #10: Add answer validation helper (must be before early returns)
  const isAnswerEmpty = useCallback((answer) => {
    if (answer === null || answer === undefined) return true;
    if (Array.isArray(answer)) return answer.length === 0;
    if (typeof answer === 'string') return answer.trim() === '';
    return false;
  }, []);

  // ✅ FIX #11: Memoized QuestionRenderer for performance (must be before early returns)
  const MemoizedQuestionRenderer = memo(QuestionRenderer);

  // ✅ All callbacks must be defined before early returns and effects (React Rules of Hooks)
  const handleAnswerChange = useCallback((questionId, answer) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  // ✅ FIX #12: Memoize current question BEFORE any conditional rendering (all hooks before early returns)
  // This prevents unnecessary re-renders in QuestionRenderer
  const currentQuestion = useMemo(
    () => quizData?.questions?.[currentQuestionIndex] || null,
    [currentQuestionIndex, quizData?.questions?.length]
  );


  // ✅ FIX #13: Memoize the answer change handler - depends ONLY on handleAnswerChange
  // Pass questionId explicitly to avoid currentQuestion?.id dependency
  const handleCurrentQuestionAnswerChange = useCallback(
    (answer) => {
      if (currentQuestion?.id) {
        handleAnswerChange(currentQuestion.id, answer);
      }
    },
    [handleAnswerChange]  // Only depend on stable handleAnswerChange
  );


  // All other callbacks will be defined conditionally using useMemo to avoid hook order issues
  // Store current question index in state to avoid dependency issues
  const handleSubmitCallback = useCallback(async () => {
    // ✅ FIX #5: Guard against multiple submits - check BEFORE any async operation
    if (isSubmitting) {
      console.warn('Submit already in progress');
      // Show warning directly without calling showToastCallback to avoid circular dependency
      setToast({ message: 'Bài thi đang được nộp, vui lòng đợi...', type: 'warning' });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => { setToast(null); }, 3000);
      return;
    }

    // ✅ FIX #4: Replace confirm() with better UX
    const shouldSubmit = typeof window !== 'undefined' && 
      window.confirm('Bạn có chắc chắn muốn nộp bài?');
    
    if (!shouldSubmit) return;

    setIsSubmitting(true);

    try {
      // ✅ FIX #15: Validate attemptId exists
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

      // Create AbortController for this request
      const abortController = new AbortController();
      submitAbortRef.current = abortController;

      // Prepare request body - normalize question IDs to strings
      const normalizedAnswers = Object.entries(userAnswers).reduce((acc, [key, value]) => {
        acc[String(key)] = value;
        return acc;
      }, {});

      const requestBody = {
        userAnswers: normalizedAnswers,
        timeSpentSeconds: Math.floor((new Date() - quizStartTime) / 1000)
      };
      
      console.log('Submitting attempt:', {
        attemptId: quizData.attemptId,
        userAnswers: normalizedAnswers,
        timeSpentSeconds: requestBody.timeSpentSeconds,
        requestBody: JSON.stringify(requestBody)
      });

      // Call backend NestJS API
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
      console.log('Submit response:', result);
      
      // ✅ FIX #15: Validate response structure - handle multiple formats from backend
      let resultId = null;
      
      // NestJS backend format: { success: true, data: { attempt: { id, ... } } }
      if (result?.data?.attempt?.id) {
        resultId = result.data.attempt.id;
      } else if (result?.data?.attempt?._id) {
        resultId = result.data.attempt._id;
      } else if (result?.data?.id) {
        resultId = result.data.id;
      } else if (result?.data?._id) {
        resultId = result.data._id;
      } else if (result?.id) {
        resultId = result.id;
      } else if (result?._id) {
        resultId = result._id;
      } else if (result?.attemptId) {
        resultId = result.attemptId;
      } else if (result?.data?.attemptId) {
        resultId = result.data.attemptId;
      }
      
      if (!resultId) {
        console.warn('Response structure:', JSON.stringify(result, null, 2));
        throw new Error('Invalid response from server - no attempt ID found');
      }

      router.push(`/result/${resultId}`);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Submit request was cancelled');
        return;
      }
      console.error('Error submitting quiz:', error);
      // Show error directly without calling showToastCallback
      const errorMsg = error.message || 'Lỗi khi nộp bài';
      setToast({ message: errorMsg, type: 'error' });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => { setToast(null); }, 3000);
    } finally {
      setIsSubmitting(false);
      submitAbortRef.current = null;
    }
  }, [quizData, userAnswers, getAccessToken, isSubmitting, router, quizStartTime]);

  const goToPrevQuestionCallback = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNextQuestionCallback = useCallback((totalQuestions) => {
    setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1));
  }, []);

  const formatTimeCallback = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const showToastCallback = useCallback((message, type = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    setToast({ message, type });
    
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 3000);
  }, []);

  const handleBookmarkToggleCallback = useCallback(async () => {
    if (!user) {
      setToast({ message: 'Vui lòng đăng nhập', type: 'error' });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => { setToast(null); }, 3000);
      return;
    }

    try {
      const qId = quizId ? String(quizId) : null;
      if (!qId) throw new Error('Invalid quiz ID');

      if (isBookmarked(qId)) {
        await removeBookmark(qId);
        setToast({ message: 'Đã xóa khỏi bookmark', type: 'success' });
      } else {
        await addBookmark(qId);
        setToast({ message: 'Đã thêm vào bookmark', type: 'success' });
      }
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => { setToast(null); }, 3000);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setToast({ message: 'Có lỗi xảy ra', type: 'error' });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => { setToast(null); }, 3000);
    }
  }, [user, quizId, isBookmarked, removeBookmark, addBookmark]);

  const handleWatchlistToggleCallback = useCallback(async () => {
    if (!user) {
      setToast({ message: 'Vui lòng đăng nhập', type: 'error' });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => { setToast(null); }, 3000);
      return;
    }

    try {
      const qId = quizId ? String(quizId) : null;
      if (!qId) throw new Error('Invalid quiz ID');

      if (isInWatchlist(qId)) {
        await removeFromWatchlist(qId);
        setToast({ message: 'Đã xóa khỏi watchlist', type: 'success' });
      } else {
        await addToWatchlist(qId);
        setToast({ message: 'Đã thêm vào watchlist', type: 'success' });
      }
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => { setToast(null); }, 3000);
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      setToast({ message: 'Có lỗi xảy ra', type: 'error' });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => { setToast(null); }, 3000);
    }
  }, [user, quizId, isInWatchlist, removeFromWatchlist, addToWatchlist]);

  // ✅ CRITICAL: All effects MUST be before early returns (React Rules of Hooks)
  // ✅ Cleanup on unmount
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

  // ✅ FIX #3: Validate quizId trước khi fetch
  // Check authentication before loading quiz
  useEffect(() => {
    if (!quizId) {
      setError('Invalid quiz ID');
      setLoading(false);
      return;
    }

    // TODO: Uncomment to require login
    // if (!user) {
    //   setError('Bạn cần đăng nhập để làm bài thi.');
    //   setLoading(false);
    //   return;
    // }
  }, [quizId, user]);

  // Lấy dữ liệu bài thi từ API
  useEffect(() => {
    if (!quizId) return; // Don't fetch if invalid

    async function fetchQuiz() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching quiz:', quizId);
        
        // ✅ FIX #7: Get token at right time
        const accessToken = getAccessToken();
        if (!accessToken) {
          throw new Error('No access token found');
        }
        
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        };
        
        console.log('✅ Authorization header set with Bearer token');
        
        const response = await fetch(`/api/quizzes/${quizId}`, {
          method: 'GET',
          headers,
          credentials: 'include'
        });
        
        // ✅ FIX #8: Handle non-200 status properly
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('API Error:', response.status, errorData);
          
          if (response.status === 401) {
            throw new Error('Bạn cần đăng nhập lại để tiếp tục.');
          }
          
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Quiz data loaded:', data);
        
        // ✅ FIX #9: Validate quizData structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response from server');
        }
        
        if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
          throw new Error('No questions found in quiz. Please contact administrator.');
        }

        // ✅ FIX #15: Validate attemptId
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
  }, [quizId]);

  // ✅ FIX #5: Proper timer with guards - extract to separate effect
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

  // ✅ FIX #6: Return early if data not ready
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

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl">Đang tải bài thi...</p>
      </div>
    );
  }

  // ✅ FIX #9: Validate quizData and questions exist
  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-700 font-semibold">Không có câu hỏi trong bài thi này</p>
        </div>
      </div>
    );
  }

  // Get current question and answer (after validation checks)
  const currentAnswer = userAnswers[currentQuestion?.id] || null;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="flex justify-between items-center p-3 bg-indigo-50 border-b mb-6 rounded-lg">
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-2xl font-bold">{quizData.quizTitle}</h1>
          
          {/* Bookmark & Watchlist Buttons */}
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
        {/* Cột trái: Nội dung Câu hỏi */}
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

        {/* Cột phải: Thanh điều hướng & Nộp bài */}
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

      {/* Toast Notification */}
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