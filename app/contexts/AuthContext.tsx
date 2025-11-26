'use client';

// app/contexts/AuthContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  bio?: string;
  phone?: string;
  address?: string;
  bookmarks: number[];
  watchlist: number[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  addBookmark: (quizId: number) => Promise<void>;
  removeBookmark: (quizId: number) => Promise<void>;
  addToWatchlist: (quizId: number) => Promise<void>;
  removeFromWatchlist: (quizId: number) => Promise<void>;
  isBookmarked: (quizId: number) => boolean;
  isInWatchlist: (quizId: number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (data.user) {
        // Load bookmarks and watchlist from separate files
        const [bookmarksRes, watchlistRes] = await Promise.all([
          fetch('/api/bookmarks'),
          fetch('/api/watchlist')
        ]);
        
        const bookmarksData = await bookmarksRes.json();
        const watchlistData = await watchlistRes.json();
        
        const bookmarkIds = bookmarksData.bookmarks?.map((b: any) => b.quizId) || [];
        const watchlistIds = watchlistData.watchlist?.map((w: any) => w.quizId) || [];
        
        setUser({
          ...data.user,
          bookmarks: bookmarkIds,
          watchlist: watchlistIds
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Đăng nhập thất bại');
    }

    // Load bookmarks and watchlist after login
    const [bookmarksRes, watchlistRes] = await Promise.all([
      fetch('/api/bookmarks'),
      fetch('/api/watchlist')
    ]);
    
    const bookmarksData = await bookmarksRes.json();
    const watchlistData = await watchlistRes.json();
    
    const bookmarkIds = bookmarksData.bookmarks?.map((b: any) => b.quizId) || [];
    const watchlistIds = watchlistData.watchlist?.map((w: any) => w.quizId) || [];
    
    setUser({
      ...data.user,
      bookmarks: bookmarkIds,
      watchlist: watchlistIds
    });
  };

  const register = async (username: string, email: string, password: string, name: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, name })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Đăng ký thất bại');
    }

    // New user won't have bookmarks/watchlist yet
    setUser({
      ...data.user,
      bookmarks: [],
      watchlist: []
    });
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Cập nhật thất bại');
    }

    setUser(data.user);
  };

  const addBookmark = async (quizId: number) => {
    const response = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId })
    });

    if (response.ok && user) {
      // Refresh bookmarks from server
      const bookmarksRes = await fetch('/api/bookmarks');
      const bookmarksData = await bookmarksRes.json();
      const bookmarkIds = bookmarksData.bookmarks.map((b: any) => b.quizId);
      setUser({ ...user, bookmarks: bookmarkIds });
    }
  };

  const removeBookmark = async (quizId: number) => {
    const response = await fetch(`/api/bookmarks?quizId=${quizId}`, {
      method: 'DELETE'
    });

    if (response.ok && user) {
      // Refresh bookmarks from server
      const bookmarksRes = await fetch('/api/bookmarks');
      const bookmarksData = await bookmarksRes.json();
      const bookmarkIds = bookmarksData.bookmarks.map((b: any) => b.quizId);
      setUser({ ...user, bookmarks: bookmarkIds });
    }
  };

  const addToWatchlist = async (quizId: number) => {
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId })
    });

    if (response.ok && user) {
      // Refresh watchlist from server
      const watchlistRes = await fetch('/api/watchlist');
      const watchlistData = await watchlistRes.json();
      const watchlistIds = watchlistData.watchlist.map((w: any) => w.quizId);
      setUser({ ...user, watchlist: watchlistIds });
    }
  };

  const removeFromWatchlist = async (quizId: number) => {
    const response = await fetch(`/api/watchlist?quizId=${quizId}`, {
      method: 'DELETE'
    });

    if (response.ok && user) {
      // Refresh watchlist from server
      const watchlistRes = await fetch('/api/watchlist');
      const watchlistData = await watchlistRes.json();
      const watchlistIds = watchlistData.watchlist.map((w: any) => w.quizId);
      setUser({ ...user, watchlist: watchlistIds });
    }
  };

  const isBookmarked = (quizId: number) => {
    return user?.bookmarks.includes(quizId) || false;
  };

  const isInWatchlist = (quizId: number) => {
    return user?.watchlist.includes(quizId) || false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      addBookmark,
      removeBookmark,
      addToWatchlist,
      removeFromWatchlist,
      isBookmarked,
      isInWatchlist
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
