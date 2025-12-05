// app/components/QuestionRenderer.tsx
'use client';

import React from 'react';
import SingleChoiceQuestion from './questions/SingleChoiceQuestion';
import MultiChoiceQuestion from './questions/MultiChoiceQuestion';
import TrueFalseQuestion from './questions/TrueFalseQuestion';
import OrderingQuestion from './questions/OrderingQuestion';
import MatchingQuestion from './questions/MatchingQuestion';
import FillBlankQuestion from './questions/FillBlankQuestion';
import ImageChoiceQuestion from './questions/ImageChoiceQuestion';
import NumericInputQuestion from './questions/NumericInputQuestion';
import ClozeTestQuestion from './questions/ClozeTestQuestion';
import { useQuestionDetails } from '@/app/hooks';

interface QuestionRendererProps {
  question: any;
  userAnswer: any;
  onAnswerChange: (answer: any) => void;
  showExplanation?: boolean;
  correctAnswer?: any;
}

function QuestionRenderer({
  question,
  userAnswer,
  onAnswerChange,
  showExplanation = false,
  correctAnswer
}: QuestionRendererProps) {
  // Add null check - if question is null, return loading or error state
  if (!question) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading question...</p>
      </div>
    );
  }

  const questionType = question.type;

  // Fetch question-specific details using custom hook
  const {
    options,
    ordering,
    matching,
    fillBlank,
    numericInput,
    isLoadingDetails,
  } = useQuestionDetails(question?.id, questionType);

  // Single Choice Question
  if (questionType === 'single_choice') {
    return (
      <SingleChoiceQuestion
        question={question}
        options={options}
        selectedAnswer={userAnswer}
        onAnswerChange={onAnswerChange}
        showExplanation={showExplanation}
        isLoadingDetails={isLoadingDetails}
      />
    );
  }

  // Multi Choice Question
  if (questionType === 'multi_choice') {
    return (
      <MultiChoiceQuestion
        question={question}
        options={options}
        selectedAnswer={userAnswer}
        onAnswerChange={onAnswerChange}
        showExplanation={showExplanation}
        isLoadingDetails={isLoadingDetails}
      />
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
    const mergedQuestion = fillBlank ? { ...question, ...fillBlank } : question;

    const isCorrect =
      showExplanation
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
    const mergedQuestion = numericInput ? { ...question, ...numericInput } : question;

    const isCorrect =
      showExplanation && mergedQuestion.correctNumber !== undefined
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

// ✅ Export memoized version to prevent unnecessary re-renders when parent component updates
export default React.memo(QuestionRenderer);
