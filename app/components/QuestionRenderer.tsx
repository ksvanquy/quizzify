// app/components/QuestionRenderer.tsx
'use client';

import React from 'react';
import TrueFalseQuestion from './questions/TrueFalseQuestion';
import OrderingQuestion from './questions/OrderingQuestion';
import MatchingQuestion from './questions/MatchingQuestion';
import FillBlankQuestion from './questions/FillBlankQuestion';

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
  const questionType = question.type;

  // Single Choice Question (existing)
  if (questionType === 'single_choice') {
    const isMultiple = false;
    const currentAnswer = userAnswer;

    return (
      <div className="space-y-3">
        {question.options.map((option: any) => (
          <label
            key={option.id}
            className={`flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition ${
              showExplanation
                ? option.isCorrect
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
            <span className={`flex-1 ${showExplanation && option.isCorrect ? 'font-semibold' : ''}`}>
              {option.text}
            </span>
            {showExplanation && option.isCorrect && (
              <span className="text-green-600 text-xl">✓</span>
            )}
            {showExplanation && !option.isCorrect && currentAnswer === option.id && (
              <span className="text-red-600 text-xl">✗</span>
            )}
          </label>
        ))}
      </div>
    );
  }

  // Multi Choice Question (existing)
  if (questionType === 'multi_choice') {
    const currentAnswer = userAnswer || [];

    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 mb-3">(Chọn nhiều đáp án)</p>
        {question.options.map((option: any) => (
          <label
            key={option.id}
            className={`flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition ${
              showExplanation
                ? option.isCorrect
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
            <span className={`flex-1 ${showExplanation && option.isCorrect ? 'font-semibold' : ''}`}>
              {option.text}
            </span>
            {showExplanation && option.isCorrect && (
              <span className="text-green-600 text-xl">✓</span>
            )}
            {showExplanation && !option.isCorrect && currentAnswer.includes(option.id) && (
              <span className="text-red-600 text-xl">✗</span>
            )}
          </label>
        ))}
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
    const correctOrder = question.items
      .sort((a: any, b: any) => a.correctOrder - b.correctOrder)
      .map((item: any) => item.id);
    
    return (
      <OrderingQuestion
        question={question}
        selectedOrder={userAnswer || []}
        onAnswerChange={onAnswerChange}
        showExplanation={showExplanation}
        correctOrder={correctOrder}
      />
    );
  }

  // Matching Question
  if (questionType === 'matching') {
    const correctMatches: Record<string, string> = {};
    question.pairs.forEach((pair: any) => {
      correctMatches[pair.leftId] = pair.rightId;
    });
    
    return (
      <MatchingQuestion
        question={question}
        selectedMatches={userAnswer || {}}
        onAnswerChange={onAnswerChange}
        showExplanation={showExplanation}
        correctMatches={correctMatches}
      />
    );
  }

  // Fill in the Blank Question
  if (questionType === 'fill_blank') {
    const isCorrect = showExplanation 
      ? question.correctAnswers.some((answer: string) => {
          const normalizedAnswer = question.caseSensitive 
            ? answer.trim() 
            : answer.trim().toLowerCase();
          const normalizedUser = question.caseSensitive 
            ? (userAnswer || '').trim() 
            : (userAnswer || '').trim().toLowerCase();
          return normalizedAnswer === normalizedUser;
        })
      : undefined;
    
    return (
      <FillBlankQuestion
        question={question}
        selectedAnswer={userAnswer || ''}
        onAnswerChange={onAnswerChange}
        showExplanation={showExplanation}
        isCorrect={isCorrect}
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
