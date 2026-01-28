'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) clearError();
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.password || !formData.location) {
      setLocalError('Email, password, and location are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (formData.role === 'FARMER' && !formData.farmName) {
      setLocalError('Farm name is required for farmers');
      return;
    }

    if (formData.role === 'BUYER' && !formData.companyName) {
      setLocalError('Company name is required for buyers');
      return;
    }

    try {
      const cropsArray = formData.crops
        ? formData.crops.split(',').map((c) => c.trim())
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
      
      // Store user info and redirect
      const user = useAuthStore.getState().user;
      localStorage.setItem('user', JSON.stringify(user));
      
      if (formData.role === 'FARMER') {
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

      {/* Role Selection */}
      <div>
        <label className="form-label">I am a:</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="form-input"
          disabled={loading}
        >
          <option value="BUYER">Buyer (Company)</option>
          <option value="FARMER">Farmer</option>
        </select>
      </div>

      {/* Email */}
      <div>
        <label className="form-label">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="form-input"
          placeholder="your@email.com"
          disabled={loading}
        />
      </div>

      {/* Location */}
      <div>
        <label className="form-label">Location</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="form-input"
          placeholder="City, State/Province"
          disabled={loading}
        />
      </div>

      {/* Farmer-specific fields */}
      {formData.role === 'FARMER' && (
        <>
          <div>
            <label className="form-label">Farm Name</label>
            <input
              type="text"
              name="farmName"
              value={formData.farmName}
              onChange={handleChange}
              className="form-input"
              placeholder="Your farm name"
              disabled={loading}
            />
          </div>
          <div>
            <label className="form-label">Crops (comma-separated)</label>
            <input
              type="text"
              name="crops"
              value={formData.crops}
              onChange={handleChange}
              className="form-input"
              placeholder="Tomatoes, Maize, Cassava"
              disabled={loading}
            />
          </div>
        </>
      )}

      {/* Buyer-specific fields */}
      {formData.role === 'BUYER' && (
        <div>
          <label className="form-label">Company Name</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className="form-input"
            placeholder="Your company name"
            disabled={loading}
          />
        </div>
      )}

      {/* Password */}
      <div>
        <label className="form-label">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="form-input"
          placeholder="At least 8 characters"
          disabled={loading}
        />
      </div>

      {/* Confirm Password */}
      <div>
        <label className="form-label">Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
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
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-center text-gray-600">
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
    <div className="container mx-auto py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-center">Join AgroConnect</h1>
        <p className="text-center text-gray-600 mb-8">Create your account in minutes</p>
        <Suspense fallback={<div>Loading...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
