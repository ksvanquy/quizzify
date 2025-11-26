'use client';

// app/quiz/[id]/page.js (Component chính)

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function QuizPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Lấy dữ liệu bài thi từ API
  useEffect(() => {
    async function fetchQuiz() {
      try {
        const response = await fetch(`/api/quizzes/${unwrappedParams.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch quiz');
        }
        const data = await response.json();
        setQuizData(data);
        setTimeRemaining(data.duration * 60); // Convert to seconds
        setLoading(false);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        alert('Không thể tải bài thi. Vui lòng thử lại.');
        router.push('/');
      }
    }
    fetchQuiz();
  }, [unwrappedParams.id, router]);

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

  const handleAnswerChange = (questionId, optionId, isMultiple) => {
    if (isMultiple) {
      setUserAnswers((prev) => {
        const currentAnswers = prev[questionId] || [];
        const newAnswers = currentAnswers.includes(optionId)
          ? currentAnswers.filter(id => id !== optionId)
          : [...currentAnswers, optionId];
        return { ...prev, [questionId]: newAnswers };
      });
    } else {
      setUserAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    }
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

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="flex justify-between items-center p-3 bg-indigo-50 border-b mb-6 rounded-lg">
        <h1 className="text-2xl font-bold">{quizData.quizTitle}</h1>
        <div className={`font-mono text-lg px-4 py-1 rounded-full shadow-lg ${timeRemaining < 300 ? 'bg-red-500' : 'bg-green-500'} text-white`}>
          ⏰ {formatTime(timeRemaining)}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Cột trái: Nội dung Câu hỏi */}
        <div className="col-span-9 bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Câu {currentQuestionIndex + 1}/{quizData.questions.length}: {currentQuestion.text}
          </h3>
          {isMultiple && (
            <p className="text-sm text-gray-600 mb-3">(Chọn nhiều đáp án)</p>
          )}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <label
                key={option.id}
                className="flex items-center space-x-3 p-3 border rounded-md hover:bg-indigo-50 cursor-pointer"
              >
                <input
                  type={isMultiple ? 'checkbox' : 'radio'}
                  name={`q_${currentQuestion.id}`}
                  value={option.id}
                  checked={isMultiple ? (currentAnswer || []).includes(option.id) : currentAnswer === option.id}
                  onChange={() => handleAnswerChange(currentQuestion.id, option.id, isMultiple)}
                  className={`${isMultiple ? 'form-checkbox' : 'form-radio'} text-indigo-600`}
                />
                <span className="text-gray-700">{option.text}</span>
              </label>
            ))}
          </div>
          
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
    </div>
  );
}