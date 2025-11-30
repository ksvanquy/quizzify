'use client';

// app/profile/page.tsx

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading, logout, updateProfile, removeBookmark, removeFromWatchlist } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    phone: '',
    address: ''
  });
  const [activeTab, setActiveTab] = useState<'info' | 'bookmarks' | 'watchlist' | 'history'>('info');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      setFormData({
        name: user.name,
        bio: user.bio || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      // Use internal proxy `/api/profile` so requests stay same-origin.
      // If we have an accessToken, send it in Authorization header; otherwise
      // rely on cookies (browser will include same-origin cookies or we set credentials).
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const opts: RequestInit = { method: 'GET', cache: 'no-store' };
      if (accessToken) {
        opts.headers = { Authorization: `Bearer ${accessToken}` } as any;
      } else {
        // include cookies for cookie-based session validation
        opts.credentials = 'include';
      }

      const res = await fetch('/api/profile', opts);
      if (!res.ok) {
        setProfileData(null);
        return;
      }

      const json = await res.json();
      setProfileData(json?.data?.user || json?.data || json?.user || json);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setIsEditing(false);
      fetchProfile();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRemoveBookmark = async (quizId: number) => {
    try {
      await removeBookmark(quizId);
      showToast('Đã xóa khỏi bookmark', 'success');
      fetchProfile(); // Refresh data
    } catch (error) {
      console.error('Error removing bookmark:', error);
      showToast('Có lỗi xảy ra', 'error');
    }
  };

  const handleRemoveFromWatchlist = async (quizId: number) => {
    try {
      await removeFromWatchlist(quizId);
      showToast('Đã xóa khỏi watchlist', 'success');
      fetchProfile(); // Refresh data
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      showToast('Có lỗi xảy ra', 'error');
    }
  };

  if (loading || !user || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
            ← Quay lại trang chủ
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - User Info */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="text-center">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-indigo-100"
                />
                <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                <p className="text-gray-500 text-sm">@{user.username}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                  {user.role === 'admin' ? 'Quản trị viên' : 'Học viên'}
                </span>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <span>📧</span>
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📱</span>
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📍</span>
                    <span>{user.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-indigo-600">{profileData.completedCount}</div>
                  <div className="text-xs text-gray-500">Đã hoàn thành</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{profileData.attemptsCount}</div>
                  <div className="text-xs text-gray-500">Tổng lượt thi</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="col-span-12 lg:col-span-8">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="flex border-b overflow-x-auto">
                {[
                  { key: 'info', label: '📋 Thông tin', count: null },
                  { key: 'bookmarks', label: '🔖 Bookmarks', count: user.bookmarks?.length || 0 },
                  { key: 'watchlist', label: '👁️ Watchlist', count: user.watchlist?.length || 0 },
                  { key: 'history', label: '📚 Lịch sử', count: profileData.attemptsCount || 0 }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-4 font-medium transition whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'border-b-2 border-indigo-600 text-indigo-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== null && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'info' && (
                  <div>
                    {!isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Giới thiệu</label>
                          <p className="mt-1 text-gray-800">{user.bio || 'Chưa có thông tin'}</p>
                        </div>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                          Chỉnh sửa thông tin
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Họ và tên
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Giới thiệu
                          </label>
                          <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số điện thoại
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Địa chỉ
                          </label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                          >
                            Lưu thay đổi
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                          >
                            Hủy
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {activeTab === 'bookmarks' && (
                  <div>
                    {(!profileData.bookmarkedQuizzes || profileData.bookmarkedQuizzes.length === 0) ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔖</div>
                        <p className="text-gray-500">Chưa có bookmark nào</p>
                        <Link
                          href="/"
                          className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                          Khám phá bài thi
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {profileData.bookmarkedQuizzes.map((quiz: any) => (
                          <div
                            key={quiz.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                          >
                            <Link href={`/quiz/${quiz.id}`} className="flex-1">
                              <h3 className="font-semibold text-gray-800 hover:text-indigo-600">
                                {quiz.name}
                              </h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span>⏱️ {quiz.durationMinutes} phút</span>
                                {quiz.difficulty && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    quiz.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                    quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {quiz.difficulty === 'easy' ? 'Dễ' : 
                                     quiz.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                                  </span>
                                )}
                              </div>
                            </Link>
                            <button
                              onClick={() => handleRemoveBookmark(quiz.id)}
                              className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Xóa bookmark"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'watchlist' && (
                  <div>
                    {(!profileData.watchlistedQuizzes || profileData.watchlistedQuizzes.length === 0) ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">👁️</div>
                        <p className="text-gray-500">Chưa có trong watchlist</p>
                        <Link
                          href="/"
                          className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                          Khám phá bài thi
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {profileData.watchlistedQuizzes.map((quiz: any) => (
                          <div
                            key={quiz.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                          >
                            <Link href={`/quiz/${quiz.id}`} className="flex-1">
                              <h3 className="font-semibold text-gray-800 hover:text-indigo-600">
                                {quiz.name}
                              </h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span>⏱️ {quiz.durationMinutes} phút</span>
                                {quiz.difficulty && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    quiz.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                    quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {quiz.difficulty === 'easy' ? 'Dễ' : 
                                     quiz.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                                  </span>
                                )}
                              </div>
                            </Link>
                            <button
                              onClick={() => handleRemoveFromWatchlist(quiz.id)}
                              className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Xóa khỏi watchlist"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div>
                    <p className="text-center text-gray-500 py-8">
                      Lịch sử thi sẽ được hiển thị ở đây
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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

      <style jsx global>{`
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
    </div>
  );
}
