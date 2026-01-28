'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Product } from '@/lib/types';

export default function BuyerMarketplace() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'BUYER') {
      router.push('/');
      return;
    }

    loadProducts();
  }, [token, user, router]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProducts({
        search: filters.search || undefined,
        category: filters.category || undefined,
        available: true,
      });
      setProducts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  if (!token) {
    return <div className="container mx-auto py-12 text-center">Redirecting...</div>;
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8">Agricultural Marketplace</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-error">
          {error}
        </div>
      )}

      {/* Search & Filters */}
      <div className="card mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Search Products</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="form-input"
                placeholder="Tomatoes, Maize, etc."
              />
            </div>
            <div>
              <label className="form-label">Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="form-input"
              >
                <option value="">All Categories</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Grains">Grains</option>
                <option value="Fruits">Fruits</option>
                <option value="Roots">Roots & Tubers</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full btn-primary">
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No products found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="card">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}
              <h3 className="text-xl font-bold mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

              <div className="space-y-2 mb-4 text-sm">
                <p><strong>Category:</strong> {product.category}</p>
                <p><strong>Available:</strong> {product.quantity} {product.unit}</p>
                <p className="text-lg font-bold text-green-600">
                  ₦{product.pricePerUnit.toLocaleString()}/{product.unit}
                </p>
              </div>

              {/* Farmer Info */}
              {product.farmerId && (
                <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                  <p className="font-semibold">Farm Information</p>
                  <p className="text-gray-600 text-xs">ID: {product.farmerId}</p>
                </div>
              )}

              <Link
                href={`/buyer/checkout?productId=${product.id}`}
                className="w-full btn-primary block text-center"
              >
                Order Now
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-12 grid md:grid-cols-2 gap-6">
        <Link
          href="/buyer/orders"
          className="card text-center p-8 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-xl font-bold">My Orders</h3>
          <p className="text-gray-600">View and track your orders</p>
        </Link>
        <Link
          href="/auth/login"
          onClick={() => {
            useAuthStore.getState().logout();
            router.push('/');
          }}
          className="card text-center p-8 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">🚪</div>
          <h3 className="text-xl font-bold">Logout</h3>
          <p className="text-gray-600">Sign out from your account</p>
        </Link>
      </div>
    </div>
  );
}
