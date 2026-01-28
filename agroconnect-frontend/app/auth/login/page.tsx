'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';

function LoginForm() {
  const router = useRouter();
  const { login, loading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [localError, setLocalError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) clearError();
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setLocalError('All fields are required');
      return;
    }

    try {
      await login(formData.email, formData.password);
      // Redirect based on role
      const user = useAuthStore.getState().user;
      if (user?.role === 'FARMER') {
        router.push('/farmer/dashboard');
      } else {
        router.push('/buyer/marketplace');
      }
    } catch (err: any) {
      // Error is handled in store
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(error || localError) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-error">
          {error || localError}
        </div>
      )}

      <div>
        <label className="form-label">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="form-input"
          placeholder="farmer@example.com"
          disabled={loading}
        />
      </div>

      <div>
        <label className="form-label">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="form-input"
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <p className="text-center text-gray-600">
        Don't have an account?{' '}
        <Link href="/auth/register" className="text-green-600 hover:underline font-semibold">
          Register here
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="container mx-auto py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Login to AgroConnect</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
