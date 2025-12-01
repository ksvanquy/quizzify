// app/components/QuestionRenderer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import TrueFalseQuestion from './questions/TrueFalseQuestion';
import OrderingQuestion from './questions/OrderingQuestion';
import MatchingQuestion from './questions/MatchingQuestion';
import FillBlankQuestion from './questions/FillBlankQuestion';
import ImageChoiceQuestion from './questions/ImageChoiceQuestion';
import NumericInputQuestion from './questions/NumericInputQuestion';
import ClozeTestQuestion from './questions/ClozeTestQuestion';
import {
  fetchOptionsByQuestion,
  fetchOrderingByQuestion,
  fetchMatchingByQuestion,
  fetchFillBlankByQuestion,
  fetchNumericInputByQuestion,
  type OptionDto,
  type OrderingDto,
  type MatchingDto,
  type FillBlankDto,
  type NumericInputDto,
} from '@/lib/api/questionDetails';

interface QuestionRendererProps {
  question: any;
  userAnswer: any;
  onAnswerChange: (answer: any) => void;
  showExplanation?: boolean;
  correctAnswer?: any;
}

export default function QuestionRenderer({
  question,
  userAnswer,
  onAnswerChange,
  showExplanation = false,
  correctAnswer
}: QuestionRendererProps) {
  // State for fetched question details
  const [options, setOptions] = useState<OptionDto[]>([]);
  const [ordering, setOrdering] = useState<OrderingDto | null>(null);
  const [matching, setMatching] = useState<MatchingDto | null>(null);
  const [fillBlank, setFillBlank] = useState<FillBlankDto | null>(null);
  const [numericInput, setNumericInput] = useState<NumericInputDto | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const questionType = question.type;

  // Fetch question-specific details on mount or when question changes
  useEffect(() => {
    const fetchDetails = async () => {
      if (!question?.id) return;

      setIsLoadingDetails(true);

      try {
        if (questionType === 'single_choice' || questionType === 'multi_choice' || questionType === 'image_choice') {
          const opts = await fetchOptionsByQuestion(question.id);
          setOptions(opts);
        } else if (questionType === 'ordering') {
          const ord = await fetchOrderingByQuestion(question.id);
          setOrdering(ord);
        } else if (questionType === 'matching') {
          const mat = await fetchMatchingByQuestion(question.id);
          setMatching(mat);
        } else if (questionType === 'fill_blank') {
          const fb = await fetchFillBlankByQuestion(question.id);
          setFillBlank(fb);
        } else if (questionType === 'numeric_input') {
          const ni = await fetchNumericInputByQuestion(question.id);
          setNumericInput(ni);
        }
      } catch (error) {
        console.error('Error fetching question details:', error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [question?.id, questionType]);

  // Single Choice Question (existing)
  if (questionType === 'single_choice') {
    // Use fetched options if available, fallback to question.options
    const optionsToUse = options.length > 0 ? options : (question.options || []);
    const isMultiple = false;
    const currentAnswer = userAnswer;
    const correctOptionId = question.correctOptionId;

    if (isLoadingDetails && options.length === 0) {
      return (
        <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
          <p className="text-blue-800">⏳ Đang tải các tùy chọn...</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {optionsToUse.map((option: any) => {
          const isCorrect = option.id === correctOptionId;
          
          return (
            <label
              key={option.id}
              className={`flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition ${
                showExplanation
                  ? isCorrect
                    ? 'border-green-500 bg-green-50'
                    : currentAnswer === option.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:bg-gray-50'
                  : currentAnswer === option.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-300 hover:bg-indigo-50'
              }`}
            >
              <input
                type="radio"
                name={`q_${question.id}`}
                value={option.id}
                checked={currentAnswer === option.id}
                onChange={() => onAnswerChange(option.id)}
                disabled={showExplanation}
                className="form-radio text-indigo-600"
              />
              <span className={`flex-1 ${showExplanation && isCorrect ? 'font-semibold' : ''}`}>
                {option.text}
              </span>
              {showExplanation && isCorrect && (
                <span className="text-green-600 text-xl">✓</span>
              )}
              {showExplanation && !isCorrect && currentAnswer === option.id && (
                <span className="text-red-600 text-xl">✗</span>
              )}
            </label>
          );
        })}
      </div>
    );
  }

  // Multi Choice Question (existing)
  if (questionType === 'multi_choice') {
    // Use fetched options if available, fallback to question.options
    const optionsToUse = options.length > 0 ? options : (question.options || []);
    const currentAnswer = userAnswer || [];
    const correctOptionIds = question.correctOptionIds || [];

    if (isLoadingDetails && options.length === 0) {
      return (
        <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
          <p className="text-blue-800">⏳ Đang tải các tùy chọn...</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 mb-3">(Chọn nhiều đáp án)</p>
        {optionsToUse.map((option: any) => {
          const isCorrect = correctOptionIds.includes(option.id);
          
          return (
            <label
              key={option.id}
              className={`flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition ${
                showExplanation
                  ? isCorrect
                    ? 'border-green-500 bg-green-50'
                    : currentAnswer.includes(option.id)
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:bg-gray-50'
                  : currentAnswer.includes(option.id)
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-300 hover:bg-indigo-50'
              }`}
            >
              <input
                type="checkbox"
                value={option.id}
                checked={currentAnswer.includes(option.id)}
                onChange={() => {
                  const newAnswers = currentAnswer.includes(option.id)
                    ? currentAnswer.filter((id: number) => id !== option.id)
                    : [...currentAnswer, option.id];
                  onAnswerChange(newAnswers);
                }}
                disabled={showExplanation}
                className="form-checkbox text-indigo-600"
              />
              <span className={`flex-1 ${showExplanation && isCorrect ? 'font-semibold' : ''}`}>
                {option.text}
              </span>
              {showExplanation && isCorrect && (
                <span className="text-green-600 text-xl">✓</span>
              )}
              {showExplanation && !isCorrect && currentAnswer.includes(option.id) && (
                <span className="text-red-600 text-xl">✗</span>
              )}
            </label>
          );
        })}
      </div>
    );
  }

  // True/False Question
  if (questionType === 'true_false') {
    const isCorrect = showExplanation ? userAnswer === question.correctAnswer : undefined;
    
    return (
      <TrueFalseQuestion
        question={question}
        selectedAnswer={userAnswer}
        onAnswerChange={onAnswerChange}
        showExplanation={showExplanation}
        isCorrect={isCorrect}
      />
    );
  }

  // Ordering Question
  if (questionType === 'ordering') {
    // correctAnswer is already in the right format: string[]
    const correctOrder = correctAnswer as string[] | undefined;
    
    if (isLoadingDetails && !ordering) {
      return (
        <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
          <p className="text-blue-800">⏳ Đang tải thứ tự sắp xếp...</p>
        </div>
      );
    }

    return (
      <OrderingQuestion
        question={{ ...question, ...ordering }}
        selectedOrder={userAnswer || []}
        onAnswerChange={onAnswerChange}
        showExplanation={showExplanation}
        correctOrder={correctOrder}
      />
    );
  }

  // Matching Question
  if (questionType === 'matching') {
    // correctAnswer is already in the right format: Record<string, string>
    const correctMatches = correctAnswer as Record<string, string> | undefined;
    
    if (isLoadingDetails && !matching) {
      return (
        <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
          <p className="text-blue-800">⏳ Đang tải dữ liệu ghép đôi...</p>
        </div>
      );
    }

    return (
      <MatchingQuestion
        question={{ ...question, ...matching }}
        selectedMatches={userAnswer || {}}
        onAnswerChange={onAnswerChange}
        showExplanation={showExplanation}
        correctMatches={correctMatches}
      />
    );
  }

  // Fill in the Blank Question
  if (questionType === 'fill_blank') {
    // Merge fetched fill-blank data with question data
    const mergedQuestion = fillBlank ? { ...question, ...fillBlank } : question;
    
    const isCorrect = showExplanation 
      ? mergedQuestion.correctAnswers?.some((answer: string) => {
          const normalizedAnswer = mergedQuestion.caseSensitive 
            ? answer.trim() 
            : answer.trim().toLowerCase();
          const normalizedUser = mergedQuestion.caseSensitive 
            ? (userAnswer || '').trim() 
            : (userAnswer || '').trim().toLowerCase();
          return normalizedAnswer === normalizedUser;
        })
      : undefined;
    
    if (isLoadingDetails && !fillBlank) {
      return (
        <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
          <p className="text-blue-800">⏳ Đang tải dữ liệu điền chỗ trống...</p>
        </div>
      );
    }
    
    return (
      <FillBlankQuestion
        question={mergedQuestion}
        selectedAnswer={userAnswer || ''}
        onAnswerChange={onAnswerChange}
        showExplanation={showExplanation}
        isCorrect={isCorrect}
      />
    );
  }

  // Image Choice Question (single or multiple)
  if (questionType === 'image_choice' || questionType === 'image_choice_multiple') {
    return (
      <ImageChoiceQuestion
        question={question}
        selectedAnswer={userAnswer}
        onAnswerChange={onAnswerChange}
        showExplanation={showExplanation}
        correctAnswer={correctAnswer}
      />
    );
  }

  // Numeric Input Question
  if (questionType === 'numeric_input') {
    // Merge fetched numeric-input data with question data
    const mergedQuestion = numericInput ? { ...question, ...numericInput } : question;
    
    const isCorrect = showExplanation && mergedQuestion.correctNumber !== undefined
      ? Math.abs(parseFloat(userAnswer || '0') - mergedQuestion.correctNumber) <= (mergedQuestion.tolerance || 0)
      : undefined;

    if (isLoadingDetails && !numericInput) {
      return (
        <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
          <p className="text-blue-800">⏳ Đang tải dữ liệu nhập số...</p>
        </div>
      );
    }

    return (
      <NumericInputQuestion
        question={mergedQuestion}
        selectedAnswer={userAnswer}
        onAnswerChange={onAnswerChange}
        showExplanation={showExplanation}
        isCorrect={isCorrect}
      />
    );
  }

  // Cloze Test Question
  if (questionType === 'cloze_test') {
    return (
      <ClozeTestQuestion
        question={question}
        selectedAnswer={userAnswer || {}}
        onAnswerChange={onAnswerChange}
        showExplanation={showExplanation}
        correctAnswers={correctAnswer as Record<string, string[]> | undefined}
      />
    );
  }

  // Fallback for unknown question types
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
      <p className="text-yellow-800">
        ⚠️ Loại câu hỏi "{questionType}" chưa được hỗ trợ
      </p>
    </div>
  );
}
