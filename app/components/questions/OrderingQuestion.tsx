'use client';

import React, { useState, useEffect } from 'react';

interface OrderingQuestionProps {
  question: {
    id: number;
    text: string;
    items: string[]; // Array of strings from API
    explanation?: string;
    shuffleOptions?: boolean;
  };
  selectedOrder: string[];
  onAnswerChange: (order: string[]) => void;
  showExplanation?: boolean;
  correctOrder?: string[];
}

export default function OrderingQuestion({
  question,
  selectedOrder,
  onAnswerChange,
  showExplanation = false,
  correctOrder
}: OrderingQuestionProps) {
  const [items, setItems] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    // Use items directly from question (already shuffled by API if needed)
    const itemsList = question.items || [];
    setItems(itemsList);
    
    // Initialize selected order if empty
    if (selectedOrder.length === 0 && itemsList.length > 0) {
      onAnswerChange([...itemsList]);
    }
  }, [question.items]);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) return;

    const newOrder = [...selectedOrder];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(targetId);

    // Swap items
    newOrder[draggedIndex] = targetId;
    newOrder[targetIndex] = draggedItem;

    onAnswerChange(newOrder);
    setDraggedItem(null);
  };

  const getItemPosition = (itemId: string) => {
    return selectedOrder.indexOf(itemId) + 1;
  };

  const isCorrectPosition = (itemId: string) => {
    if (!correctOrder) return null;
    const currentIndex = selectedOrder.indexOf(itemId);
    const correctIndex = correctOrder.indexOf(itemId);
    return currentIndex === correctIndex;
  };

  const orderedItems = selectedOrder.filter(item => items.includes(item));

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          ⇅ Kéo thả để sắp xếp các mục theo đúng thứ tự
        </p>
      </div>

      <div className="space-y-2">
        {orderedItems.map((item, index) => {
          const correctPosition = showExplanation ? isCorrectPosition(item) : null;
          
          return (
            <div
              key={`${question.id}-${item}-${index}`}
              draggable={!showExplanation}
              onDragStart={(e) => handleDragStart(e, item)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item)}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition cursor-move ${
                draggedItem === item
                  ? 'opacity-50 border-indigo-400'
                  : showExplanation
                  ? correctPosition
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-indigo-300 bg-white'
              }`}
            >
              {!showExplanation && (
                <div className="flex-shrink-0 mr-2 text-gray-400 cursor-move">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                  </svg>
                </div>
              )}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                showExplanation
                  ? correctPosition
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                  : 'bg-indigo-100 text-indigo-700'
              }`}>
                {index + 1}
              </div>
              
              <div className="flex-1">
                <p className="text-gray-800">{item}</p>
              </div>

              {showExplanation && (
                <span className="text-xl">
                  {correctPosition ? '✓' : '✗'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {showExplanation && question.explanation && (
        <div className="p-4 rounded-lg bg-blue-50 border-l-4 border-blue-500">
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
