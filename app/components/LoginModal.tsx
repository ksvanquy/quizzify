'use client';

// app/components/LoginModal.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function LoginModal({ isOpen, onClose, initialMode = 'login' }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  // Update isLogin when initialMode or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode === 'login');
      setError('');
      setFormData({ username: '', email: '', password: '', name: '' });
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.username, formData.password);
      } else {
        await register(formData.username, formData.email, formData.password, formData.name);
      }
      onClose();
      setFormData({ username: '', email: '', password: '', name: '' });
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ username: '', email: '', password: '', name: '' });
  };

  // Quick login với tài khoản demo
  const quickLogin = (username: string) => {
    setFormData({ ...formData, username, password: 'demo123' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-indigo-100 mt-1 text-sm">
            {isLogin ? 'Chào mừng bạn quay lại!' : 'Tạo tài khoản mới'}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Nguyễn Văn A"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên đăng nhập
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="nguyenvana"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required={!isLogin}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="a.nguyen@example.com"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu {!isLogin && <span className="text-xs text-gray-500">(tối thiểu 6 ký tự)</span>}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng Nhập' : 'Đăng Ký')}
          </button>

          {isLogin && (
            <div className="border-t pt-4 mt-4">
              <p className="text-xs text-gray-500 mb-2">Đăng nhập nhanh:</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => quickLogin('nguyenvana')}
                  className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition"
                >
                  Demo User 1
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('demo')}
                  className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition"
                >
                  Demo User 2
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Password mặc định: demo123
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-center text-sm text-gray-600">
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            {' '}
            <button
              onClick={switchMode}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
