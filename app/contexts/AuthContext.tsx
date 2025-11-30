'use client';

// app/contexts/AuthContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as authApi from '../lib/auth';
import { API_URL } from '../lib/api';

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
  bookmarks: string[];
  watchlist: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  addBookmark: (quizId: string | number) => Promise<void>;
  removeBookmark: (quizId: string | number) => Promise<void>;
  addToWatchlist: (quizId: string | number) => Promise<void>;
  removeFromWatchlist: (quizId: string | number) => Promise<void>;
  isBookmarked: (quizId: string | number) => boolean;
  isInWatchlist: (quizId: string | number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    // If we have a cached user in localStorage, restore it immediately
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser({ ...parsed, bookmarks: parsed.bookmarks || [], watchlist: parsed.watchlist || [] });
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    // Then validate/refresh session from server (only token-based by default)
    // We avoid doing a cookie-based GET to /auth/profile automatically on mount
    // because that can trigger 401/404 noise when the user is not logged in.
    checkSession();
  }, []);

  // If `forceCookie` is true the function will try a cookie-based profile probe.
  // By default we only attempt token-based profile lookups to avoid unnecessary
  // unauthenticated requests to the backend on initial load.
  const checkSession = async (forceCookie: boolean = false) => {
    try {
      // Try token-based profile first
      let profileData: any = null;

      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      if (accessToken) {
        try {
          const p = await authApi.getProfile(accessToken);
          // support ApiResponse<UserDto> where data is user OR data.user
          profileData = p?.data?.user || p?.data || p?.user || null;
        } catch (err) {
          console.warn('getProfile with token failed', err);
        }
      }

      // If no profile from token, optionally try cookie-based profile endpoint.
      // This is only performed when `forceCookie` is true to avoid creating
      // unnecessary unauthenticated requests on initial page load.
      if (!profileData && forceCookie) {
        try {
          const res = await fetch(`${API_URL}/auth/profile`, { credentials: 'include' });
          if (res.ok) {
            const json = await res.json();
            profileData = json?.data?.user || json?.data || json?.user || null;
          }
        } catch (err) {
          console.warn('cookie-based profile check failed', err);
        }
      }

      if (profileData) {
        // Load bookmarks and watchlist from server routes (remain as app routes)
        const headers: Record<string, string> = {};
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        const [bookmarksRes, watchlistRes] = await Promise.all([
          fetch('/api/bookmarks', { headers, credentials: 'include' }),
          fetch('/api/watchlist', { headers, credentials: 'include' })
        ]);
        
        const bookmarksData = await bookmarksRes.json();
        const watchlistData = await watchlistRes.json();
        
        // Normalize NestJS ApiResponse: data.bookmarks or bookmarks
        const bookmarks = bookmarksData?.data?.bookmarks || bookmarksData?.bookmarks || [];
        const watchlist = watchlistData?.data?.watchlist || watchlistData?.watchlist || [];
        
        const bookmarkIds = bookmarks.map((b: any) => b.quizId) || [];
        const watchlistIds = watchlist.map((w: any) => w.quizId) || [];

        setUser({
          ...profileData,
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

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);

    if (!data || !data.success) {
      throw new Error(data?.message || 'Đăng nhập thất bại');
    }

    // Store tokens if present
    try {
      if (data.data?.accessToken) localStorage.setItem('accessToken', data.data.accessToken);
      if (data.data?.refreshToken) localStorage.setItem('refreshToken', data.data.refreshToken);
      if (data.data?.user) localStorage.setItem('user', JSON.stringify(data.data.user));
    } catch (e) {
      // ignore storage errors
    }

    // Load bookmarks and watchlist after login (app routes)
    const headers: Record<string, string> = {};
    if (data.data?.accessToken) {
      headers['Authorization'] = `Bearer ${data.data.accessToken}`;
    }
    
    const [bookmarksRes, watchlistRes] = await Promise.all([
      fetch('/api/bookmarks', { headers, credentials: 'include' }),
      fetch('/api/watchlist', { headers, credentials: 'include' })
    ]);
    
    const bookmarksData = await bookmarksRes.json();
    const watchlistData = await watchlistRes.json();
    
    // Normalize NestJS ApiResponse: data.bookmarks or bookmarks
    const bookmarks = bookmarksData?.data?.bookmarks || bookmarksData?.bookmarks || [];
    const watchlist = watchlistData?.data?.watchlist || watchlistData?.watchlist || [];
    
    const bookmarkIds = bookmarks.map((b: any) => b.quizId) || [];
    const watchlistIds = watchlist.map((w: any) => w.quizId) || [];

    setUser({
      ...(data.data?.user || {}),
      bookmarks: bookmarkIds,
      watchlist: watchlistIds
    });
  };

  const register = async (username: string, email: string, password: string, name: string) => {
    const data = await authApi.register({ username, email, password, name });

    if (!data || !data.success) {
      throw new Error(data?.message || 'Đăng ký thất bại');
    }

    // New user won't have bookmarks/watchlist yet
    setUser({
      ...(data.data?.user || {}),
      bookmarks: [],
      watchlist: []
    });
  };

  const logout = async () => {
    // Prefer cookie-based logout, fall back to token logout if present
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    try {
      if (accessToken) {
        await authApi.logout(accessToken).catch(() => authApi.logoutWithCookie());
      } else {
        await authApi.logoutWithCookie();
      }
    } catch (err) {
      console.warn('Logout failed', err);
    }

    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } catch (e) {}

    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const opts: RequestInit = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    };

    if (accessToken) {
      opts.headers = { ...(opts.headers || {}), Authorization: `Bearer ${accessToken}` } as any;
    } else {
      // If no token, send cookies so server can validate session via cookie
      opts.credentials = 'include';
    }

    const response = await fetch(`${API_URL}/auth/profile`, opts);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Cập nhật thất bại');
    }

    // Normalize returned user shape
    const newUser = data?.data?.user || data?.user || data;
    setUser(newUser);
  };

  const addBookmark = async (quizId: string | number) => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch('/api/bookmarks', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ quizId: String(quizId) })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Add bookmark failed:', response.status, errorData);
      throw new Error(errorData.message || 'Failed to add bookmark');
    }

    if (response.ok && user) {
      // Refresh bookmarks from server
      const bookmarksRes = await fetch('/api/bookmarks', { headers, credentials: 'include' });
      const bookmarksData = await bookmarksRes.json();
      // Normalize NestJS ApiResponse: data.bookmarks or bookmarks
      const bookmarks = bookmarksData?.data?.bookmarks || bookmarksData?.bookmarks || [];
      const bookmarkIds = bookmarks.map((b: any) => b.quizId);
      setUser({ ...user, bookmarks: bookmarkIds });
    }
  };

  const removeBookmark = async (quizId: string | number) => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`/api/bookmarks?quizId=${quizId}`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });

    if (response.ok && user) {
      // Refresh bookmarks from server
      const bookmarksRes = await fetch('/api/bookmarks', { headers, credentials: 'include' });
      const bookmarksData = await bookmarksRes.json();
      // Normalize NestJS ApiResponse: data.bookmarks or bookmarks
      const bookmarks = bookmarksData?.data?.bookmarks || bookmarksData?.bookmarks || [];
      const bookmarkIds = bookmarks.map((b: any) => b.quizId);
      setUser({ ...user, bookmarks: bookmarkIds });
    }
  };

  const addToWatchlist = async (quizId: string | number) => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ quizId: String(quizId) })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Add to watchlist failed:', response.status, errorData);
      throw new Error(errorData.message || 'Failed to add to watchlist');
    }

    if (response.ok && user) {
      // Refresh watchlist from server
      const watchlistRes = await fetch('/api/watchlist', { headers, credentials: 'include' });
      const watchlistData = await watchlistRes.json();
      // Normalize NestJS ApiResponse: data.watchlist or watchlist
      const watchlist = watchlistData?.data?.watchlist || watchlistData?.watchlist || [];
      const watchlistIds = watchlist.map((w: any) => w.quizId);
      setUser({ ...user, watchlist: watchlistIds });
    }
  };

  const removeFromWatchlist = async (quizId: string | number) => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`/api/watchlist?quizId=${quizId}`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
    });

    if (response.ok && user) {
      // Refresh watchlist from server
      const watchlistRes = await fetch('/api/watchlist', { headers, credentials: 'include' });
      const watchlistData = await watchlistRes.json();
      // Normalize NestJS ApiResponse: data.watchlist or watchlist
      const watchlist = watchlistData?.data?.watchlist || watchlistData?.watchlist || [];
      const watchlistIds = watchlist.map((w: any) => w.quizId);
      setUser({ ...user, watchlist: watchlistIds });
    }
  };

  const isBookmarked = (quizId: string | number) => {
    return user?.bookmarks.includes(String(quizId)) || false;
  };

  const isInWatchlist = (quizId: string | number) => {
    return user?.watchlist.includes(String(quizId)) || false;
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
