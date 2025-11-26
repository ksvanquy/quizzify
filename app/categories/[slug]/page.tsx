'use client';

// app/categories/[slug]/page.js

import Link from 'next/link';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const [category, setCategory] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  useEffect(() => {
    async function fetchCategoryBySlug() {
      try {
        // Fetch all categories để tìm category theo slug
        const categoriesRes = await fetch('/api/categories?format=flat');
        const categoriesData = await categoriesRes.json();
        
        const foundCategory = categoriesData.find((cat: any) => cat.slug === unwrappedParams.slug);
        
        if (!foundCategory) {
          router.push('/');
          return;
        }
        
        setCategory(foundCategory);
        
        // Fetch quizzes cho category này
        await fetchQuizzes(foundCategory.id, selectedDifficulty, sortBy);
        
      } catch (error) {
        console.error('Error fetching category:', error);
        setLoading(false);
      }
    }
    
    fetchCategoryBySlug();
  }, [unwrappedParams.slug, router]);

  const fetchQuizzes = async (categoryId: number, difficulty: string, sort: string) => {
    setLoading(true);
    try {
      let url = `/api/categories/${categoryId}/quizzes?includeChildren=true&sortBy=${sort}`;
      if (difficulty !== 'all') {
        url += `&difficulty=${difficulty}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      setQuizzes(data.quizzes || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
    setLoading(false);
  };

  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    if (category) {
      fetchQuizzes(category.id, difficulty, sortBy);
    }
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    if (category) {
      fetchQuizzes(category.id, selectedDifficulty, sort);
    }
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

  if (loading && !category) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl">Đang tải...</p>
      </div>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/" className="text-indigo-600 hover:text-indigo-800">
          ← Quay lại trang chủ
        </Link>
      </div>

      {/* Category Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-8 rounded-lg shadow-lg mb-6">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">{category.icon}</span>
          <div>
            <h1 className="text-3xl font-bold">{category.name}</h1>
            {category.description && (
              <p className="text-indigo-100 mt-2">{category.description}</p>
            )}
          </div>
        </div>
        <div className="text-indigo-100">
          <span className="font-semibold">{quizzes.length}</span> bài thi có sẵn
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700">Độ khó:</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => handleDifficultyChange(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700">Sắp xếp:</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="name">Tên</option>
              <option value="duration">Thời gian</option>
              <option value="difficulty">Độ khó</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quizzes List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Đang tải bài thi...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">Chưa có bài thi nào phù hợp với bộ lọc</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="p-6 border rounded-lg shadow-md hover:shadow-lg transition duration-200 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {quiz.category && (
                      <span className="text-xl">{quiz.category.icon}</span>
                    )}
                    <h2 className="text-xl font-semibold text-indigo-700">{quiz.name}</h2>
                  </div>
                  {quiz.description && (
                    <p className="text-gray-600 text-sm mb-3">{quiz.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600 mb-2">
                    {getDifficultyBadge(quiz.difficulty)}
                    <span>⏱️ {quiz.durationMinutes} phút</span>
                    <span>📝 {quiz.maxAttempts === 0 ? 'Không giới hạn' : `${quiz.maxAttempts} lần`}</span>
                    {quiz.passingScore > 0 && (
                      <span>🎯 Điểm đạt: {quiz.passingScore}%</span>
                    )}
                  </div>
                  {quiz.tags && quiz.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {quiz.tags.map((tag: string) => (
                        <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <Link 
                    href={`/quiz/${quiz.id}`} 
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition whitespace-nowrap font-medium"
                  >
                    Bắt Đầu Thi →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
