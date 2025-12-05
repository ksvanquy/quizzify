'use client';

import { useAuth } from '@/app/contexts/AuthContext';

export function LogoutButton() {
  const { logout } = useAuth();

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
