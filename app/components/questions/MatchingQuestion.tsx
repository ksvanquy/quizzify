'use client';

import React, { useState, useEffect } from 'react';

interface MatchPair {
  id: string;
  left: string;
  right: string;
  leftId: string;
  rightId: string;
}

interface MatchingQuestionProps {
  question: {
    id: number;
    text: string;
    pairs: MatchPair[];
    explanation?: string;
    shuffleOptions?: boolean;
  };
  selectedMatches: Record<string, string>;
  onAnswerChange: (matches: Record<string, string>) => void;
  showExplanation?: boolean;
  correctMatches?: Record<string, string>;
}

export default function MatchingQuestion({
  question,
  selectedMatches,
  onAnswerChange,
  showExplanation = false,
  correctMatches
}: MatchingQuestionProps) {
  const [leftItems, setLeftItems] = useState<Array<{ id: string; text: string }>>([]);
  const [rightItems, setRightItems] = useState<Array<{ id: string; text: string }>>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    const left = question.pairs.map(p => ({ id: p.leftId, text: p.left }));
    const right = question.pairs.map(p => ({ id: p.rightId, text: p.right }));

    setLeftItems(left);
    setRightItems(question.shuffleOptions 
      ? [...right].sort(() => Math.random() - 0.5)
      : right
    );
  }, [question.pairs, question.shuffleOptions]);

  const handleDragStart = (e: React.DragEvent, rightId: string) => {
    setDraggedItem(rightId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, leftId: string) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    const newMatches = { ...selectedMatches };
    
    // Remove old match of draggedItem
    Object.keys(newMatches).forEach(key => {
      if (newMatches[key] === draggedItem) {
        delete newMatches[key];
      }
    });

    // Add new match
    newMatches[leftId] = draggedItem;

    onAnswerChange(newMatches);
    setDraggedItem(null);
  };

  const handleRemoveMatch = (leftId: string) => {
    const newMatches = { ...selectedMatches };
    delete newMatches[leftId];
    onAnswerChange(newMatches);
  };

  const isCorrectMatch = (leftId: string) => {
    if (!correctMatches) return null;
    return selectedMatches[leftId] === correctMatches[leftId];
  };

  const getMatchedRightItem = (leftId: string) => {
    const rightId = selectedMatches[leftId];
    return rightItems.find(item => item.id === rightId);
  };

  const getUnmatchedRightItems = () => {
    const matchedIds = Object.values(selectedMatches);
    return rightItems.filter(item => !matchedIds.includes(item.id));
  };

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-purple-800">
          🔗 Kéo các mục bên phải vào ô tương ứng bên trái
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 mb-2">Khái niệm</h4>
          {leftItems.map((leftItem) => {
            const matchedRight = getMatchedRightItem(leftItem.id);
            const correct = showExplanation ? isCorrectMatch(leftItem.id) : null;

            return (
              <div
                key={leftItem.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, leftItem.id)}
                className={`p-4 rounded-lg border-2 transition ${
                  showExplanation
                    ? correct
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-800 mb-2">
                  {leftItem.text}
                </div>
                
                {matchedRight ? (
                  <div className={`flex items-center justify-between p-2 rounded border ${
                    showExplanation
                      ? correct
                        ? 'bg-green-100 border-green-300'
                        : 'bg-red-100 border-red-300'
                      : 'bg-indigo-100 border-indigo-300'
                  }`}>
                    <span className="text-sm">{matchedRight.text}</span>
                    {!showExplanation && (
                      <button
                        onClick={() => handleRemoveMatch(leftItem.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ✕
                      </button>
                    )}
                    {showExplanation && (
                      <span className="text-lg ml-2">
                        {correct ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-2 border-2 border-dashed border-gray-300 rounded text-center text-gray-400 text-sm">
                    Kéo đáp án vào đây
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700 mb-2">Định nghĩa</h4>
          {getUnmatchedRightItems().map((rightItem) => (
            <div
              key={rightItem.id}
              draggable={!showExplanation}
              onDragStart={(e) => handleDragStart(e, rightItem.id)}
              className={`p-4 rounded-lg border-2 transition ${
                draggedItem === rightItem.id
                  ? 'opacity-50 border-indigo-400'
                  : 'border-indigo-300 bg-white hover:border-indigo-500 cursor-move'
              }`}
            >
              <div className="text-gray-800">{rightItem.text}</div>
            </div>
          ))}
          {getUnmatchedRightItems().length === 0 && (
            <div className="p-4 text-center text-gray-400 text-sm">
              Tất cả đã được nối
            </div>
          )}
        </div>
      </div>

      {showExplanation && question.explanation && (
        <div className="p-4 rounded-lg bg-purple-50 border-l-4 border-purple-500 mt-4">
          <div className="flex items-start gap-2">
            <span className="text-xl">💡</span>
            <div>
              <p className="font-semibold mb-1">Giải thích</p>
              <p className="text-sm text-gray-700">{question.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
