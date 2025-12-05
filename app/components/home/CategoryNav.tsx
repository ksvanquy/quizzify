'use client';

interface Category {
  id: string;
  displayOrder?: number;
  name: string;
  icon: string;
  quizCount?: number;
  parentId?: string;
}

interface CategoryNavProps {
  parentCategories: Category[];
  selectedParentId: string | null;
  selectedCategoryId: string | null;
  childCategories: Category[];
  onParentSelect: (parentId: string) => void;
  onChildSelect: (childId: string, parentId: string) => void;
  onShowAll: () => void;
  totalQuizCount: number;
}

export function CategoryNav({
  parentCategories,
  selectedParentId,
  selectedCategoryId,
  childCategories,
  onParentSelect,
  onChildSelect,
  onShowAll,
  totalQuizCount
}: CategoryNavProps) {
  return (
    <>
      {/* Parent Categories - Horizontal Scroll */}
      <div className="border-t bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto py-4 scrollbar-hide">
            {/* Tất cả button */}
            <button
              onClick={onShowAll}
              className={`flex items-center gap-2 px-6 py-3 rounded-full whitespace-nowrap transition font-medium ${
                selectedParentId === null
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-200'
              }`}
            >
              <span className="text-xl">🎯</span>
              <span>Tất cả</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                selectedParentId === null ? 'bg-indigo-500' : 'bg-gray-100 text-gray-600'
              }`}>
                {totalQuizCount}
              </span>
            </button>
            {parentCategories.map((cat: Category) => (
              <button
                key={cat.id}
                onClick={() => onParentSelect(cat.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full whitespace-nowrap transition font-medium ${
                  selectedParentId === cat.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-200'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span>{cat.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  selectedParentId === cat.id ? 'bg-indigo-500' : 'bg-gray-100 text-gray-600'
                }`}>
                  {cat.quizCount || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub Categories - Horizontal Scroll */}
      {childCategories.length > 0 && (
        <div className="border-t bg-white">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
              <button
                onClick={() => selectedParentId && onChildSelect('', selectedParentId)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition text-sm font-medium ${
                  selectedCategoryId === null
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tất cả
              </button>
              {childCategories.map((cat: Category) => (
                <button
                  key={cat.id}
                  onClick={() => onChildSelect(cat.id, selectedParentId!)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition text-sm font-medium ${
                    selectedCategoryId === cat.id
                      ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span className="bg-white px-1.5 py-0.5 rounded text-xs">
                    {cat.quizCount || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
