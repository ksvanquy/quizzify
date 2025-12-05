'use client';

import React from 'react';
import { OptionDto } from '@/app/lib/questionDetails';

interface SingleChoiceQuestionProps {
  question: any;
  options: OptionDto[];
  selectedAnswer: any;
  onAnswerChange: (answer: any) => void;
  showExplanation?: boolean;
  isLoadingDetails?: boolean;
}

function SingleChoiceQuestion({
  question,
  options,
  selectedAnswer,
  onAnswerChange,
  showExplanation = false,
  isLoadingDetails = false,
}: SingleChoiceQuestionProps) {
  // Use fetched options if available, fallback to question.options
  const optionsToUse = options.length > 0 ? options : (question.options || []);
  const currentAnswer = selectedAnswer;
  const correctOptionId = question.correctOptionId;

  if (isLoadingDetails && options.length === 0) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
        <p className="text-blue-800">⏳ Đang tải các tùy chọn...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {question.text || question.content}
        </h3>
      </div>
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
    </div>
  );
}

export default React.memo(SingleChoiceQuestion);
