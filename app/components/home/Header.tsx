'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { LogoutButton } from './LogoutButton';

interface HeaderProps {
  onUserMenuToggle?: (isOpen: boolean) => void;
}

export function Header({ onUserMenuToggle }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleMenuToggle = (isOpen: boolean) => {
    setShowUserMenu(isOpen);
    onUserMenuToggle?.(isOpen);
  };

  return (
    <div className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">📚 Hệ Thống Thi Trực Tuyến</h1>
        
        {/* User Menu */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => handleMenuToggle(!showUserMenu)}
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
    </div>
  );
}
