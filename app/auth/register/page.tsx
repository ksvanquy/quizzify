'use client';

import { useRouter } from 'next/navigation';
import LoginForm from '../../components/LoginForm';
import { register as apiRegister } from '../../lib/auth';

export default function RegisterPage() {
  const router = useRouter();

  const handleSubmit = async ({ username, email, password, name }: { username: string; email: string; password: string; name: string; isLogin: boolean }) => {
    const data = await apiRegister({ username, email, password, name });

    if (!data || !data.success) {
      throw new Error(data?.message || 'Đăng ký thất bại');
    }

    // Normalize: data.data may be user or contain user
    const payload = data.data || data;
    const user = payload?.user || payload || null;

    try {
      if (user) localStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
      // ignore storage errors
    }

    // Redirect to login page after successful registration
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <LoginForm initialMode="register" onSubmit={handleSubmit} />
    </div>
  );
}
