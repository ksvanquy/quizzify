'use client';

import Link from 'next/link';
import { useEffect, useState, use } from 'react';
import QuestionRenderer from '@/app/components/QuestionRenderer';

// TypeScript Interfaces
interface RouteParams {
  attemptId: string;
}

interface AttemptDetail {
  questionId: string;
  userAnswer: string | string[] | Record<string, string> | boolean | number;
  isCorrect: boolean;
  earnedPoints?: number;
  maxPoints?: number;
}

interface Question {
  id: string;
  type: 'single_choice' | 'multi_choice' | 'true_false' | 'ordering' | 'matching' | 'fill_blank' | 'cloze' | 'numeric';
  content: string;
  options?: Array<{ id: string; text: string }>;
  correctOptionId?: string;
  correctOptionIds?: string[];
  correctAnswer?: boolean | string | number;
  correctOrder?: string[];
  correctMatches?: Record<string, string>;
  correctAnswers?: string[];
  explanation?: string;
}

interface ResultData {
  id: string;
  templateId: string;
  userId: string;
  quizTitle: string;
  score?: number;
  correctCount: number;
  totalQuestions: number;
  maxScore?: number;
  percentage: number;
  passingScore: number;
  passed: boolean;
  durationMinutes: number;
  questions: Question[];
  attemptDetails?: AttemptDetail[];
  completedAt?: string;
}

interface ResultPageProps {
  params: Promise<RouteParams>;
}

export default function ResultPage({ params }: ResultPageProps) {
  const unwrappedParams = use(params);
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResult() {
      try {
        setLoading(true);
        setError(null);

        // Get access token
        const accessToken = typeof window !== 'undefined' 
          ? localStorage.getItem('accessToken')
          : null;

        if (!accessToken) {
          throw new Error('Session expired. Please login again.');
        }

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        };

        // Call backend NestJS API directly
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/attempts/${unwrappedParams.attemptId}`, {
          method: 'GET',
          headers,
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch result' }));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Result data:', data);
        
        // Debug: Xem structure của attempt data
        const attemptData = data?.data?.attempt || data?.data || data;
        console.log('📋 Attempt Data Structure:', {
          hasAttempt: !!attemptData,
          hasQuestions: !!attemptData?.questions,
          questionsCount: attemptData?.questions?.length,
          firstQuestion: attemptData?.questions?.[0],
          totalScore: attemptData?.totalScore,
          percentage: attemptData?.percentage,
          passed: attemptData?.passed,
          userAnswers: attemptData?.userAnswers
        });
        
        if (!attemptData) {
          throw new Error('Invalid response structure');
        }

        setResult(attemptData as ResultData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching result:', error);
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Không thể tải kết quả. Vui lòng thử lại.';
        setError(errorMessage);
        setLoading(false);
      }
    }
    
    fetchResult();
  }, [unwrappedParams.attemptId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl">Đang tải kết quả...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-xl text-red-600 mb-4">Lỗi: {error}</p>
          <Link href="/" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700">
            Quay về Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl text-red-600">Không tìm thấy kết quả</p>
        <Link href="/" className="mt-4 inline-block bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700">
          Quay về Trang Chủ
        </Link>
      </div>
    );
  }

  const resultStatus = result.passed ? 'ĐẠT' : 'CHƯA ĐẠT';
  const statusColor = result.passed ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';

  return (
    <div className="container mx-auto p-4 max-w-4xl text-center">
      <h1 className="text-4xl font-extrabold mb-8 text-indigo-700">🎉 Kết Quả Bài Thi</h1>
      
      <div className={`p-6 mb-8 rounded-lg shadow-xl ${statusColor}`}>
        <p className="text-xl">Tình trạng:</p>
        <h2 className="text-5xl font-bold mt-2">{resultStatus}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 text-left p-6 border rounded-lg bg-white shadow-md">
        <p className="text-gray-600">Bài Thi:</p>
        <p className="font-semibold">{result.quizTitle}</p>
        
        <p className="text-gray-600">Điểm Số Đạt Được:</p>
        <p className="text-2xl font-bold text-indigo-600">
          {result.score ?? result.correctCount} / {result.maxScore ?? result.totalQuestions} 
          {result.maxScore && ` (${result.correctCount}/${result.totalQuestions} câu đúng)`}
        </p>

        <p className="text-gray-600">Phần Trăm:</p>
        <p className="text-2xl font-bold">{result.percentage}%</p>
        
        <p className="text-gray-600">Điểm Đạt:</p>
        <p className="font-semibold">{result.passingScore}%</p>
        
        <p className="text-gray-600">Thời Gian Hoàn Thành:</p>
        <p className="font-semibold">{result.durationMinutes} phút</p>
      </div>

      {/* Hiển thị chi tiết từng câu hỏi */}
      {result.questions && result.questions.length > 0 && (
        <div className="mt-8 space-y-6 text-left">
          <h3 className="text-2xl font-bold text-gray-800">Chi tiết đáp án</h3>
          {result.questions.map((q, index) => {
            const attemptDetail = result.attemptDetails?.find(ad => ad.questionId === q.id);
            const userAnswer = attemptDetail?.userAnswer;
            const isCorrect = attemptDetail?.isCorrect;
            
            // Get correct answer based on question type
            let correctAnswer: string | string[] | Record<string, string> | boolean | number | undefined;
            switch (q.type) {
              case 'single_choice':
                correctAnswer = q.correctOptionId;
                break;
              case 'multi_choice':
                correctAnswer = q.correctOptionIds || [];
                break;
              case 'true_false':
                correctAnswer = q.correctAnswer;
                break;
              case 'ordering':
                correctAnswer = q.correctOrder || [];
                break;
              case 'matching':
                correctAnswer = q.correctMatches || {};
                break;
              case 'fill_blank':
              case 'cloze':
                correctAnswer = q.correctAnswers || [];
                break;
              case 'numeric':
                correctAnswer = q.correctAnswer;
                break;
              default:
                correctAnswer = undefined;
            }

            return (
              <div 
                key={q.id} 
                className={`p-6 rounded-lg border-2 ${
                  isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">
                    Câu {index + 1}/{result.questions.length}
                  </h4>
                  <div className="flex items-center gap-2">
                    {attemptDetail?.earnedPoints !== undefined && (
                      <span className="text-sm font-medium">
                        {attemptDetail.earnedPoints}/{attemptDetail.maxPoints} điểm
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {isCorrect ? '✓ Đúng' : '✗ Sai'}
                    </span>
                  </div>
                </div>
                
                <QuestionRenderer
                  question={q}
                  userAnswer={userAnswer}
                  onAnswerChange={() => {}} // Read-only mode
                  showExplanation={true}
                  correctAnswer={correctAnswer}
                />
              </div>
            );
          })}
        </div>
      )}
      <Link 
        href="/" 
        className="mt-8 inline-block bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 transition font-medium"
      >
        Quay về Trang Chủ
      </Link>
    </div>
  );
}
