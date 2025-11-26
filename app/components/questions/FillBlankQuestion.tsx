'use client';

import React from 'react';

interface FillBlankQuestionProps {
  question: {
    id: number;
    text: string;
    correctAnswers: string[];
    caseSensitive?: boolean;
    explanation?: string;
  };
  selectedAnswer: string;
  onAnswerChange: (answer: string) => void;
  showExplanation?: boolean;
  isCorrect?: boolean;
}

export default function FillBlankQuestion({
  question,
  selectedAnswer,
  onAnswerChange,
  showExplanation = false,
  isCorrect
}: FillBlankQuestionProps) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-amber-800">
          ✏️ Điền từ/cụm từ thích hợp vào chỗ trống (_____)
        </p>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-800 text-lg leading-relaxed">
          {question.text.split('_____').map((part, index, array) => (
            <React.Fragment key={index}>
              {part}
              {index < array.length - 1 && (
                <input
                  type="text"
                  value={selectedAnswer}
                  onChange={(e) => onAnswerChange(e.target.value)}
                  disabled={showExplanation}
                  className={`inline-block mx-2 px-3 py-1 border-2 rounded min-w-[150px] text-center ${
                    showExplanation
                      ? isCorrect
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-indigo-400 bg-white focus:border-indigo-600 focus:outline-none'
                  }`}
                  placeholder="Nhập đáp án..."
                />
              )}
            </React.Fragment>
          ))}
        </p>
      </div>

      {showExplanation && (
        <div className={`p-4 rounded-lg border-l-4 ${
          isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
        }`}>
          <div className="flex items-start gap-2">
            <span className="text-xl">
              {isCorrect ? '✓' : '✗'}
            </span>
            <div className="flex-1">
              <p className="font-semibold mb-1">
                {isCorrect ? 'Chính xác!' : 'Chưa chính xác'}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                Đáp án đúng: <span className="font-semibold">
                  {question.correctAnswers.join(' hoặc ')}
                </span>
              </p>
              {question.explanation && (
                <p className="text-sm text-gray-700 mt-2">
                  💡 {question.explanation}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!question.caseSensitive && !showExplanation && (
        <p className="text-xs text-gray-500 italic">
          * Không phân biệt chữ hoa/thường
        </p>
      )}
    </div>
  );
}
