'use client';

// app/components/questions/NumericInputQuestion.tsx

import { useState } from 'react';

interface NumericInputQuestionProps {
  question: any;
  selectedAnswer: string | number | null;
  onAnswerChange: (answer: string) => void;
  showExplanation?: boolean;
  isCorrect?: boolean;
}

export default function NumericInputQuestion({
  question,
  selectedAnswer,
  onAnswerChange,
  showExplanation = false,
  isCorrect
}: NumericInputQuestionProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAnswerChange(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="number"
          value={selectedAnswer || ''}
          onChange={handleChange}
          disabled={showExplanation}
          step={question.step || 'any'}
          placeholder="Nhập câu trả lời (số)"
          className={`flex-1 px-4 py-3 text-lg border-2 rounded-lg focus:outline-none focus:ring-2 ${
            showExplanation
              ? isCorrect
                ? 'border-green-500 bg-green-50 focus:ring-green-500'
                : 'border-red-500 bg-red-50 focus:ring-red-500'
              : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
          }`}
        />
        
        {question.unit && (
          <span className="text-lg font-medium text-gray-600">
            {question.unit}
          </span>
        )}
      </div>

      {/* Hint về độ chính xác */}
      {!showExplanation && question.tolerance !== undefined && (
        <p className="text-sm text-gray-500">
          💡 Độ lệch cho phép: ±{question.tolerance}
        </p>
      )}

      {/* Show correct answer after submission */}
      {showExplanation && (
        <div className={`p-4 rounded-lg border-2 ${
          isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-2xl ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? '✓' : '✗'}
            </span>
            <span className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {isCorrect ? 'Chính xác!' : 'Chưa chính xác'}
            </span>
          </div>
          
          <div className="text-sm space-y-1">
            <p>
              <strong>Đáp án của bạn:</strong> {selectedAnswer || '(Chưa trả lời)'} {question.unit}
            </p>
            <p>
              <strong>Đáp án đúng:</strong> {question.correctAnswer} {question.unit}
              {question.tolerance !== undefined && ` (±${question.tolerance})`}
            </p>
          </div>
        </div>
      )}

      {/* Explanation */}
      {showExplanation && question.explanation && (
        <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="text-sm text-blue-900">
            <strong>Giải thích:</strong> {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
