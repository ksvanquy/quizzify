'use client';

import LoginForm from '../../components/LoginForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <LoginForm initialMode="register" />
    </div>
  );
}
