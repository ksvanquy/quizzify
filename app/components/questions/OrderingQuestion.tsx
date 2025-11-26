'use client';

import React, { useState, useEffect } from 'react';

interface OrderItem {
  id: string;
  text: string;
  correctOrder: number;
}

interface OrderingQuestionProps {
  question: {
    id: number;
    text: string;
    items: OrderItem[];
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
  const [items, setItems] = useState<OrderItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    // Shuffle items if needed
    const sortedItems = question.shuffleOptions
      ? [...question.items].sort(() => Math.random() - 0.5)
      : [...question.items];
    
    setItems(sortedItems);
    
    // Initialize selected order if empty
    if (selectedOrder.length === 0) {
      onAnswerChange(sortedItems.map(item => item.id));
    }
  }, [question.items, question.shuffleOptions]);

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

  const orderedItems = selectedOrder
    .map(id => items.find(item => item.id === id))
    .filter(Boolean) as OrderItem[];

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          ⇅ Kéo thả để sắp xếp các mục theo đúng thứ tự
        </p>
      </div>

      <div className="space-y-2">
        {orderedItems.map((item, index) => {
          const correctPosition = showExplanation ? isCorrectPosition(item.id) : null;
          
          return (
            <div
              key={item.id}
              draggable={!showExplanation}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition cursor-move ${
                draggedItem === item.id
                  ? 'opacity-50 border-indigo-400'
                  : showExplanation
                  ? correctPosition
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-indigo-300 bg-white'
              }`}
            >
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
                <p className="text-gray-800">{item.text}</p>
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
