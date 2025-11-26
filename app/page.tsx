'use client';

// app/page.js
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch categories flat với thống kê
        const categoriesRes = await fetch('/api/categories?format=flat&includeStats=true');
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);

        // Fetch quizzes từ category đầu tiên (hoặc tất cả)
        if (categoriesData.length > 0) {
          const firstParent = categoriesData.find((cat: any) => !cat.parentId);
          if (firstParent) {
            setSelectedParentId(firstParent.id);
            const templatesRes = await fetch(`/api/categories/${firstParent.id}/quizzes?includeChildren=true`);
            const templatesData = await templatesRes.json();
            setQuizzes(templatesData.quizzes || []);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCategoryClick = async (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setLoading(true);
    
    try {
      const res = await fetch(`/api/categories/${categoryId}/quizzes?includeChildren=true`);
      const data = await res.json();
      setQuizzes(data.quizzes || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
    
    setLoading(false);
  };





  const getDifficultyBadge = (difficulty: string) => {
    const styles: Record<string, string> = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-red-100 text-red-700'
    };
    const labels: Record<string, string> = {
      easy: 'Dễ',
      medium: 'Trung bình',
      hard: 'Khó'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[difficulty] || ''}`}>
        {labels[difficulty] || difficulty}
      </span>
    );
  };

  // Get parent categories and their children
  const getParentCategories = () => {
    return categories.filter((cat: any) => !cat.parentId);
  };

  const getChildCategories = (parentId: number) => {
    return categories.filter((cat: any) => cat.parentId === parentId);
  };

  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

  const handleParentSelect = (parentId: number) => {
    setSelectedParentId(parentId);
    setSelectedCategoryId(null);
    handleCategoryClick(parentId);
  };

  const handleChildSelect = (childId: number, parentId: number) => {
    setSelectedParentId(parentId);
    setSelectedCategoryId(childId);
    handleCategoryClick(childId);
  };

  if (loading && categories.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl">Đang tải...</p>
      </div>
    );
  }

  const parentCategories = getParentCategories();
  const childCategories = selectedParentId ? getChildCategories(selectedParentId) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">📚 Hệ Thống Thi Trực Tuyến</h1>
        </div>

        {/* Parent Categories - Horizontal Scroll */}
        <div className="border-t bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="flex gap-3 overflow-x-auto py-4 scrollbar-hide">
              {parentCategories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => handleParentSelect(cat.id)}
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
                  onClick={() => selectedParentId && handleCategoryClick(selectedParentId)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition text-sm font-medium ${
                    selectedCategoryId === null
                      ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Tất cả
                </button>
                {childCategories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => handleChildSelect(cat.id, selectedParentId!)}
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
      </div>

      {/* Main Content - Quiz Cards Grid */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Đang tải bài thi...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-600 text-lg">Chưa có bài thi nào trong danh mục này</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Hiển thị <span className="font-semibold">{quizzes.length}</span> bài thi
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {quizzes.map((quiz: any) => (
                <Link
                  key={quiz.id}
                  href={`/quiz/${quiz.id}`}
                  className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-indigo-300 flex flex-col"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                      {quiz.category && (
                        <span className="text-2xl">{quiz.category.icon}</span>
                      )}
                      {getDifficultyBadge(quiz.difficulty)}
                    </div>
                    <h3 className="font-bold text-base line-clamp-2 min-h-[2.5rem] group-hover:text-indigo-100 transition">
                      {quiz.name}
                    </h3>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col">
                    {quiz.description && (
                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-xs text-gray-600 mt-auto">
                      <div className="flex items-center gap-2">
                        <span>⏱️</span>
                        <span>{quiz.durationMinutes} phút</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📝</span>
                        <span>{quiz.maxAttempts === 0 ? 'Không giới hạn' : `${quiz.maxAttempts} lần`}</span>
                      </div>
                      {quiz.passingScore > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🎯</span>
                          <span>Điểm đạt: {quiz.passingScore}%</span>
                        </div>
                      )}
                    </div>

                    {quiz.tags && quiz.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {quiz.tags.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                        {quiz.tags.length > 2 && (
                          <span className="text-gray-400 text-xs px-1">+{quiz.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 pb-4">
                    <div className="bg-indigo-600 text-white text-center py-2 rounded-lg font-medium text-sm group-hover:bg-indigo-700 transition">
                      Bắt Đầu Thi →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}