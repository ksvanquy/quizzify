'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logoutWithCookie } from '../../../app/lib/auth';
import { useAuth } from '../../contexts/AuthContext';

export default function LogoutPage() {
  const { logout: ctxLogout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function doLogout() {
      try {
        // Call NestJS logout which expects cookie and will clear it server-side
        await logoutWithCookie();
      } catch (err) {
        // ignore — logout should be idempotent
        console.warn('Logout API error', err);
      }

      // Clear client-side stored tokens and user
      try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } catch (e) {
        // ignore storage errors
      }

      // Also clear context state if available
      try {
        await ctxLogout();
      } catch (_) {
        // ctxLogout may already call an internal API; ignore errors here
      }

      router.replace('/auth/login');
    }

    doLogout();
  }, [ctxLogout, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <p className="text-gray-500">Đang đăng xuất...</p>
    </div>
  );
}
