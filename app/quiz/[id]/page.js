'use client';

// app/quiz/[id]/page.js (Component chính)

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import QuestionRenderer from '@/app/components/QuestionRenderer';

export default function QuizPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { user, isBookmarked, addBookmark, removeBookmark, isInWatchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [toast, setToast] = useState(null);

  // Check authentication before loading quiz
  useEffect(() => {
    if (!user) {
      alert('Bạn cần đăng nhập để làm bài thi.');
      router.push('/');
      return;
    }
  }, [user, router]);

  // Lấy dữ liệu bài thi từ API
  useEffect(() => {
    if (!user) return; // Don't fetch if not authenticated

    async function fetchQuiz() {
      try {
        const response = await fetch(`/api/quizzes/${unwrappedParams.id}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', response.status, errorData);
          
          if (response.status === 401) {
            alert('Bạn cần đăng nhập để làm bài thi.');
            router.push('/');
            return;
          }
          
          throw new Error(errorData.message || 'Failed to fetch quiz');
        }
        const data = await response.json();
        console.log('Quiz data loaded:', data);
        
        if (!data.questions || data.questions.length === 0) {
          throw new Error('No questions found in quiz');
        }
        
        setQuizData(data);
        setTimeRemaining(data.duration * 60); // Convert to seconds
        setLoading(false);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        alert(`Không thể tải bài thi: ${error.message}`);
        router.push('/');
      }
    }
    fetchQuiz();
  }, [unwrappedParams.id, router, user]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0 || !quizData) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, quizData]);

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!confirm('Bạn có chắc chắn muốn nộp bài?')) return;

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: quizData.attemptId,
          answers: userAnswers
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const result = await response.json();
      router.push(`/result/${result.attemptId}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Không thể nộp bài. Vui lòng thử lại.');
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBookmarkToggle = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }

    try {
      const quizId = parseInt(unwrappedParams.id);
      if (isBookmarked(quizId)) {
        await removeBookmark(quizId);
        showToast('Đã xóa khỏi bookmark', 'success');
      } else {
        await addBookmark(quizId);
        showToast('Đã thêm vào bookmark', 'success');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      showToast('Có lỗi xảy ra', 'error');
    }
  };

  const handleWatchlistToggle = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }

    try {
      const quizId = parseInt(unwrappedParams.id);
      if (isInWatchlist(quizId)) {
        await removeFromWatchlist(quizId);
        showToast('Đã xóa khỏi watchlist', 'success');
      } else {
        await addToWatchlist(quizId);
        showToast('Đã thêm vào watchlist', 'success');
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      showToast('Có lỗi xảy ra', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl">Đang tải bài thi...</p>
      </div>
    );
  }

  if (!quizData) return null;

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const isMultiple = currentQuestion.type === 'multi_choice';
  const currentAnswer = userAnswers[currentQuestion.id];

  const quizId = parseInt(unwrappedParams.id);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="flex justify-between items-center p-3 bg-indigo-50 border-b mb-6 rounded-lg">
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-2xl font-bold">{quizData.quizTitle}</h1>
          
          {/* Bookmark & Watchlist Buttons */}
          {user && (
            <div className="flex gap-2">
              <button
                onClick={handleBookmarkToggle}
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
                onClick={handleWatchlistToggle}
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
          ⏰ {formatTime(timeRemaining)}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Cột trái: Nội dung Câu hỏi */}
        <div className="col-span-9 bg-white p-6 rounded-lg shadow">
          <QuestionRenderer
            question={currentQuestion}
            userAnswer={currentAnswer}
            onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
            showExplanation={false}
            correctAnswer={null}
          />
          
          <footer className="mt-8 flex justify-between pt-4 border-t">
            <button
              onClick={goToPrevQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2 rounded ${currentQuestionIndex === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}
            >
              ← Câu Trước
            </button>
            <button
              onClick={goToNextQuestion}
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
              onClick={handleSubmit}
              className="mt-6 w-full bg-red-600 text-white py-3 rounded hover:bg-red-700 font-bold"
            >
              NỘP BÀI
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 animate-slide-up ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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