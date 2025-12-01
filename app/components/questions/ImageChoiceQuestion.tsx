'use client';

// app/components/questions/ImageChoiceQuestion.tsx

import React, { useState } from 'react';

interface ImageChoiceQuestionProps {
  question: any;
  selectedAnswer: number | number[] | null;
  onAnswerChange: (answer: number | number[]) => void;
  showExplanation?: boolean;
  correctAnswer?: number | number[];
}

function ImageChoiceQuestion({
  question,
  selectedAnswer,
  onAnswerChange,
  showExplanation = false,
  correctAnswer
}: ImageChoiceQuestionProps) {
  const isMultiple = question.type === 'image_choice_multiple';
  const currentAnswer = isMultiple ? (selectedAnswer || []) : selectedAnswer;

  const handleImageClick = (optionId: number) => {
    if (showExplanation) return;

    if (isMultiple) {
      const answers = currentAnswer as number[];
      const newAnswers = answers.includes(optionId)
        ? answers.filter(id => id !== optionId)
        : [...answers, optionId];
      onAnswerChange(newAnswers);
    } else {
      onAnswerChange(optionId);
    }
  };

  const isSelected = (optionId: number) => {
    if (isMultiple) {
      return (currentAnswer as number[]).includes(optionId);
    }
    return currentAnswer === optionId;
  };

  const isCorrectOption = (optionId: number) => {
    if (!correctAnswer) return false;
    if (Array.isArray(correctAnswer)) {
      return correctAnswer.includes(optionId);
    }
    return correctAnswer === optionId;
  };

  return (
    <div className="space-y-4">
      {isMultiple && (
        <p className="text-sm text-gray-600 mb-3">(Chọn nhiều hình ảnh)</p>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(question.options || []).map((option: any) => {
          const selected = isSelected(option.id);
          const correct = showExplanation && isCorrectOption(option.id);
          const incorrect = showExplanation && selected && !isCorrectOption(option.id);

          return (
            <div
              key={option.id}
              onClick={() => handleImageClick(option.id)}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${
                showExplanation
                  ? correct
                    ? 'border-green-500 bg-green-50'
                    : incorrect
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                  : selected
                  ? 'border-indigo-600 shadow-lg'
                  : 'border-gray-300 hover:border-indigo-400'
              }`}
            >
              {/* Image */}
              <div className="aspect-square relative">
                <img
                  src={option.imageUrl}
                  alt={option.text || `Option ${option.id}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Selected overlay */}
                {selected && !showExplanation && (
                  <div className="absolute inset-0 bg-indigo-600 bg-opacity-20 flex items-center justify-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl">✓</span>
                    </div>
                  </div>
                )}

                {/* Correct/Incorrect overlay */}
                {showExplanation && (correct || incorrect) && (
                  <div className={`absolute inset-0 ${correct ? 'bg-green-500' : 'bg-red-500'} bg-opacity-20 flex items-center justify-center`}>
                    <div className={`w-12 h-12 ${correct ? 'bg-green-500' : 'bg-red-500'} rounded-full flex items-center justify-center`}>
                      <span className="text-white text-2xl">{correct ? '✓' : '✗'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Text label */}
              {option.text && (
                <div className={`p-2 text-center text-sm font-medium ${
                  showExplanation && correct
                    ? 'bg-green-100 text-green-800'
                    : showExplanation && incorrect
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {option.text}
                </div>
              )}
            </div>
          );
        })}
      </div>

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

export default React.memo(ImageChoiceQuestion);
