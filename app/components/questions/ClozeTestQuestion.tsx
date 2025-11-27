'use client';

// app/components/questions/ClozeTestQuestion.tsx

import { useState } from 'react';

interface ClozeTestQuestionProps {
  question: any;
  selectedAnswer: Record<string, string> | null;
  onAnswerChange: (answer: Record<string, string>) => void;
  showExplanation?: boolean;
  correctAnswers?: Record<string, string[]>;
}

export default function ClozeTestQuestion({
  question,
  selectedAnswer,
  onAnswerChange,
  showExplanation = false,
  correctAnswers
}: ClozeTestQuestionProps) {
  const answers = selectedAnswer || {};

  const handleInputChange = (blankId: string, value: string) => {
    onAnswerChange({
      ...answers,
      [blankId]: value
    });
  };

  const isCorrectAnswer = (blankId: string) => {
    if (!correctAnswers || !correctAnswers[blankId]) return false;
    const userAnswer = answers[blankId]?.trim().toLowerCase() || '';
    return correctAnswers[blankId].some(
      correct => correct.trim().toLowerCase() === userAnswer
    );
  };

  const renderTextWithBlanks = () => {
    const parts: React.ReactElement[] = [];
    let lastIndex = 0;

    // Parse text to find blanks marked as {{blank_id}}
    const blankRegex = /\{\{(\w+)\}\}/g;
    let match;

    while ((match = blankRegex.exec(question.text)) !== null) {
      const blankId = match[1];
      const startIndex = match.index;
      
      // Add text before blank
      if (startIndex > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {question.text.substring(lastIndex, startIndex)}
          </span>
        );
      }

      // Add input for blank
      const correct = showExplanation && isCorrectAnswer(blankId);
      const incorrect = showExplanation && !isCorrectAnswer(blankId) && answers[blankId];

      parts.push(
        <input
          key={`blank-${blankId}`}
          type="text"
          value={answers[blankId] || ''}
          onChange={(e) => handleInputChange(blankId, e.target.value)}
          disabled={showExplanation}
          placeholder="..."
          className={`inline-block mx-1 px-3 py-1 border-b-2 text-center focus:outline-none focus:border-indigo-600 ${
            showExplanation
              ? correct
                ? 'border-green-500 bg-green-50 text-green-800'
                : incorrect
                ? 'border-red-500 bg-red-50 text-red-800'
                : 'border-gray-300'
              : 'border-gray-400'
          }`}
          style={{ width: '120px' }}
        />
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < question.text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {question.text.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg text-lg leading-relaxed">
        {renderTextWithBlanks()}
      </div>

      {!showExplanation && (
        <p className="text-sm text-gray-500">
          💡 Điền vào các chỗ trống trong đoạn văn
        </p>
      )}

      {/* Show results after submission */}
      {showExplanation && correctAnswers && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">Kết quả:</h4>
          {Object.keys(correctAnswers).map((blankId) => {
            const correct = isCorrectAnswer(blankId);
            return (
              <div
                key={blankId}
                className={`p-3 rounded-lg border-2 ${
                  correct ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xl ${correct ? 'text-green-600' : 'text-red-600'}`}>
                    {correct ? '✓' : '✗'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm">
                      <strong>Chỗ trống {blankId}:</strong> {answers[blankId] || '(Chưa trả lời)'}
                    </p>
                    {!correct && (
                      <p className="text-sm text-gray-600">
                        <strong>Đáp án đúng:</strong> {correctAnswers[blankId].join(' hoặc ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
