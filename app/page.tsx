'use client';

// app/page.js
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  // IMPORTANT: useAuth must be called first, before any other hooks
  const { user, isBookmarked, addBookmark, removeBookmark, isInWatchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  const router = useRouter();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [userAttempts, setUserAttempts] = useState<any[]>([]);

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
        
        // Fetch user attempts nếu đã đăng nhập
        if (user) {
          try {
            const attemptsRes = await fetch('/api/user/attempts');
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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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

  const getChildCategories = (parentId: number) => {
    return categories.filter((cat: any) => cat.parentId === parentId);
  };

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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">📚 Hệ Thống Thi Trực Tuyến</h1>
          
          {/* User Menu */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border-2 border-indigo-200"
                  />
                  <span className="font-medium text-gray-700 hidden sm:block">{user.name}</span>
                  <span className="text-gray-400">▼</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-2 z-20">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition"
                    >
                      <span>👤</span>
                      <span>Trang cá nhân</span>
                    </Link>
                    <Link
                      href="/profile?tab=bookmarks"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition"
                    >
                      <span>🔖</span>
                      <span>Bookmarks ({user.bookmarks?.length || 0})</span>
                    </Link>
                    <Link
                      href="/profile?tab=watchlist"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition"
                    >
                      <span>👁️</span>
                      <span>Watchlist ({user.watchlist?.length || 0})</span>
                    </Link>
                    <hr className="my-2" />
                    <LogoutButton />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    router.push('/auth/login');
                  }}
                  className="px-6 py-2 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => {
                    router.push('/auth/register');
                  }}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Đăng ký
                </button>
              </div>
            )}
          </div>
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
              {quizzes.map((quiz: any) => {
                const attemptStatus = user ? canAttemptQuiz(quiz) : { canAttempt: true };
                const attemptInfo = user ? getUserAttemptInfo(quiz.id) : null;
                
                return (
                <Link
                  key={quiz.id}
                  href={attemptStatus.canAttempt ? `/quiz/${quiz.id}` : '#'}
                  onClick={(e) => {
                    if (!attemptStatus.canAttempt) {
                      e.preventDefault();
                      alert(`Bạn đã hết số lần làm bài cho bài thi này. Đã làm: ${attemptStatus.completedCount}/${attemptStatus.maxAttempts} lần.`);
                    }
                  }}
                  className={`group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border flex flex-col ${
                    attemptStatus.canAttempt 
                      ? 'border-gray-200 hover:border-indigo-300' 
                      : 'border-red-200 opacity-75 cursor-not-allowed'
                  }`}
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {quiz.category && (
                          <span className="text-2xl">{quiz.category.icon}</span>
                        )}
                        {getDifficultyBadge(quiz.difficulty)}
                      </div>
                      
                      {/* Bookmark & Watchlist Icons */}
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => handleBookmarkToggle(e, quiz.id)}
                          className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition backdrop-blur-sm"
                          title={isBookmarked(quiz.id) ? 'Xóa bookmark' : 'Thêm bookmark'}
                        >
                          {isBookmarked(quiz.id) ? (
                            <svg className="w-4 h-4 fill-yellow-300" viewBox="0 0 20 20">
                              <path d="M10 2l2.5 6.5L19 9l-5 4.5L15 20l-5-3.5L5 20l1-6.5L1 9l6.5-.5L10 2z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 stroke-white fill-none" viewBox="0 0 20 20" strokeWidth="2">
                              <path d="M10 2l2.5 6.5L19 9l-5 4.5L15 20l-5-3.5L5 20l1-6.5L1 9l6.5-.5L10 2z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={(e) => handleWatchlistToggle(e, quiz.id)}
                          className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition backdrop-blur-sm"
                          title={isInWatchlist(quiz.id) ? 'Xóa khỏi watchlist' : 'Thêm vào watchlist'}
                        >
                          {isInWatchlist(quiz.id) ? (
                            <svg className="w-4 h-4 fill-red-400" viewBox="0 0 20 20">
                              <path d="M10 18l-1.45-1.32C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0c1.74 0 3.41.81 4.5 2.09C11.09.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.18L10 18z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 stroke-white fill-none" viewBox="0 0 20 20" strokeWidth="2">
                              <path d="M10 18l-1.45-1.32C3.4 12.36 0 9.28 0 5.5 0 2.42 2.42 0 5.5 0c1.74 0 3.41.81 4.5 2.09C11.09.81 12.76 0 14.5 0 17.58 0 20 2.42 20 5.5c0 3.78-3.4 6.86-8.55 11.18L10 18z" />
                            </svg>
                          )}
                        </button>
                      </div>
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
                      
                      {/* User attempt status */}
                      {user && attemptInfo && (
                        <>
                          <div className="flex items-center gap-2">
                            <span>✅</span>
                            <span>Đã làm: {attemptInfo.completedCount}{quiz.maxAttempts > 0 ? `/${quiz.maxAttempts}` : ''} lần</span>
                          </div>
                          {attemptInfo.bestScore > 0 && (
                            <div className="flex items-center gap-2">
                              <span>⭐</span>
                              <span>Điểm cao nhất: {attemptInfo.bestScore}%</span>
                            </div>
                          )}
                        </>
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
                    {attemptStatus.canAttempt ? (
                      <div className="bg-indigo-600 text-white text-center py-2 rounded-lg font-medium text-sm group-hover:bg-indigo-700 transition">
                        Bắt Đầu Thi →
                      </div>
                    ) : (
                      <div className="bg-red-500 text-white text-center py-2 rounded-lg font-medium text-sm cursor-not-allowed">
                        ❌ Đã hết lượt
                      </div>
                    )}
                  </div>
                </Link>
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

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 animate-slide-up ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
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
      )}
    </div>
  );
}

// Logout Button Component
function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 transition w-full text-left"
    >
      <span>🚪</span>
      <span>Đăng xuất</span>
    </button>
  );
}