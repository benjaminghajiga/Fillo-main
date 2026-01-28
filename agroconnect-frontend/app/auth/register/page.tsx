'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';

function LoadingSpinner() {
  return (
    <div className="inline-block">
      <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, loading, error, clearError } = useAuthStore();
  const initialRole = (searchParams.get('role') || 'BUYER') as 'FARMER' | 'BUYER';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: initialRole,
    location: '',
    farmName: '',
    crops: '',
    companyName: '',
  });

  const [localError, setLocalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear field error for this field
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: '',
      });
    }

    // Clear global errors on change
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
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.location) {
      errors.location = 'Location is required';
    }

    if (formData.role === 'FARMER') {
      if (!formData.farmName) {
        errors.farmName = 'Farm name is required';
      }
    } else if (formData.role === 'BUYER') {
      if (!formData.companyName) {
        errors.companyName = 'Company name is required';
      }
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
      const cropsArray = formData.crops
        ? formData.crops.split(',').map((c) => c.trim()).filter(Boolean)
        : [];

      const payload = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        location: formData.location,
        ...(formData.role === 'FARMER' && {
          farmName: formData.farmName,
          crops: cropsArray,
        }),
        ...(formData.role === 'BUYER' && {
          companyName: formData.companyName,
        }),
      };

      await register(payload);

      // Redirect on success
      const user = useAuthStore.getState().user;
      if (user?.role === 'FARMER') {
        router.push('/farmer/dashboard');
      } else {
        router.push('/buyer/marketplace');
      }
    } catch (err: any) {
      // Error is already handled in store
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Alert */}
      {(error || localError) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold">Registration Error</p>
            <p className="text-sm">{error || localError}</p>
          </div>
        </div>
      )}

      {/* Role Selection */}
      <div>
        <label className="form-label block text-sm font-medium text-gray-700 mb-2">I am a:</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <option value="BUYER">Buyer (Company)</option>
          <option value="FARMER">Farmer</option>
        </select>
      </div>

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

      {/* Location */}
      <div>
        <label className="form-label block text-sm font-medium text-gray-700 mb-2">Location</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className={`form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition ${
            fieldErrors.location ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="City, State/Province"
          disabled={loading}
        />
        {fieldErrors.location && <p className="text-red-500 text-sm mt-1">{fieldErrors.location}</p>}
      </div>

      {/* Farmer-specific fields */}
      {formData.role === 'FARMER' && (
        <>
          <div>
            <label className="form-label block text-sm font-medium text-gray-700 mb-2">Farm Name</label>
            <input
              type="text"
              name="farmName"
              value={formData.farmName}
              onChange={handleChange}
              className={`form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition ${
                fieldErrors.farmName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Your farm name"
              disabled={loading}
            />
            {fieldErrors.farmName && <p className="text-red-500 text-sm mt-1">{fieldErrors.farmName}</p>}
          </div>
          <div>
            <label className="form-label block text-sm font-medium text-gray-700 mb-2">Crops (comma-separated, optional)</label>
            <input
              type="text"
              name="crops"
              value={formData.crops}
              onChange={handleChange}
              className="form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Tomatoes, Maize, Cassava"
              disabled={loading}
            />
          </div>
        </>
      )}

      {/* Buyer-specific fields */}
      {formData.role === 'BUYER' && (
        <div>
          <label className="form-label block text-sm font-medium text-gray-700 mb-2">Company Name</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className={`form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition ${
              fieldErrors.companyName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Your company name"
            disabled={loading}
          />
          {fieldErrors.companyName && <p className="text-red-500 text-sm mt-1">{fieldErrors.companyName}</p>}
        </div>
      )}

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
          placeholder="At least 8 characters"
          disabled={loading}
        />
        {fieldErrors.password && <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>}
        <p className="text-gray-500 text-xs mt-1">Minimum 8 characters</p>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="form-label block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition ${
            fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="••••••••"
          disabled={loading}
        />
        {fieldErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>}
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
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </button>

      {/* Login Link */}
      <p className="text-center text-gray-600 text-sm">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-green-600 hover:underline font-semibold">
          Login here
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">Join AgroConnect</h1>
        <p className="text-center text-gray-600 mb-8">Create your account in minutes</p>
        <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
