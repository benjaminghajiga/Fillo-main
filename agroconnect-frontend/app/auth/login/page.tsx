'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';

function LoadingSpinner() {
  return (
    <div className="inline-block">
      <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const { login, loading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [localError, setLocalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: '',
      });
    }
    if (error) clearError();
    if (localError) setLocalError('');
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
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
      {/* Error Alert */}
      {(error || localError) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold">Login Error</p>
            <p className="text-sm">{error || localError}</p>
          </div>
        </div>
      )}

      {/* Email */}
      <div>
        <label className="form-label block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition ${
            fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="your@email.com"
          disabled={loading}
        />
        {fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="form-label block text-sm font-medium text-gray-700 mb-2">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={`form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition ${
            fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="••••••••"
          disabled={loading}
        />
        {fieldErrors.password && <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <LoadingSpinner />
            Logging in...
          </>
        ) : (
          'Login'
        )}
      </button>

      {/* Register Link */}
      <p className="text-center text-gray-600 text-sm">
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
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">Login to Fillo</h1>
        <p className="text-center text-gray-600 mb-8">Access your account</p>
        <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
