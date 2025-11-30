'use client';

import { useRouter } from 'next/navigation';
import LoginForm from '../../components/LoginForm';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();

  const { login } = useAuth();

  const handleSubmit = async ({ username, password }: { username: string; email: string; password: string; name: string; isLogin: boolean }) => {
    try {
      await login(username, password);
      router.push('/');
    } catch (err: any) {
      // rethrow so LoginForm shows the error
      throw err;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <LoginForm initialMode="login" onSubmit={handleSubmit} />
    </div>
  );
}
