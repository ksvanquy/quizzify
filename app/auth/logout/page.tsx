'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function LogoutPage() {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    logout();          // Xóa session / token
    router.replace('/login');  // Chuyển về trang login
  }, [logout, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <p className="text-gray-500">Đang đăng xuất...</p>
    </div>
  );
}
