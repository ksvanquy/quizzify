'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Header } from './components/home/Header';
import { CategoryNav } from './components/home/CategoryNav';
import { QuizCard } from './components/home/QuizCard';
import { useToast } from './components/home/Toast';

export default function HomePage() {
  // IMPORTANT: useAuth must be called first, before any other hooks
  const { user, isBookmarked, addBookmark, removeBookmark, isInWatchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  const router = useRouter();
  const { toasts, showToast } = useToast();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [userAttempts, setUserAttempts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch categories flat với thống kê
        const categoriesRes = await fetch('/api/categories?format=flat&includeStats=true');
        const categoriesResponse = await categoriesRes.json();
        const categoriesData = categoriesResponse.data?.categories || [];
        setCategories(categoriesData);

        // Fetch all quizzes initially (show all)
        if (categoriesData.length > 0) {
          const allQuizzesRes = await fetch('/api/quizzes?status=active');
          if (allQuizzesRes.ok) {
            const allQuizzesData = await allQuizzesRes.json();
            setQuizzes(allQuizzesData?.data?.quizzes || []);
          }
          // Don't select any parent initially to show "Tất cả"
          setSelectedParentId(null);
        }
        
        // Fetch user attempts nếu đã đăng nhập
        if (user) {
          try {
            const attemptsRes = await fetch('/api/user/attempts', {
              credentials: "include"
            });
            if (attemptsRes.ok) {
              const attemptsData = await attemptsRes.json();
              setUserAttempts(attemptsData);
            }
          } catch (err) {
            console.error('Error fetching attempts:', err);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleCategoryClick = async (categoryId: string) => {
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

  const handleBookmarkToggle = async (e: React.MouseEvent, quizId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      if (isBookmarked(quizId)) {
        await removeBookmark(quizId);
        showToast('Đã xóa khỏi bookmark', 'success');
      } else {
        await addBookmark(quizId);
        showToast('Đã thêm vào bookmark', 'success');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      showToast('Có lỗi xảy ra', 'error');
    }
  };

  const handleWatchlistToggle = async (e: React.MouseEvent, quizId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      if (isInWatchlist(quizId)) {
        await removeFromWatchlist(quizId);
        showToast('Đã xóa khỏi watchlist', 'success');
      } else {
        await addToWatchlist(quizId);
        showToast('Đã thêm vào watchlist', 'success');
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      showToast('Có lỗi xảy ra', 'error');
    }
  };

  const getUserAttemptInfo = (templateId: number) => {
    return userAttempts.find((a: any) => a.templateId === templateId);
  };

  const canAttemptQuiz = (quiz: any) => {
    if (quiz.maxAttempts === 0) return { canAttempt: true };
    
    const attemptInfo = getUserAttemptInfo(quiz.id);
    if (!attemptInfo) return { canAttempt: true };
    
    const canAttempt = attemptInfo.completedCount < quiz.maxAttempts;
    return {
      canAttempt,
      completedCount: attemptInfo.completedCount,
      maxAttempts: quiz.maxAttempts,
      bestScore: attemptInfo.bestScore
    };
  };

  // Get parent categories and their children
  const getParentCategories = () => {
    return categories.filter((cat: any) => !cat.parentId);
  };

  const getChildCategories = (parentId: string | number) => {
    // Find parent category by ID (ObjectId string)
    const parent = categories.find((cat: any) => cat.id === parentId);
    if (!parent) return [];
    
    // Match children by displayOrder (legacy ID)
    return categories.filter((cat: any) => cat.parentId === parent.displayOrder);
  };

  const handleParentSelect = (parentId: string) => {
    setSelectedParentId(parentId);
    setSelectedCategoryId(null);
    handleCategoryClick(parentId);
  };

  const handleShowAll = async () => {
    setSelectedParentId(null);
    setSelectedCategoryId(null);
    setLoading(true);
    
    try {
      const res = await fetch('/api/quizzes?status=active');
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data?.data?.quizzes || []);
      }
    } catch (error) {
      console.error('Error fetching all quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChildSelect = (childId: string, parentId: string) => {
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
      {/* Header Component */}
      <Header />

      {/* Category Navigation Component */}
      <CategoryNav
        parentCategories={parentCategories}
        selectedParentId={selectedParentId}
        selectedCategoryId={selectedCategoryId}
        childCategories={childCategories}
        onParentSelect={handleParentSelect}
        onChildSelect={handleChildSelect}
        onShowAll={handleShowAll}
        totalQuizCount={categories.reduce((sum, cat) => sum + (cat.quizCount || 0), 0)}
      />

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
              {quizzes.map((quiz: any) => {
                const attemptStatus = user ? canAttemptQuiz(quiz) : { canAttempt: true };
                const attemptInfo = user ? getUserAttemptInfo(quiz.id) : null;
                
                return (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    attemptStatus={attemptStatus}
                    attemptInfo={attemptInfo}
                    isBookmarked={isBookmarked(quiz.id)}
                    isInWatchlist={isInWatchlist(quiz.id)}
                    onBookmarkToggle={handleBookmarkToggle}
                    onWatchlistToggle={handleWatchlistToggle}
                    user={user}
                  />
                );
              })}
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
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 animate-slide-up ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
