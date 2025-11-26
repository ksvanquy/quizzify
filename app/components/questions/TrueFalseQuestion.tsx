'use client';

import React from 'react';

interface TrueFalseQuestionProps {
  question: {
    id: number;
    text: string;
    explanation?: string;
  };
  selectedAnswer: boolean | null;
  onAnswerChange: (answer: boolean) => void;
  showExplanation?: boolean;
  isCorrect?: boolean;
}

export default function TrueFalseQuestion({
  question,
  selectedAnswer,
  onAnswerChange,
  showExplanation = false,
  isCorrect
}: TrueFalseQuestionProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={() => onAnswerChange(true)}
          className={`flex-1 p-4 rounded-lg border-2 transition ${
            selectedAnswer === true
              ? showExplanation
                ? isCorrect
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : 'border-indigo-600 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-300 bg-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">✓</span>
            <span className="font-semibold text-lg">Đúng</span>
          </div>
        </button>
        
        <button
          onClick={() => onAnswerChange(false)}
          className={`flex-1 p-4 rounded-lg border-2 transition ${
            selectedAnswer === false
              ? showExplanation
                ? isCorrect
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : 'border-indigo-600 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-300 bg-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">✗</span>
            <span className="font-semibold text-lg">Sai</span>
          </div>
        </button>
      </div>

      {showExplanation && question.explanation && (
        <div className={`p-4 rounded-lg border-l-4 ${
          isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
        }`}>
          <div className="flex items-start gap-2">
            <span className="text-xl">
              {isCorrect ? '✓' : '✗'}
            </span>
            <div>
              <p className="font-semibold mb-1">
                {isCorrect ? 'Chính xác!' : 'Chưa chính xác'}
              </p>
              <p className="text-sm text-gray-700">{question.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
